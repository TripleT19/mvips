<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CmsMiddleware
{
    /**
     * Roles allowed to manage website content
     * (stories, events, gallery, newsletters, contact messages,
     *  policies, categories, leadership activities, houses,
     *  top achievers).
     *
     * As of this release, CMS is ADMIN ONLY — matching the admin
     * sidebar which now hides CMS links from all other roles.
     */
    protected array $allowedRoles = [
        'admin',
        'administrator',
        'super_admin',
        'superadmin',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $role = strtolower(trim((string) ($user->role ?? '')));

        if (! in_array($role, $this->allowedRoles, true)) {
            return response()->json([
                'message' => 'You do not have permission to manage website content.',
            ], 403);
        }

        return $next($request);
    }
}