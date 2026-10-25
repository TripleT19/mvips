<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClassSubjectController extends Controller
{
    /**
     * GET /api/admin/class-subjects?school_class_id=&academic_year_id=
     *
     * Returns every active subject with an `is_assigned` flag for the
     * chosen class + year. That drives the checkbox grid on the frontend.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'school_class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
        ]);

        $class = SchoolClass::findOrFail($validated['school_class_id']);
        $year = AcademicYear::findOrFail($validated['academic_year_id']);

        $assigned = ClassSubject::where('school_class_id', $class->id)
            ->where('academic_year_id', $year->id)
            ->where('is_active', true)
            ->pluck('subject_id')
            ->flip();

        $subjects = Subject::active()
            ->orderBy('subject_group')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (Subject $s) use ($assigned) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'code' => $s->code,
                    'subject_group' => $s->subject_group,
                    'max_marks' => $s->max_marks,
                    'is_assigned' => $assigned->has($s->id),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'class' => ['id' => $class->id, 'name' => $class->name],
                'year' => ['id' => $year->id, 'name' => $year->name],
                'subjects' => $subjects,
            ],
        ]);
    }

    /**
     * POST /api/admin/class-subjects
     *
     * Body:
     *   { school_class_id, academic_year_id, subject_ids: [1,2,3] }
     *
     * Any subject currently active but not in `subject_ids` is soft-removed
     * (is_active = false). Anything in `subject_ids` is (re)activated.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['integer', 'exists:subjects,id'],
        ]);

        $subjectIds = $validated['subject_ids'] ?? [];

        DB::transaction(function () use ($validated, $subjectIds) {
            // Deactivate subjects that are not in the new list
            ClassSubject::where('school_class_id', $validated['school_class_id'])
                ->where('academic_year_id', $validated['academic_year_id'])
                ->whereNotIn('subject_id', $subjectIds)
                ->update(['is_active' => false]);

            // Attach / reactivate
            foreach ($subjectIds as $subjectId) {
                ClassSubject::updateOrCreate(
                    [
                        'school_class_id' => $validated['school_class_id'],
                        'subject_id' => $subjectId,
                        'academic_year_id' => $validated['academic_year_id'],
                    ],
                    ['is_active' => true]
                );
            }
        });

        return response()->json([
            'success' => true,
            'message' => count($subjectIds) . ' subject(s) assigned to the class.',
            'count' => count($subjectIds),
        ]);
    }

    /**
     * DELETE /api/admin/class-subjects/{classSubject}
     *
     * Soft-removes a single class subject.
     */
    public function destroy(ClassSubject $classSubject)
    {
        $classSubject->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Subject removed from this class.',
        ]);
    }
}