<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdministratorMiddleware
{
    /**
     * Only true administrators may manage users.
     */
    public function handle(Request $request, Closure $next): Response
    {
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
                'message' => 'Your account has not been activated yet.',
            ], 403);
        }

        if (!in_array($user->role, ['administrator', 'admin'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can access this resource.',
            ], 403);
        }

        return $next($request);
    }
}