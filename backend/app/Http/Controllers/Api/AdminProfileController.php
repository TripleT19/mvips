<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AdminProfileController extends Controller
{
    /**
     * Get the currently authenticated user's profile.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => $this->formatUser($user),
        ]);
    }

    /**
     * Update the currently authenticated user's profile.
     *
     * Users can only change their own name.
     *
     * Email, role and account status cannot be changed here.
     * Email and account permissions are managed by an administrator
     * through the Users section.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
        ]);

        $user->update([
            'name' => trim($validated['name']),
        ]);

        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => $this->formatUser($user),
        ]);
    }

    /**
     * Change the currently authenticated user's password.
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => [
                'required',
                'current_password',
            ],

            'password' => [
                'required',
                'confirmed',
                Password::min(8),
            ],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        /*
        |--------------------------------------------------------------------------
        | Revoke all existing API tokens
        |--------------------------------------------------------------------------
        |
        | This logs the account out from other active API sessions.
        |
        */

        $user->tokens()->delete();

        /*
        |--------------------------------------------------------------------------
        | Create a fresh token for the current session
        |--------------------------------------------------------------------------
        */

        $token = $user
            ->createToken('admin-token')
            ->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
            'token' => $token,
            'data' => $this->formatUser($user->fresh()),
        ]);
    }

    /**
     * Format user information returned to the frontend.
     *
     * Sensitive information such as the password is never returned.
     */
    private function formatUser($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => (bool) $user->is_active,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}
