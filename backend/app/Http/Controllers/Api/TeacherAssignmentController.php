<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassStream;
use App\Models\TeacherAssignment;
use App\Models\User;
use App\Support\TeacherRoles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TeacherAssignmentController extends Controller
{
    public const TEACHER_ROLES = TeacherRoles::ALL;

    public const ASSIGNMENT_ROLES = [
        TeacherAssignment::ROLE_CLASS_TEACHER,
        TeacherAssignment::ROLE_LEAD_TEACHER,
        TeacherAssignment::ROLE_SUBJECT_TEACHER,
        TeacherAssignment::ROLE_ASSISTANT_TEACHER,
        TeacherAssignment::ROLE_CLUB_LEAD,
    ];

    /* ============================================================
     * INDEX
     * ============================================================ */

    public function index(Request $request)
    {
        $query = TeacherAssignment::with([
            'user:id,name,email,role',
            'schoolClass:id,name',
            'classStream:id,name,stream_id,school_class_id',
            'classStream.stream:id,name,code,colour',
            'subject:id,name,code,subject_group',
            'club:id,name,colour',
            'academicYear:id,name',
        ]);

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->input('academic_year_id'));
        }
        if ($request->filled('class_stream_id')) {
            $query->where('class_stream_id', $request->input('class_stream_id'));
        }
        if ($request->filled('school_class_id')) {
            $query->where('school_class_id', $request->input('school_class_id'));
        }
        if ($request->filled('stream_id')) {
            $streamId = (int) $request->input('stream_id');
            $query->whereHas('classStream', fn ($q) => $q->where('stream_id', $streamId));
        }
        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->input('subject_id'));
        }
        if ($request->filled('club_id')) {
            $query->where('club_id', $request->input('club_id'));
        }
        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }
        if ($request->filled('status')) {
            $query->where('is_active', $request->input('status') === 'active');
        }
        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->whereHas('user', function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $query
                ->orderBy('role')
                ->orderBy('class_stream_id')
                ->orderBy('subject_id')
                ->get(),
        ]);
    }

    /* ============================================================
     * STORE — single assignment
     * ------------------------------------------------------------
     * Sending `is_lead_teacher: true` on a class_teacher also
     * creates the matching lead_teacher record for the same user.
     * ============================================================ */

    public function store(Request $request)
    {
        $this->guard($request);

        $validated = $request->validate([
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'user_id'          => ['required', 'integer', 'exists:users,id'],
            'role'             => ['required', Rule::in(self::ASSIGNMENT_ROLES)],
            'class_stream_id'  => ['nullable', 'integer', 'exists:class_streams,id'],
            'school_class_id'  => ['nullable', 'integer', 'exists:school_classes,id'],
            'subject_id'       => ['nullable', 'integer', 'exists:subjects,id'],
            'club_id'          => ['nullable', 'integer', 'exists:clubs,id'],
            'is_lead_teacher'  => ['nullable', 'boolean'],
        ]);

        $resolved = $this->resolveTarget($validated);
        if ($resolved instanceof \Illuminate\Http\JsonResponse) {
            return $resolved;
        }

        $user = User::findOrFail($validated['user_id']);
        if (!TeacherRoles::isTeacher($user->role)) {
            return $this->fail('This user cannot be assigned.');
        }

        // is_lead_teacher only makes sense for class_teacher
        $isLeadTeacher = false;
        if ($resolved['role'] === TeacherAssignment::ROLE_CLASS_TEACHER) {
            $isLeadTeacher = (bool) ($validated['is_lead_teacher'] ?? false);
        } elseif (!empty($validated['is_lead_teacher'])) {
            return $this->fail('is_lead_teacher is only valid for class teacher assignments.');
        }

        $created = DB::transaction(function () use ($validated, $resolved, $isLeadTeacher) {
            $out = [];

            if ($resolved['role'] === TeacherAssignment::ROLE_CLASS_TEACHER) {
                // Replacing the class teacher also vacates the lead role
                $this->deactivateExisting(
                    (int) $validated['academic_year_id'],
                    TeacherAssignment::ROLE_CLASS_TEACHER,
                    $resolved['class_stream_id'],
                    $resolved['school_class_id'],
                    null,
                    null
                );
                $this->deactivateExisting(
                    (int) $validated['academic_year_id'],
                    TeacherAssignment::ROLE_LEAD_TEACHER,
                    $resolved['class_stream_id'],
                    $resolved['school_class_id'],
                    null,
                    null
                );
            } else {
                $this->deactivateExisting(
                    (int) $validated['academic_year_id'],
                    $resolved['role'],
                    $resolved['class_stream_id'],
                    $resolved['school_class_id'],
                    $resolved['subject_id'],
                    $resolved['club_id']
                );
            }

            $out[] = TeacherAssignment::create([
                'academic_year_id' => $validated['academic_year_id'],
                'user_id'          => $validated['user_id'],
                'role'             => $resolved['role'],
                'school_class_id'  => $resolved['school_class_id'],
                'class_stream_id'  => $resolved['class_stream_id'],
                'subject_id'       => $resolved['subject_id'],
                'club_id'          => $resolved['club_id'],
                'is_active'        => true,
            ]);

            if ($isLeadTeacher) {
                $out[] = TeacherAssignment::create([
                    'academic_year_id' => $validated['academic_year_id'],
                    'user_id'          => $validated['user_id'],
                    'role'             => TeacherAssignment::ROLE_LEAD_TEACHER,
                    'school_class_id'  => $resolved['school_class_id'],
                    'class_stream_id'  => $resolved['class_stream_id'],
                    'subject_id'       => null,
                    'club_id'          => null,
                    'is_active'        => true,
                ]);
            }

            return $out;
        });

        return response()->json([
            'success' => true,
            'message' => $isLeadTeacher
                ? 'Assignment created (also assigned as Lead Teacher).'
                : 'Assignment created.',
            'data'    => collect($created)->map(fn ($a) => $a->load([
                'user:id,name,email,role',
                'schoolClass:id,name',
                'classStream:id,name',
                'subject:id,name,code',
                'club:id,name',
                'academicYear:id,name',
            ])),
        ], 201);
    }

    /* ============================================================
     * BULK STORE — the Assign Teachers modal
     * ============================================================ */

    public function bulkStore(Request $request)
    {
        $this->guard($request);

        $validated = $request->validate([
            'academic_year_id'              => ['required', 'integer', 'exists:academic_years,id'],
            'class_stream_id'               => ['required', 'integer', 'exists:class_streams,id'],
            'assignments'                   => ['required', 'array', 'min:1'],
            'assignments.*.role'            => ['required', Rule::in([
                TeacherAssignment::ROLE_CLASS_TEACHER,
                TeacherAssignment::ROLE_LEAD_TEACHER,
                TeacherAssignment::ROLE_SUBJECT_TEACHER,
                TeacherAssignment::ROLE_ASSISTANT_TEACHER,
            ])],
            'assignments.*.user_id'         => ['required', 'integer', 'exists:users,id'],
            'assignments.*.subject_id'      => ['nullable', 'integer', 'exists:subjects,id'],
            'assignments.*.is_lead_teacher' => ['nullable', 'boolean'],
        ]);

        $section = ClassStream::findOrFail($validated['class_stream_id']);
        $classId = $section->school_class_id;

        /* ---------- user checks ---------- */
        $userIds = collect($validated['assignments'])->pluck('user_id')->unique()->values();
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        foreach ($validated['assignments'] as $i => $a) {
            $user = $users->get($a['user_id']);
            if (!$user || !TeacherRoles::isTeacher($user->role)) {
                return $this->fail('Row ' . ($i + 1) . ': this user cannot be assigned.');
            }
        }

        /* ---------- role cardinality ---------- */
        $classTeacherRows = collect($validated['assignments'])
            ->where('role', TeacherAssignment::ROLE_CLASS_TEACHER);
        if ($classTeacherRows->count() > 1) {
            return $this->fail('Only one class teacher per section.');
        }

        $standaloneLeadRows = collect($validated['assignments'])
            ->where('role', TeacherAssignment::ROLE_LEAD_TEACHER);
        if ($standaloneLeadRows->count() > 1) {
            return $this->fail('Only one lead teacher per section.');
        }

        // Can't have both "class teacher with lead checkbox" AND a standalone lead
        $classTeacherWithLead = $classTeacherRows
            ->filter(fn ($r) => !empty($r['is_lead_teacher']))
            ->count();
        if ($classTeacherWithLead > 0 && $standaloneLeadRows->count() > 0) {
            return $this->fail(
                'Assign the lead teacher either via the class teacher checkbox or as a separate row, not both.'
            );
        }

        /* ---------- is_lead_teacher only valid on class_teacher ---------- */
        foreach ($validated['assignments'] as $i => $a) {
            if (!empty($a['is_lead_teacher']) && $a['role'] !== TeacherAssignment::ROLE_CLASS_TEACHER) {
                return $this->fail(
                    'Row ' . ($i + 1) . ': is_lead_teacher is only valid for class teacher assignments.'
                );
            }
        }

        /* ---------- no duplicate (role, user) pairs ---------- */
        $pairs = collect($validated['assignments'])->map(fn ($a) => $a['role'] . ':' . $a['user_id']);
        if ($pairs->count() !== $pairs->unique()->count()) {
            return $this->fail('The same teacher appears more than once with the same role.');
        }

        /* ---------- subject teacher needs a subject ---------- */
        foreach ($validated['assignments'] as $i => $a) {
            if ($a['role'] === TeacherAssignment::ROLE_SUBJECT_TEACHER && empty($a['subject_id'])) {
                return $this->fail('Row ' . ($i + 1) . ': subject teachers need a subject.');
            }
        }

        $created = DB::transaction(function () use ($validated, $section, $classId) {
            $out = [];

            /* ---------- class teacher (with optional lead) ---------- */
            $classTeacherRow = collect($validated['assignments'])
                ->firstWhere('role', TeacherAssignment::ROLE_CLASS_TEACHER);

            if ($classTeacherRow) {
                // Replace old class_teacher
                TeacherAssignment::where('academic_year_id', $validated['academic_year_id'])
                    ->where('class_stream_id', $section->id)
                    ->where('role', TeacherAssignment::ROLE_CLASS_TEACHER)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);

                // Replace old lead_teacher (kept in sync with class teacher)
                TeacherAssignment::where('academic_year_id', $validated['academic_year_id'])
                    ->where('class_stream_id', $section->id)
                    ->where('role', TeacherAssignment::ROLE_LEAD_TEACHER)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);

                $out[] = TeacherAssignment::create([
                    'academic_year_id' => $validated['academic_year_id'],
                    'school_class_id'  => $classId,
                    'class_stream_id'  => $section->id,
                    'user_id'          => $classTeacherRow['user_id'],
                    'role'             => TeacherAssignment::ROLE_CLASS_TEACHER,
                    'subject_id'       => null,
                    'club_id'          => null,
                    'is_active'        => true,
                ]);

                if (!empty($classTeacherRow['is_lead_teacher'])) {
                    $out[] = TeacherAssignment::create([
                        'academic_year_id' => $validated['academic_year_id'],
                        'school_class_id'  => $classId,
                        'class_stream_id'  => $section->id,
                        'user_id'          => $classTeacherRow['user_id'],
                        'role'             => TeacherAssignment::ROLE_LEAD_TEACHER,
                        'subject_id'       => null,
                        'club_id'          => null,
                        'is_active'        => true,
                    ]);
                }
            }

            /* ---------- standalone lead teacher (future-proof) ---------- */
            $standaloneLeadRow = collect($validated['assignments'])
                ->firstWhere('role', TeacherAssignment::ROLE_LEAD_TEACHER);

            if ($standaloneLeadRow) {
                TeacherAssignment::where('academic_year_id', $validated['academic_year_id'])
                    ->where('class_stream_id', $section->id)
                    ->where('role', TeacherAssignment::ROLE_LEAD_TEACHER)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);

                $out[] = TeacherAssignment::create([
                    'academic_year_id' => $validated['academic_year_id'],
                    'school_class_id'  => $classId,
                    'class_stream_id'  => $section->id,
                    'user_id'          => $standaloneLeadRow['user_id'],
                    'role'             => TeacherAssignment::ROLE_LEAD_TEACHER,
                    'subject_id'       => null,
                    'club_id'          => null,
                    'is_active'        => true,
                ]);
            }

            /* ---------- assistants + subject teachers (many allowed) ---------- */
            foreach ($validated['assignments'] as $a) {
                if (in_array($a['role'], [
                    TeacherAssignment::ROLE_CLASS_TEACHER,
                    TeacherAssignment::ROLE_LEAD_TEACHER,
                ], true)) {
                    continue;
                }

                if ($a['role'] === TeacherAssignment::ROLE_SUBJECT_TEACHER) {
                    TeacherAssignment::where('academic_year_id', $validated['academic_year_id'])
                        ->where('class_stream_id', $section->id)
                        ->where('role', TeacherAssignment::ROLE_SUBJECT_TEACHER)
                        ->where('subject_id', $a['subject_id'])
                        ->where('is_active', true)
                        ->update(['is_active' => false]);
                }

                $out[] = TeacherAssignment::create([
                    'academic_year_id' => $validated['academic_year_id'],
                    'school_class_id'  => $classId,
                    'class_stream_id'  => $section->id,
                    'user_id'          => $a['user_id'],
                    'role'             => $a['role'],
                    'subject_id'       => $a['role'] === TeacherAssignment::ROLE_SUBJECT_TEACHER
                        ? $a['subject_id']
                        : null,
                    'club_id'          => null,
                    'is_active'        => true,
                ]);
            }

            return $out;
        });

        return response()->json([
            'success' => true,
            'message' => count($created) . ' assignment(s) created.',
            'count'   => count($created),
            'data'    => $created,
        ], 201);
    }

    /* ============================================================
     * DESTROY
     * ============================================================ */

    public function destroy(Request $request, TeacherAssignment $teacherAssignment)
    {
        $this->guard($request);
        $teacherAssignment->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Assignment removed.',
        ]);
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    private function resolveTarget(array $v): array|\Illuminate\Http\JsonResponse
    {
        $role      = $v['role'];
        $streamId  = $v['class_stream_id'] ?? null;
        $classId   = $v['school_class_id'] ?? null;
        $subjectId = $v['subject_id'] ?? null;
        $clubId    = $v['club_id'] ?? null;

        if ($role === TeacherAssignment::ROLE_CLUB_LEAD) {
            if (!$clubId) return $this->fail('A club is required for a club lead.');
            return [
                'role'            => $role,
                'class_stream_id' => null,
                'school_class_id' => null,
                'subject_id'      => null,
                'club_id'         => $clubId,
            ];
        }

        if ($role === TeacherAssignment::ROLE_SUBJECT_TEACHER) {
            if (!$subjectId) return $this->fail('Subject is required.');
            if (!$streamId && !$classId) {
                return $this->fail('A section or class is required.');
            }
            if ($streamId) {
                $section = ClassStream::find($streamId);
                if (!$section) return $this->fail('Class section not found.');
                $classId = $section->school_class_id;
            }
            return [
                'role'            => $role,
                'class_stream_id' => $streamId,
                'school_class_id' => $classId,
                'subject_id'      => $subjectId,
                'club_id'         => null,
            ];
        }

        if (!$streamId) return $this->fail('A class section is required for this role.');

        $section = ClassStream::find($streamId);
        if (!$section) return $this->fail('Class section not found.');

        return [
            'role'            => $role,
            'class_stream_id' => $streamId,
            'school_class_id' => $section->school_class_id,
            'subject_id'      => null,
            'club_id'         => null,
        ];
    }

    /**
     * Role-specific deactivation. Each role now deactivates ONLY its
     * own previous record — class teacher and lead teacher are
     * independent, and callers explicitly deactivate both when
     * replacing the class teacher (see store() / bulkStore()).
     */
    private function deactivateExisting(
        int $yearId,
        string $role,
        ?int $classStreamId,
        ?int $classId,
        ?int $subjectId,
        ?int $clubId
    ): void {
        if ($role === TeacherAssignment::ROLE_CLASS_TEACHER) {
            TeacherAssignment::where('academic_year_id', $yearId)
                ->where('class_stream_id', $classStreamId)
                ->where('role', TeacherAssignment::ROLE_CLASS_TEACHER)
                ->where('is_active', true)
                ->update(['is_active' => false]);
            return;
        }

        if ($role === TeacherAssignment::ROLE_LEAD_TEACHER) {
            TeacherAssignment::where('academic_year_id', $yearId)
                ->where('class_stream_id', $classStreamId)
                ->where('role', TeacherAssignment::ROLE_LEAD_TEACHER)
                ->where('is_active', true)
                ->update(['is_active' => false]);
            return;
        }

        if ($role === TeacherAssignment::ROLE_SUBJECT_TEACHER) {
            TeacherAssignment::where('academic_year_id', $yearId)
                ->where('school_class_id', $classId)
                ->where('class_stream_id', $classStreamId)
                ->where('role', TeacherAssignment::ROLE_SUBJECT_TEACHER)
                ->where('subject_id', $subjectId)
                ->where('is_active', true)
                ->update(['is_active' => false]);
            return;
        }

        if ($role === TeacherAssignment::ROLE_CLUB_LEAD) {
            TeacherAssignment::where('academic_year_id', $yearId)
                ->where('role', TeacherAssignment::ROLE_CLUB_LEAD)
                ->where('club_id', $clubId)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }
    }

    private function guard(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['admin', 'administrator', 'headteacher'], true),
            403,
            'Only administrators and headteachers can manage teacher assignments.'
        );
    }

    private function fail(string $message)
    {
        return response()->json(['success' => false, 'message' => $message], 422);
    }
}