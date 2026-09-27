<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\AdminSetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

class AdminUserController extends Controller
{
    /**
     * List users.
     */
    public function index(Request $request)
    {
        $query = User::query()->orderBy('name');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('status')) {
            if ($request->input('status') === 'active') {
                $query->where('is_active', true);
            }

            if ($request->input('status') === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $users = $query->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Create one user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in([
                'administrator',
                'editor',
                'staff',
            ])],
        ]);

        return $this->createUserAndSendActivation($validated);
    }

    /**
     * Create multiple users.
     */
    public function bulkStore(Request $request)
    {
        $request->validate([
            'users' => ['required', 'array', 'min:1', 'max:100'],
            'users.*.name' => ['required', 'string', 'max:255'],
            'users.*.email' => ['required', 'email', 'max:255'],
            'users.*.role' => ['required', Rule::in([
                'administrator',
                'editor',
                'staff',
            ])],
        ]);

        $users = $request->input('users');

        $results = [];
        $successful = 0;
        $failed = 0;

        /*
         * Check duplicate emails inside the submitted batch.
         */
        $emails = [];

        foreach ($users as $index => $userData) {
            $email = strtolower(trim($userData['email']));

            if (in_array($email, $emails, true)) {
                $results[] = [
                    'row' => $index + 1,
                    'name' => $userData['name'],
                    'email' => $email,
                    'success' => false,
                    'message' => 'This email address appears more than once in this batch.',
                ];

                $failed++;
                continue;
            }

            $emails[] = $email;
        }

        /*
         * Process each user independently.
         */
        foreach ($users as $index => $userData) {
            $email = strtolower(trim($userData['email']));

            /*
             * Skip if this row was already marked as a duplicate.
             */
            $duplicateAlreadyReported = collect($results)
                ->contains(function ($result) use ($index) {
                    return $result['row'] === $index + 1;
                });

            if ($duplicateAlreadyReported) {
                continue;
            }

            /*
             * Check whether email already exists.
             */
            if (User::where('email', $email)->exists()) {
                $results[] = [
                    'row' => $index + 1,
                    'name' => $userData['name'],
                    'email' => $email,
                    'success' => false,
                    'message' => 'A user with this email address already exists.',
                ];

                $failed++;
                continue;
            }

            try {
                $user = User::create([
                    'name' => trim($userData['name']),
                    'email' => $email,
                    'role' => $userData['role'],
                    'password' => Str::random(64),
                    'is_active' => false,
                ]);

                $token = Password::broker()->createToken($user);

                $user->notify(
                    new AdminSetPasswordNotification($token)
                );

                $results[] = [
                    'row' => $index + 1,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'success' => true,
                    'message' => 'Account created and activation email sent.',
                ];

                $successful++;
            } catch (Throwable $e) {
                /*
                 * If the email failed, remove the newly created
                 * inactive account so it can be submitted again.
                 */
                if (isset($user)) {
                    try {
                        $user->delete();
                    } catch (Throwable $deleteException) {
                        Log::error(
                            'Failed to delete user after activation email failure.',
                            [
                                'email' => $email,
                                'error' => $deleteException->getMessage(),
                            ]
                        );
                    }
                }

                Log::error(
                    'Mount View bulk user creation failed.',
                    [
                        'row' => $index + 1,
                        'name' => $userData['name'],
                        'email' => $email,
                        'error' => $e->getMessage(),
                        'exception' => get_class($e),
                    ]
                );

                $results[] = [
                    'row' => $index + 1,
                    'name' => $userData['name'],
                    'email' => $email,
                    'success' => false,
                    'message' => config('app.debug')
                        ? $e->getMessage()
                        : 'The account could not be created because the activation email could not be sent.',
                ];

                $failed++;
            }
        }

        return response()->json([
            'success' => $successful > 0,
            'message' => $successful > 0
                ? "{$successful} user(s) created successfully."
                : 'No users were created.',
            'summary' => [
                'total' => count($users),
                'successful' => $successful,
                'failed' => $failed,
            ],
            'results' => $results,
        ]);
    }

    /**
     * Create a user and send activation email.
     */
    private function createUserAndSendActivation(array $validated)
    {
        $user = User::create([
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'role' => $validated['role'],
            'password' => Str::random(64),
            'is_active' => false,
        ]);

        try {
            $token = Password::broker()->createToken($user);

            $user->notify(
                new AdminSetPasswordNotification($token)
            );

            return response()->json([
                'success' => true,
                'message' => 'User created and activation email sent successfully.',
                'user' => $this->formatUser($user),
            ], 201);
        } catch (Throwable $e) {
            Log::error(
                'Mount View admin activation email failed.',
                [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                    'exception' => get_class($e),
                ]
            );

            $user->delete();

            return response()->json([
                'success' => false,
                'message' => 'The user could not be created because the activation email could not be sent.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : 'Please check the mail server configuration.',
            ], 500);
        }
    }

    /**
     * Show user.
     */
    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Update user.
     */
    public function update(Request $request, User $user)
    {
        $currentUser = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'role' => ['required', Rule::in([
                'administrator',
                'editor',
                'staff',
            ])],
            'is_active' => ['required', 'boolean'],
        ]);

        if (
            $currentUser &&
            $currentUser->id === $user->id &&
            !$validated['is_active']
        ) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot deactivate your own account.',
            ], 422);
        }

        if (
            $currentUser &&
            $currentUser->id === $user->id &&
            $validated['role'] !== 'administrator'
        ) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot remove your own administrator role.',
            ], 422);
        }

        $emailChanged = $user->email !== $validated['email'];
        $wasActive = $user->is_active;

        $user->update([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'role' => $validated['role'],
            'is_active' => $validated['is_active'],
        ]);

        if ($emailChanged && $wasActive && $user->is_active) {
            try {
                $token = Password::broker()->createToken($user);

                $user->notify(
                    new AdminSetPasswordNotification($token)
                );

                return response()->json([
                    'success' => true,
                    'message' => 'User updated successfully and a new password link was sent.',
                    'user' => $this->formatUser($user),
                ]);
            } catch (Throwable $e) {
                Log::error(
                    'Mount View admin email-change notification failed.',
                    [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'error' => $e->getMessage(),
                    ]
                );

                return response()->json([
                    'success' => false,
                    'message' => 'The user details were updated, but the email could not be sent.',
                    'error' => config('app.debug')
                        ? $e->getMessage()
                        : 'Please check the mail server configuration.',
                    'user' => $this->formatUser($user),
                ], 500);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Reset password.
     */
    public function resetPassword(User $user)
    {
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This account has not been activated yet. Resend the activation email instead.',
            ], 422);
        }

        try {
            $token = Password::broker()->createToken($user);

            $user->notify(
                new AdminSetPasswordNotification($token)
            );

            return response()->json([
                'success' => true,
                'message' => 'Password reset email sent successfully.',
            ]);
        } catch (Throwable $e) {
            Log::error(
                'Mount View admin password reset email failed.',
                [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]
            );

            return response()->json([
                'success' => false,
                'message' => 'The password reset email could not be sent.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : 'Please check the mail server configuration.',
            ], 500);
        }
    }

    /**
     * Resend activation.
     */
    public function resendActivation(User $user)
    {
        if ($user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This account is already active. Use Reset Password instead.',
            ], 422);
        }

        try {
            $token = Password::broker()->createToken($user);

            $user->notify(
                new AdminSetPasswordNotification($token)
            );

            return response()->json([
                'success' => true,
                'message' => 'Activation email sent successfully.',
            ]);
        } catch (Throwable $e) {
            Log::error(
                'Mount View admin activation resend failed.',
                [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]
            );

            return response()->json([
                'success' => false,
                'message' => 'The activation email could not be sent.',
                'error' => config('app.debug')
                    ? $e->getMessage()
                    : 'Please check the mail server configuration.',
            ], 500);
        }
    }

    /**
     * Delete user.
     */
    public function destroy(Request $request, User $user)
    {
        $currentUser = $request->user();

        if ($currentUser && $currentUser->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully.',
        ]);
    }

    /**
     * Format user.
     */
    private function formatUser(User $user): array
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