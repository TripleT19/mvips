<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    /**
     * Admin login.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => [
                'required',
                'email',
            ],

            'password' => [
                'required',
                'string',
            ],

            'remember' => [
                'nullable',
                'boolean',
            ],
        ]);

        $user = \App\Models\User::where(
            'email',
            $validated['email']
        )->first();

        /*
        |--------------------------------------------------------------------------
        | Check credentials
        |--------------------------------------------------------------------------
        */
        if (
            !$user ||
            !Hash::check(
                $validated['password'],
                $user->password
            )
        ) {
            throw ValidationException::withMessages([
                'email' => [
                    'The email or password is incorrect.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Account must be active
        |--------------------------------------------------------------------------
        */
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has not been activated yet. Please check your email for the activation link.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Only administration users may access the portal
        |--------------------------------------------------------------------------
        */
        if (
            !in_array(
                $user->role,
                [
                    'administrator',
                    'admin',
                    'editor',
                    'staff',
                ],
                true
            )
        ) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to access the administration portal.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Remember me
        |--------------------------------------------------------------------------
        |
        | Normal login token:
        | 12 hours
        |
        | Remembered login:
        | 30 days
        |
        */
        $expiresAt = now()->addHours(12);

        if (!empty($validated['remember'])) {
            $expiresAt = now()->addDays(30);
        }

        /*
        |--------------------------------------------------------------------------
        | Remove previous admin tokens
        |--------------------------------------------------------------------------
        |
        | This keeps the account from accumulating old tokens.
        |
        */
        $user->tokens()->delete();

        /*
        |--------------------------------------------------------------------------
        | Create Sanctum token
        |--------------------------------------------------------------------------
        */
        $token = $user->createToken(
            'mount-view-admin',
            ['admin'],
            $expiresAt
        )->plainTextToken;

        return response()->json([
            'success' => true,

            'message' => 'Login successful.',

            'token' => $token,

            'expires_at' => $expiresAt->toISOString(),

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => (bool) $user->is_active,
            ],
        ]);
    }


    /**
     * Return the currently authenticated admin user.
     */
    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => (bool) $user->is_active,
            ],
        ]);
    }


    /**
     * Logout the current admin.
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Revoke only the token currently being used
        |--------------------------------------------------------------------------
        */
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'You have been logged out successfully.',
        ]);
    }


    /**
     * Activate a newly created admin account
     * and allow the user to create their password.
     */
    public function activateAccount(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Validate activation request
        |--------------------------------------------------------------------------
        */
        $validated = $request->validate([
            'token' => [
                'required',
                'string',
            ],

            'email' => [
                'required',
                'email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Reset password using Laravel Password Broker
        |--------------------------------------------------------------------------
        */
        $status = Password::broker()->reset(
            [
                'email' => $validated['email'],

                'password' => $validated['password'],

                /*
                |--------------------------------------------------------------------------
                | IMPORTANT
                |--------------------------------------------------------------------------
                | Use input() here rather than assuming the confirmation
                | field exists inside the validated array.
                |--------------------------------------------------------------------------
                */
                'password_confirmation' => $request->input(
                    'password_confirmation'
                ),

                'token' => $validated['token'],
            ],

            function ($user, $password) {

                /*
                |--------------------------------------------------------------------------
                | Set password and activate account
                |--------------------------------------------------------------------------
                */
                $user->forceFill([
                    'password' => Hash::make($password),
                    'is_active' => true,
                ])->save();

                /*
                |--------------------------------------------------------------------------
                | Revoke existing tokens
                |--------------------------------------------------------------------------
                */
                $user->tokens()->delete();
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Activation failed
        |--------------------------------------------------------------------------
        */
        if ($status !== Password::PASSWORD_RESET) {

            return response()->json([
                'success' => false,

                'message' => match ($status) {

                    Password::INVALID_TOKEN =>
                        'This activation link is invalid or has expired.',

                    Password::INVALID_USER =>
                        'We could not find an account associated with this email address.',

                    default =>
                        __($status),
                },

                'status' => $status,
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Activation successful
        |--------------------------------------------------------------------------
        */
        return response()->json([
            'success' => true,

            'message' =>
                'Your account has been activated successfully. You can now sign in.',
        ]);
    }
}