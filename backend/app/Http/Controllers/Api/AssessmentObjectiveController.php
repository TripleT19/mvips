<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\AssessmentObjective;
use App\Models\ClassStream;
use App\Models\SchoolClass;
use App\Models\Strand;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Support\TeacherRoles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssessmentObjectiveController extends Controller
{
    private const VIEWER_ROLES = [
        'admin', 'administrator', 'headteacher', 'principal',
        'admissions_officer', 'bursar', 'finance', 'accountant',
        'hod', 'head_of_department',
    ];

    /**
     * Every assignment role that grants *visibility* of a class.
     * Includes subject teachers — a Science teacher sees Year 1 East
     * (even though they can't touch Maths objectives there).
     */
    private const ASSIGNMENT_ROLES = [
        TeacherAssignment::ROLE_CLASS_TEACHER,
        TeacherAssignment::ROLE_LEAD_TEACHER,
        TeacherAssignment::ROLE_ASSISTANT_TEACHER,
        TeacherAssignment::ROLE_SUBJECT_TEACHER,   // ← NEW
    ];

    /** Owner-level roles — can manage ALL subjects in the section. */
    private const OWNER_ASSIGNMENT_ROLES = [
        TeacherAssignment::ROLE_CLASS_TEACHER,
        TeacherAssignment::ROLE_LEAD_TEACHER,
        TeacherAssignment::ROLE_ASSISTANT_TEACHER,
    ];

    /* ============================================================
     * CONTEXT
     * ============================================================ */
    public function context(Request $request)
    {
        $user = $request->user();

        $year = AcademicYear::where('is_current', true)->first();

        $terms = AcademicTerm::orderByDesc('is_current')
            ->orderBy('name')
            ->get(['id', 'name']);

        $allSubjects = Subject::where('subject_group', 'core')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $isViewer  = in_array($user->role, self::VIEWER_ROLES, true);
        $isTeacher = TeacherRoles::isTeacher($user->role);

        /* ---------------- VIEWER ---------------- */
        if ($isViewer) {
            $classes = SchoolClass::orderBy('name')->get(['id', 'name']);
            $classAccess = $classes->map(fn ($c) => [
                'class_id'    => (int) $c->id,
                'scope'       => 'viewer',
                'subject_ids' => null,        // null = all subjects
            ])->all();

            return response()->json([
                'success' => true,
                'data' => [
                    'current_academic_year' => $year ? ['id' => $year->id, 'name' => $year->name] : null,
                    'terms'                 => $terms,
                    'subjects'              => $allSubjects,
                    'classes'               => $classes,
                    'class_access'          => $classAccess,
                    'is_viewer'             => true,
                ],
            ]);
        }

        /* ---------------- NOT A TEACHER ---------------- */
        if (!$isTeacher) {
            return response()->json([
                'success' => true,
                'data' => [
                    'current_academic_year' => $year ? ['id' => $year->id, 'name' => $year->name] : null,
                    'terms'                 => $terms,
                    'subjects'              => [],
                    'classes'               => [],
                    'class_access'          => [],
                    'is_viewer'             => false,
                ],
            ]);
        }

        /* ---------------- TEACHER ---------------- */
        $assignments = TeacherAssignment::where('user_id', $user->id)
            ->where('is_active', true)
            ->whereIn('role', self::ASSIGNMENT_ROLES)
            ->with(['classStream:id,school_class_id'])
            ->get();

        $byClass = $assignments
            ->filter(fn ($a) => $a->classStream)
            ->groupBy(fn ($a) => (int) $a->classStream->school_class_id);

        $classAccess = [];
        foreach ($byClass as $classId => $rows) {
            $isOwner = $rows->contains(
                fn ($r) => in_array($r->role, self::OWNER_ASSIGNMENT_ROLES, true)
            );

            if ($isOwner) {
                $classAccess[] = [
                    'class_id'    => (int) $classId,
                    'scope'       => 'owner',
                    'subject_ids' => null,
                ];
            } else {
                $subjectIds = $rows
                    ->where('role', TeacherAssignment::ROLE_SUBJECT_TEACHER)
                    ->pluck('subject_id')
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();

                if (!empty($subjectIds)) {
                    $classAccess[] = [
                        'class_id'    => (int) $classId,
                        'scope'       => 'subject',
                        'subject_ids' => $subjectIds,
                    ];
                }
            }
        }

        $classIds = array_column($classAccess, 'class_id');
        $classes  = SchoolClass::whereIn('id', $classIds)
            ->orderBy('name')
            ->get(['id', 'name']);

        // If the user owns at least one class, they can see all core
        // subjects (editable only in the classes they own). If they are
        // purely a subject teacher, restrict the dropdown to their union
        // of subjects.
        $hasOwnerAnywhere = collect($classAccess)->contains(fn ($c) => $c['scope'] === 'owner');

        if ($hasOwnerAnywhere) {
            $subjects = $allSubjects;
        } else {
            $unionIds = collect($classAccess)
                ->pluck('subject_ids')
                ->filter()
                ->flatten()
                ->unique()
                ->all();

            $subjects = $allSubjects->whereIn('id', $unionIds)->values();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'current_academic_year' => $year ? ['id' => $year->id, 'name' => $year->name] : null,
                'terms'                 => $terms,
                'subjects'              => $subjects,
                'classes'               => $classes,
                'class_access'          => $classAccess,
                'is_viewer'             => false,
            ],
        ]);
    }

    /* ============================================================
     * LIST
     * ============================================================ */

    public function index(Request $request)
    {
        $validated = $request->validate([
            'subject_id'       => ['required', 'integer', 'exists:subjects,id'],
            'school_class_id'  => ['required', 'integer', 'exists:school_classes,id'],
            'term_id'          => ['required', 'integer', 'exists:academic_terms,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
        ]);

        $user = $request->user();
        $this->authorizeClass($user, (int) $validated['school_class_id']);

        $editable = $this->canManage(
            $user,
            (int) $validated['subject_id'],
            (int) $validated['school_class_id']
        );

        $strands = Strand::where('subject_id', $validated['subject_id'])
            ->where('is_active', true)
            ->orderBy('order')
            ->get(['id', 'name', 'order']);

        $objectives = AssessmentObjective::withCount(['results'])
            ->where('subject_id', $validated['subject_id'])
            ->where('school_class_id', $validated['school_class_id'])
            ->where('term_id', $validated['term_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        $byStrand = $objectives->groupBy('strand_id');

        $payload = $strands->map(function (Strand $strand) use ($byStrand, $editable) {
            $rows = ($byStrand[$strand->id] ?? collect())->map(fn (AssessmentObjective $o) => [
                'id'            => $o->id,
                'name'          => $o->name,
                'description'   => $o->description,
                'order'         => $o->order,
                'results_count' => $o->results_count,
                'editable'      => $editable,
            ])->values();

            return [
                'id'         => $strand->id,
                'name'       => $strand->name,
                'order'      => $strand->order,
                'objectives' => $rows,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'strands'  => $payload,
                'editable' => $editable,
            ],
        ]);
    }

    /* ============================================================
     * STRANDS
     * ============================================================ */

    public function storeStrand(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'name'       => ['required', 'string', 'max:120'],
        ]);

        $this->authorizeAnyEditableClass($request->user());

        $order = (int) Strand::where('subject_id', $validated['subject_id'])->max('order') + 1;

        $strand = Strand::create([
            'subject_id' => $validated['subject_id'],
            'name'       => $validated['name'],
            'order'      => $order,
            'is_active'  => true,
        ]);

        return response()->json(['success' => true, 'data' => $strand]);
    }

    public function updateStrand(Request $request, Strand $strand)
    {
        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:120'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $this->authorizeAnyEditableClass($request->user());

        $strand->update(array_filter($validated, fn ($v) => $v !== null));

        return response()->json(['success' => true, 'data' => $strand->fresh()]);
    }

    public function destroyStrand(Request $request, Strand $strand)
    {
        $this->authorizeAnyEditableClass($request->user());

        $hasResults = AssessmentObjective::where('strand_id', $strand->id)
            ->whereHas('results')
            ->exists();

        if ($hasResults) {
            $strand->update(['is_active' => false]);
            return response()->json([
                'success' => true,
                'message' => 'Strand archived (kept because existing results reference it).',
            ]);
        }

        $strand->delete();

        return response()->json(['success' => true]);
    }

    /* ============================================================
     * OBJECTIVES
     * ============================================================ */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'strand_id'        => ['required', 'integer', 'exists:strands,id'],
            'subject_id'       => ['required', 'integer', 'exists:subjects,id'],
            'school_class_id'  => ['required', 'integer', 'exists:school_classes,id'],
            'term_id'          => ['required', 'integer', 'exists:academic_terms,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'name'             => ['required', 'string', 'max:180'],
            'description'      => ['nullable', 'string', 'max:1000'],
        ]);

        $this->authorizeManage(
            $request->user(),
            (int) $validated['subject_id'],
            (int) $validated['school_class_id']
        );

        $order = (int) AssessmentObjective::where('strand_id', $validated['strand_id'])
            ->where('school_class_id', $validated['school_class_id'])
            ->where('term_id', $validated['term_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->max('order') + 1;

        $objective = AssessmentObjective::create([
            ...$validated,
            'order'      => $order,
            'is_active'  => true,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'            => $objective->id,
                'name'          => $objective->name,
                'description'   => $objective->description,
                'order'         => $objective->order,
                'results_count' => 0,
                'editable'      => true,
            ],
        ]);
    }

    public function update(Request $request, AssessmentObjective $assessmentObjective)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->authorizeManage(
            $request->user(),
            $assessmentObjective->subject_id,
            $assessmentObjective->school_class_id
        );

        $assessmentObjective->update($validated);

        return response()->json(['success' => true, 'data' => $assessmentObjective->fresh()]);
    }

    public function destroy(Request $request, AssessmentObjective $assessmentObjective)
    {
        $this->authorizeManage(
            $request->user(),
            $assessmentObjective->subject_id,
            $assessmentObjective->school_class_id
        );

        if ($assessmentObjective->results()->exists()) {
            $assessmentObjective->update(['is_active' => false]);
            return response()->json([
                'success' => true,
                'message' => 'Objective archived (results already recorded).',
            ]);
        }

        $assessmentObjective->delete();

        return response()->json(['success' => true]);
    }

    /* ============================================================
     * REORDER
     * ============================================================ */

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'items'             => ['required', 'array'],
            'items.*.id'        => ['required', 'integer'],
            'items.*.order'     => ['required', 'integer', 'min:0'],
            'items.*.strand_id' => ['required', 'integer'],
        ]);

        $first = AssessmentObjective::find($validated['items'][0]['id'] ?? 0);
        abort_unless($first, 422, 'No objectives to reorder.');

        $this->authorizeManage(
            $request->user(),
            $first->subject_id,
            $first->school_class_id
        );

        DB::transaction(function () use ($validated) {
            foreach ($validated['items'] as $row) {
                AssessmentObjective::where('id', $row['id'])->update([
                    'strand_id' => $row['strand_id'],
                    'order'     => $row['order'],
                ]);
            }
        });

        return response()->json(['success' => true]);
    }

    /* ============================================================
     * COPY FROM ANOTHER TERM
     * ============================================================ */

    public function copyFrom(Request $request)
    {
        $validated = $request->validate([
            'subject_id'       => ['required', 'integer', 'exists:subjects,id'],
            'school_class_id'  => ['required', 'integer', 'exists:school_classes,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'from_term_id'     => ['required', 'integer', 'exists:academic_terms,id'],
            'to_term_id'       => ['required', 'integer', 'exists:academic_terms,id', 'different:from_term_id'],
        ]);

        $this->authorizeManage(
            $request->user(),
            (int) $validated['subject_id'],
            (int) $validated['school_class_id']
        );

        $existing = AssessmentObjective::where('subject_id', $validated['subject_id'])
            ->where('school_class_id', $validated['school_class_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('term_id', $validated['to_term_id'])
            ->where('is_active', true)
            ->exists();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Target term already has objectives. Clear them first.',
            ], 422);
        }

        $source = AssessmentObjective::where('subject_id', $validated['subject_id'])
            ->where('school_class_id', $validated['school_class_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('term_id', $validated['from_term_id'])
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        if ($source->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Nothing to copy from that term.',
            ], 422);
        }

        DB::transaction(function () use ($source, $validated, $request) {
            foreach ($source as $o) {
                AssessmentObjective::create([
                    'strand_id'        => $o->strand_id,
                    'subject_id'       => $o->subject_id,
                    'school_class_id'  => $o->school_class_id,
                    'term_id'          => $validated['to_term_id'],
                    'academic_year_id' => $o->academic_year_id,
                    'name'             => $o->name,
                    'description'      => $o->description,
                    'order'            => $o->order,
                    'is_active'        => true,
                    'created_by'       => $request->user()->id,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Objectives copied.',
            'data'    => ['count' => $source->count()],
        ]);
    }

    /* ============================================================
     * PERMISSIONS
     * ============================================================ */

    private function authorizeAnyEditableClass($user): void
    {
        if (!$user) abort(401, 'Authentication required.');

        if (in_array($user->role, self::VIEWER_ROLES, true)) {
            abort(403, 'Your role has read-only access.');
        }

        if (!TeacherRoles::isTeacher($user->role)) {
            abort(403, 'You do not have access to assessment objectives.');
        }
    }

    private function authorizeClass($user, int $classId): void
    {
        if (!$user) abort(401, 'Authentication required.');
        if (in_array($user->role, self::VIEWER_ROLES, true)) return;

        if (!TeacherRoles::isTeacher($user->role)) {
            abort(403, 'You do not have access to this class.');
        }

        $hasAccess = ClassStream::where('school_class_id', $classId)
            ->whereHas('teacherAssignments', function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->whereIn('role', self::ASSIGNMENT_ROLES)
                  ->where('is_active', true);
            })
            ->exists();

        abort_unless($hasAccess, 403, 'You are not assigned to this class.');
    }

    private function authorizeManage($user, int $subjectId, int $classId): void
    {
        abort_unless(
            $this->canManage($user, $subjectId, $classId),
            403,
            'You can only manage objectives for classes and subjects you teach.'
        );
    }

    /**
     * Owner-level assignment on ANY stream of this class → all subjects editable.
     * Subject-teacher assignment on ANY stream of this class for THIS subject → only that subject editable.
     */
    private function canManage($user, int $subjectId, int $classId): bool
    {
        if (!$user) return false;
        if (in_array($user->role, self::VIEWER_ROLES, true)) return false;
        if (!TeacherRoles::isTeacher($user->role)) return false;

        $hasOwner = ClassStream::where('school_class_id', $classId)
            ->whereHas('teacherAssignments', function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->whereIn('role', self::OWNER_ASSIGNMENT_ROLES)
                  ->where('is_active', true);
            })
            ->exists();

        if ($hasOwner) return true;

        return ClassStream::where('school_class_id', $classId)
            ->whereHas('teacherAssignments', function ($q) use ($user, $subjectId) {
                $q->where('user_id', $user->id)
                  ->where('role', TeacherAssignment::ROLE_SUBJECT_TEACHER)
                  ->where('subject_id', $subjectId)
                  ->where('is_active', true);
            })
            ->exists();
    }
}