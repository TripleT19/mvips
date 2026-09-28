<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Allow active CMS users to access the admin portal.
     *
     * Roles:
     * - administrator
     * - editor
     * - staff
     */
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Must be authenticated
        |--------------------------------------------------------------------------
        */

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | Account must be active
        |--------------------------------------------------------------------------
        */

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Allowed CMS roles
        |--------------------------------------------------------------------------
        */

        $allowedRoles = [
            'administrator',
            'editor',
            'staff',
        ];

        if (!in_array($user->role, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to the administration portal.',
            ], 403);
        }

        return $next($request);
    }
}

