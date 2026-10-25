<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\TeacherAssignment;
use App\Support\TeacherRoles;
use Illuminate\Http\Request;

class PortalCapabilityController extends Controller
{
    private const PARENT_ROLES = ['parent', 'guardian'];

    private const BURSAR_ROLES = ['bursar', 'finance', 'accountant'];

    private const ADMISSIONS_ROLES = ['admissions_officer', 'admissions'];

    private const CMS_ROLES = [
        'admin', 'administrator', 'super_admin', 'superadmin',
        'headteacher', 'head_teacher', 'principal',
        'hod', 'head_of_department', 'head_of_subject', 'subject_head',
        'lead_teacher', 'class_teacher',
        'specialist', 'specialist_teacher', 'special_teacher', 'spec_teacher',
    ];

    public function show(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $role = TeacherRoles::normalise((string) ($user->role ?? ''));
        $isParent = in_array($role, self::PARENT_ROLES, true);
        $isSpecialist = $role !== null && TeacherRoles::isSpecialist($role);
        $isBursar = in_array($role, self::BURSAR_ROLES, true);
        $isAdmissions = in_array($role, self::ADMISSIONS_ROLES, true);

        $canCms = in_array($role, self::CMS_ROLES, true) || str_ends_with((string) $role, '_teacher');

        $hasCoreSubjectAssignment = false;
        $hasAnyAssignment = false;
        $hasClubLead = false;

        if (!$isParent && $role !== null) {
            $yearId = AcademicYear::where('is_current', true)->value('id');

            if ($yearId) {
                $hasAnyAssignment = TeacherAssignment::where('user_id', $user->id)
                    ->where('academic_year_id', $yearId)
                    ->where('is_active', true)
                    ->exists();

                if ($isSpecialist) {
                    $hasCoreSubjectAssignment = TeacherAssignment::where('user_id', $user->id)
                        ->where('academic_year_id', $yearId)
                        ->where('is_active', true)
                        ->where('role', TeacherAssignment::ROLE_SUBJECT_TEACHER)
                        ->whereHas('subject', fn ($q) => $q->where('subject_group', 'core'))
                        ->exists();
                }

                $hasClubLead = TeacherAssignment::where('user_id', $user->id)
                    ->where('academic_year_id', $yearId)
                    ->where('is_active', true)
                    ->where('role', TeacherAssignment::ROLE_CLUB_LEAD)
                    ->exists();
            }
        }

        // Does the parent have any linked children?
        $hasChildren = false;
        if ($isParent) {
            $hasChildren = $user->students()->where('status', 'active')->exists();
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'role'                        => $role,
                'is_parent'                   => $isParent,
                'is_staff'                    => !$isParent,
                'is_specialist'               => $isSpecialist,
                'is_bursar'                   => $isBursar,
                'is_admissions'               => $isAdmissions,
                'can_cms'                     => $canCms,
                'has_any_assignment'          => $hasAnyAssignment,
                'has_core_subject_assignment' => $hasCoreSubjectAssignment,
                'has_club_lead'               => $hasClubLead,
                'has_children'                => $hasChildren,
            ],
        ]);
    }
}