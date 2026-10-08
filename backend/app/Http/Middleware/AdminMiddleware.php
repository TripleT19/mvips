<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Roles allowed to access the general CMS module
     * (stories, events, gallery, media, settings, dashboard).
     *
     * Administrator, editor and staff have CMS access but no admissions.
     * Admissions officers, headteachers and principals also have CMS
     * access (alongside the admissions module).
     */
    protected array $allowedRoles = [
        'administrator',
        'admin',
        'editor',
        'staff',
        'admissions_officer',
        'headteacher',
        'principal',
    ];

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

        if (!in_array($user->role, $this->allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}