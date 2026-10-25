<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Every role permitted to enter the administration portal.
     *
     * Parent / guardian roles are included here ONLY so they can hit the
     * identity endpoints (/admin/user, /admin/profile, /admin/logout,
     * /admin/portal/capabilities) and their own /admin/parent/* routes.
     * Every other controller checks its own role list before acting.
     */
    public const PORTAL_ROLES = [
        // Superusers
        'admin', 'administrator', 'super_admin', 'superadmin',

        // School leadership
        'headteacher', 'head_teacher', 'principal',
        'vice_principal', 'deputy_head', 'head',
        'hod', 'head_of_department',
        'head_of_subject', 'subject_head',

        // Finance & admissions
        'admissions_officer', 'admissions',
        'bursar', 'finance', 'accountant',

        // Teaching staff — classroom roles
        'lead_teacher', 'class_teacher', 'assistant_teacher',
        'teacher',
        'teaching_assistant', 'ta',
        'stream_lead', 'club_lead',

        // Specialist teachers (all variants)
        'specialist', 'specialist_teacher', 'special_teacher', 'spec_teacher',
        'subject_teacher',
        'music_teacher', 'art_teacher', 'pe_teacher', 'sports_teacher',
        'ict_teacher', 'computing_teacher', 'computer_teacher',
        'swimming_teacher', 'dance_teacher', 'drama_teacher',
        'language_teacher', 'languages_teacher', 'foreign_language_teacher',
        'reading_teacher', 'library_teacher', 'librarian',
        'science_teacher', 'maths_teacher', 'math_teacher',
        'english_teacher', 'history_teacher', 'geography_teacher',

        // Parents / guardians (student account holders)
        'parent', 'guardian',

        // Generic staff
        'editor', 'content_editor', 'staff',
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

        $role = $this->normaliseRole((string) $user->role);

        if (!in_array($role, self::PORTAL_ROLES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to access the administration portal.',
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