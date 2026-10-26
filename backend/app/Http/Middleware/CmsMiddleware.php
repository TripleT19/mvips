<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CmsMiddleware
{
    /**
     * Roles allowed to manage website content (stories, events, gallery,
     * newsletters, contact messages, categories).
     *
     * Tune this list to match the `role` column on your users table.
     */
    protected array $allowedRoles = [
        'administrator',
        'principal',
        'headteacher',
        'content_manager',
        'communications_officer',
        'editor',
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