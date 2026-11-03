<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AlumniApproverMiddleware
{
    /**
     * Only administrators and headteacher-level roles may approve,
     * reject or delete alumni submissions.
     *
     * Deliberately NOT reusing AdminMiddleware::PORTAL_ROLES — that
     * list includes parents and teachers, which must not approve
     * other alumni's submissions.
     */
    public const APPROVER_ROLES = [
        // Superusers
        'admin', 'administrator', 'super_admin', 'superadmin',

        // Headteacher tier
        'headteacher', 'head_teacher', 'principal', 'head',
        'deputy_head', 'vice_principal',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $role = $this->normaliseRole((string) $user->role);

        if (! in_array($role, self::APPROVER_ROLES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators and headteachers can review alumni submissions.',
                'role'    => $user->role,
            ], 403);
        }

        return $next($request);
    }

    private function normaliseRole(string $role): string
    {
        $role = strtolower(trim($role));
        $role = preg_replace('/[\s\-\.]+/', '_', $role);
        return trim(preg_replace('/_+/', '_', $role), '_');
    }
}