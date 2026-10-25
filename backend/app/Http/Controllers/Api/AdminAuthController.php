<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    /**
     * Every role permitted to sign in to the administration portal.
     *
     * Canonical values come first. Every legacy value is preserved so
     * accounts created before the role refactor keep working.
     *
     * Keep in sync with:
     *   • AdminMiddleware::PORTAL_ROLES
     *   • AdminUserController::$assignableRoles
     *   • Frontend ROLE_OPTIONS constant
     */
    private const ALLOWED_ROLES = [
        // ── Superusers ──
        'admin',
        'administrator',
        'super_admin',
        'superadmin',

        // ── School leadership ──
        'headteacher',
        'head_teacher',
        'principal',
        'vice_principal',
        'deputy_head',
        'head',
        'hod',
        'head_of_department',
        'head_of_subject',
        'subject_head',

        // ── Finance & admissions ──
        'admissions_officer',
        'admissions',
        'bursar',
        'finance',
        'accountant',

        // ── Classroom roles ──
        'lead_teacher',
        'class_teacher',
        'assistant_teacher',
        'teacher',
        'teaching_assistant',
        'ta',
        'stream_lead',
        'club_lead',

        // ── Specialist teachers (all variants) ──
        'specialist',
        'specialist_teacher',
        'special_teacher',
        'spec_teacher',
        'subject_teacher',
        'music_teacher',
        'art_teacher',
        'pe_teacher',
        'sports_teacher',
        'ict_teacher',
        'computing_teacher',
        'computer_teacher',
        'swimming_teacher',
        'dance_teacher',
        'drama_teacher',
        'language_teacher',
        'languages_teacher',
        'foreign_language_teacher',
        'reading_teacher',
        'library_teacher',
        'librarian',
        'science_teacher',
        'maths_teacher',
        'math_teacher',
        'english_teacher',
        'history_teacher',
        'geography_teacher',

        // ── Content / generic staff ──
        'editor',
        'content_editor',
        'staff',
    ];

    /**
     * Maximum failed login attempts before temporary lockout.
     */
    private const MAX_LOGIN_ATTEMPTS = 5;

    /**
     * Lockout window in seconds (15 minutes).
     */
    private const LOGIN_LOCKOUT_SECONDS = 900;

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    /**
     * Authenticate an admin and issue a Sanctum token.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $email = strtolower(trim($validated['email']));
        $throttleKey = $this->throttleKey($request, $email);

        /*
        |--------------------------------------------------------------------------
        | 1. Rate limit
        |--------------------------------------------------------------------------
        */
        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'success' => false,
                'message' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }

        /*
        |--------------------------------------------------------------------------
        | 2. Credentials
        |--------------------------------------------------------------------------
        */
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($throttleKey, self::LOGIN_LOCKOUT_SECONDS);

            throw ValidationException::withMessages([
                'email' => ['The email or password is incorrect.'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | 3. Account activation
        |--------------------------------------------------------------------------
        */
        if (!$user->is_active) {
            RateLimiter::hit($throttleKey, self::LOGIN_LOCKOUT_SECONDS);

            return response()->json([
                'success' => false,
                'message' => 'Your account has not been activated yet. Please check your email for the activation link.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | 4. Role gate — only administration roles may sign in
        |--------------------------------------------------------------------------
        */
        if (!$this->isAdminPortalRole($user->role)) {
            RateLimiter::hit($throttleKey, self::LOGIN_LOCKOUT_SECONDS);

            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to access the administration portal.',
                'role'    => $user->role,
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | 5. Success — clear the limiter
        |--------------------------------------------------------------------------
        */
        RateLimiter::clear($throttleKey);

        /*
        |--------------------------------------------------------------------------
        | 6. Token lifetime
        |--------------------------------------------------------------------------
        |
        | Normal login   → 12 hours
        | Remember me    → 30 days
        |
        */
        $expiresAt = $request->boolean('remember')
            ? now()->addDays(30)
            : now()->addHours(12);

        /*
        |--------------------------------------------------------------------------
        | 7. Revoke previous tokens, issue a fresh one
        |--------------------------------------------------------------------------
        */
        $user->tokens()->delete();

        $token = $user->createToken(
            'mount-view-admin',
            ['admin'],
            $expiresAt
        )->plainTextToken;

        return response()->json([
            'success'    => true,
            'message'    => 'Login successful.',
            'token'      => $token,
            'expires_at' => $expiresAt->toISOString(),
            'user'       => $this->formatUser($user),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT USER
    |--------------------------------------------------------------------------
    */

    /**
     * Return the currently authenticated admin user.
     */
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'user'    => $this->formatUser($request->user()),
        ]);
    }

    /**
     * Alias for `user()` — some clients call `/me`.
     */
    public function me(Request $request)
    {
        return $this->user($request);
    }

    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    /**
     * Revoke only the token used for this request.
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'You have been logged out successfully.',
        ]);
    }

    /**
     * Revoke every token for the authenticated user.
     */
    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'You have been logged out from all devices.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATION
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a newly created admin account and set its password.
     */
    public function activateAccount(Request $request)
    {
        $validated = $request->validate([
            'token'    => ['required', 'string'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $email = strtolower(trim($validated['email']));

        /*
        |--------------------------------------------------------------------------
        | Guard — only admin-portal accounts may be activated
        |--------------------------------------------------------------------------
        */
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'We could not find an account associated with this email address.',
            ], 422);
        }

        if (!$this->isAdminPortalRole($user->role)) {
            return response()->json([
                'success' => false,
                'message' => 'This account is not permitted to use the administration portal.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Reset password via the Laravel password broker
        |--------------------------------------------------------------------------
        */
        $status = Password::broker()->reset(
            [
                'email'                 => $email,
                'password'              => $validated['password'],
                'password_confirmation' => $request->input('password_confirmation'),
                'token'                 => $validated['token'],
            ],
            function (User $user, string $password) {
                $user->forceFill([
                    'password'  => $password,   // 'hashed' cast handles the hash
                    'is_active' => true,
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'success' => false,
                'message' => match ($status) {
                    Password::INVALID_TOKEN =>
                        'This activation link is invalid or has expired.',
                    Password::INVALID_USER =>
                        'We could not find an account associated with this email address.',
                    default => __($status),
                },
                'status' => $status,
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Your account has been activated successfully. You can now sign in.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Whether a role value is allowed to sign in to the admin portal.
     * Accepts both canonical and legacy values (see ALLOWED_ROLES).
     *
     * Normalises the value first so casing / separators don't matter:
     *   "Specialist Teacher"     → "specialist_teacher"
     *   "specialist-teacher"     → "specialist_teacher"
     *   "SPECIALIST_TEACHER"     → "specialist_teacher"
     */
    private function isAdminPortalRole(?string $role): bool
    {
        if (!$role) {
            return false;
        }

        $normalised = $this->normaliseRole($role);

        if (in_array($normalised, self::ALLOWED_ROLES, true)) {
            return true;
        }

        // Safety net — any role containing these keywords is a teacher
        // and therefore permitted into the portal. Add new keywords here
        // sparingly; this is a fallback for typos / new role names.
        foreach (['teacher', 'specialist', 'instructor', 'tutor', 'librarian'] as $keyword) {
            if (str_contains($normalised, $keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * "Specialist Teacher" / "specialist-teacher" / "SPECIALIST_TEACHER"
     * → "specialist_teacher"
     */
    private function normaliseRole(string $role): string
    {
        $role = strtolower(trim($role));
        $role = preg_replace('/[\s\-\.]+/', '_', $role);
        $role = preg_replace('/_+/', '_', $role);
        return trim($role, '_');
    }

    /**
     * Rate-limit key: lowercase email + client IP.
     */
    private function throttleKey(Request $request, string $email): string
    {
        return Str::lower($email) . '|' . $request->ip();
    }

    /**
     * Shape the user payload returned to the frontend.
     */
    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'is_active'  => (bool) $user->is_active,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}