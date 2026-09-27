<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive.',
            ], 403);
        }

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

        return $next($request);
    }
}