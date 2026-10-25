<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\ParentSetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Throwable;

class ParentAuthController extends Controller
{
    private const PARENT_ROLES = ['parent', 'guardian'];
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOGIN_LOCKOUT_SECONDS = 900;

    /* ============================================================
     * LOGIN
     * ============================================================ */

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $email = strtolower(trim($validated['email']));
        $throttleKey = 'parent-login:' . $email . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Too many attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($throttleKey, self::LOGIN_LOCKOUT_SECONDS);
            throw ValidationException::withMessages([
                'email' => ['The email or password is incorrect.'],
            ]);
        }

        $role = strtolower(trim((string) $user->role));
        if (!in_array($role, self::PARENT_ROLES, true)) {
            RateLimiter::hit($throttleKey, self::LOGIN_LOCKOUT_SECONDS);
            return response()->json([
                'success' => false,
                'message' => 'This login is for parents and guardians only. Please use the staff login if you are a staff member.',
            ], 403);
        }

        if (!$user->is_active) {
            RateLimiter::hit($throttleKey, self::LOGIN_LOCKOUT_SECONDS);
            return response()->json([
                'success' => false,
                'message' => 'Your account is not active yet. Please check your email for the activation link, or use the "Forgot password" option.',
            ], 403);
        }

        if (!$user->students()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not linked to any students yet. Please contact the school office.',
            ], 403);
        }

        RateLimiter::clear($throttleKey);

        $expiresAt = $request->boolean('remember')
            ? now()->addDays(30)
            : now()->addHours(12);

        $user->tokens()->delete();

        $token = $user->createToken('mount-view-parent', ['parent'], $expiresAt)->plainTextToken;

        return response()->json([
            'success'    => true,
            'message'    => 'Login successful.',
            'token'      => $token,
            'expires_at' => $expiresAt->toISOString(),
            'user'       => $this->formatUser($user),
        ]);
    }

    /* ============================================================
     * ACTIVATE
     * ============================================================ */

    public function activateAccount(Request $request)
    {
        $validated = $request->validate([
            'token'    => ['required', 'string'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        return $this->resetWithRoleCheck($request, $validated, activation: true);
    }

    /* ============================================================
     * FORGOT PASSWORD
     * ============================================================ */

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = strtolower(trim($validated['email']));
        $user = User::where('email', $email)->first();

        // Always return success to prevent user enumeration
        if ($user) {
            $role = strtolower(trim((string) $user->role));
            if (in_array($role, self::PARENT_ROLES, true)) {
                try {
                    $token = Password::broker()->createToken($user);
                    $user->notify(new ParentSetPasswordNotification(
                        $token,
                        ParentSetPasswordNotification::TYPE_RESET
                    ));
                } catch (Throwable $e) {
                    Log::warning('Parent password reset email failed', [
                        'email' => $email,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'If that email matches a parent account, we have sent a password reset link.',
        ]);
    }

    /* ============================================================
     * RESET PASSWORD
     * ============================================================ */

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token'    => ['required', 'string'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        return $this->resetWithRoleCheck($request, $validated, activation: false);
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    private function resetWithRoleCheck(Request $request, array $validated, bool $activation)
    {
        $email = strtolower(trim($validated['email']));
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'We could not find an account associated with this email address.',
            ], 422);
        }

        $role = strtolower(trim((string) $user->role));
        if (!in_array($role, self::PARENT_ROLES, true)) {
            return response()->json([
                'success' => false,
                'message' => $activation
                    ? 'This activation link is for parent accounts only.'
                    : 'This reset link is for parent accounts only.',
            ], 403);
        }

        $status = Password::broker()->reset(
            [
                'email'                 => $email,
                'password'              => $validated['password'],
                'password_confirmation' => $request->input('password_confirmation'),
                'token'                 => $validated['token'],
            ],
            function (User $user, string $password) {
                $user->forceFill([
                    'password'  => $password,
                    'is_active' => true,
                ])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'success' => false,
                'message' => match ($status) {
                    Password::INVALID_TOKEN => $activation
                        ? 'This activation link is invalid or has expired.'
                        : 'This reset link is invalid or has expired.',
                    Password::INVALID_USER  => 'We could not find an account associated with this email address.',
                    default => __($status),
                },
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $activation
                ? 'Your account is now active. You can sign in.'
                : 'Your password has been reset. You can sign in.',
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'role'      => $user->role,
            'is_active' => (bool) $user->is_active,
        ];
    }
}