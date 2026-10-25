<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\AssessmentObjective;
use App\Models\AssessmentObjectiveResult;
use App\Models\AttendanceRegister;
use App\Models\ClassStream;
use App\Models\FeeInvoice;
use App\Models\Student;
use App\Models\StudentSubjectAssessment;
use App\Models\StudentTermReport;
use App\Models\StudentWeeklyTest;
use App\Models\Subject;
use App\Models\SubjectTermSetting;
use App\Models\TeacherAssignment;
use App\Models\TermReportSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class ParentPortalController extends Controller
{
    private const PARENT_ROLES = ['parent', 'guardian'];

    private const RATING_PCT = [
        'basic' => 20, 'aspiring' => 40, 'good' => 60,
        'high' => 80,  'exceeding' => 100, 'unclassified' => null,
    ];

    private const WEEKLY_TESTS = [
        'times_tables' => ['label' => 'Times Tables Test',   'max' => 12],
        'spelling'     => ['label' => 'Weekly Spelling Test', 'max' => 10],
    ];

    /* ============================================================
     * CHILDREN
     * ============================================================ */

    public function children(Request $request)
    {
        $user = $this->requireParent($request);

        $students = $user->students()
            ->where('status', 'active')
            ->with([
                'currentClass:id,name',
                'currentClassStream:id,name,stream_id,school_class_id',
                'currentClassStream.stream:id,name,colour',
            ])
            ->orderBy('surname')
            ->orderBy('first_name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $students->map(fn (Student $s) => [
                'id'             => $s->id,
                'slug'           => $s->slug,
                'student_number' => $s->student_number,
                'full_name'      => trim("{$s->first_name} {$s->middle_name} {$s->surname}"),
                'photo_url'      => $s->photo_path
                    ? Storage::disk('public')->url($s->photo_path)
                    : null,
                'class_name'     => $s->currentClass?->name,
                'stream_name'    => $s->currentClassStream?->stream?->name,
                'stream_colour'  => $s->currentClassStream?->stream?->colour,
                'relationship'   => $s->pivot->relationship,
                'is_primary'     => (bool) $s->pivot->is_primary,
            ])->values(),
        ]);
    }

    /* ============================================================
     * TERMS — published only, with fee gate hints
     * ============================================================ */

    public function terms(Request $request, Student $student)
    {
        $this->requireParent($request);
        $this->authorizeChild($request->user(), $student);

        $rows = TermReportSubmission::with(['term:id,name', 'academicYear:id,name'])
            ->where('student_id', $student->id)
            ->where('status', TermReportSubmission::STATUS_PUBLISHED)
            ->orderByDesc('academic_year_id')
            ->orderBy('term_id')
            ->get()
            ->map(function ($sub) use ($student) {
                $balance = 0.0;
                try {
                    $balance = $this->feeBalance($student->id, $sub->term_id, $sub->academic_year_id);
                } catch (\Throwable $e) {
                    $balance = 0.0;
                }

                return [
                    'term_id'          => $sub->term_id,
                    'term_name'        => $sub->term?->name,
                    'academic_year_id' => $sub->academic_year_id,
                    'year_name'        => $sub->academicYear?->name,
                    'published_at'     => $sub->published_at,
                    'balance'          => $balance,
                    'is_available'     => $balance <= 0.001,
                ];
            });

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /* ============================================================
     * RESULTS — 402 fee gate at view time
     * ============================================================ */

    public function results(Request $request, Student $student)
    {
        $this->requireParent($request);
        $this->authorizeChild($request->user(), $student);

        $validated = $request->validate([
            'term_id'          => ['required', 'integer', 'exists:academic_terms,id'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
        ]);

        $yearId = $validated['academic_year_id']
            ?? AcademicYear::where('is_current', true)->value('id');

        abort_unless($yearId, 422, 'No academic year.');

        $submission = TermReportSubmission::with(['publishedBy:id,name'])
            ->where([
                'student_id'       => $student->id,
                'term_id'          => $validated['term_id'],
                'academic_year_id' => $yearId,
            ])
            ->first();

        abort_unless(
            $submission && $submission->status === TermReportSubmission::STATUS_PUBLISHED,
            404,
            'Results for this term have not been published yet.'
        );

        // ---- Live fee gate -------------------------------------------
        $balance = $this->feeBalance($student->id, $validated['term_id'], $yearId);

        if ($balance > 0.001) {
            return response()->json([
                'success' => false,
                'code'    => 'FEES_OUTSTANDING',
                'message' => sprintf(
                    'Results are ready but temporarily blocked due to an outstanding balance of MWK %s. Please settle the balance to view them.',
                    number_format($balance, 2)
                ),
                'data' => [
                    'balance'          => $balance,
                    'term_id'          => $validated['term_id'],
                    'academic_year_id' => $yearId,
                ],
            ], 402);
        }

        $term = AcademicTerm::findOrFail($validated['term_id']);
        $year = AcademicYear::findOrFail($yearId);

        $classStream = $this->resolveClassStream($student);

        // ---- Attendance ---------------------------------------------
        $attendance = $this->attendanceSummary($student, $classStream, $term);

        // ---- Load grades --------------------------------------------
        $objectives = AssessmentObjective::with('strand')
            ->where('school_class_id', $classStream?->school_class_id)
            ->where('term_id', $term->id)
            ->where('academic_year_id', $year->id)
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        $objectiveResults = AssessmentObjectiveResult::where('student_id', $student->id)
            ->whereIn('assessment_objective_id', $objectives->pluck('id'))
            ->get()
            ->keyBy('assessment_objective_id');

        $subjectAssessments = StudentSubjectAssessment::where('student_id', $student->id)
            ->where('term_id', $term->id)
            ->where('academic_year_id', $year->id)
            ->get()
            ->keyBy('subject_id');

        $subjectSettings = SubjectTermSetting::where('school_class_id', $classStream?->school_class_id)
            ->where('term_id', $term->id)
            ->where('academic_year_id', $year->id)
            ->get()
            ->keyBy('subject_id');

        $cores = Subject::where('subject_group', 'core')
            ->where('is_active', true)->orderBy('name')->get();

        $specials = Subject::where('subject_group', 'specialist')
            ->where('is_active', true)->orderBy('name')->get();

        // ---- Core subjects payload ----------------------------------
        $corePayload = $cores->map(function (Subject $subject) use (
            $objectives, $objectiveResults, $subjectAssessments,
            $subjectSettings, $classStream, $term, $year
        ) {
            $setting = $subjectSettings[$subject->id] ?? SubjectTermSetting::forScope(
                $subject->id, $classStream?->school_class_id, $term->id, $year->id
            );
            $totalMarks = (int) ($subject->max_marks ?? $setting->total_marks ?? 100);

            $subjectObjectives = $objectives->where('subject_id', $subject->id);

            $grouped = $subjectObjectives->groupBy('strand_id')->map(function ($list, $strandId) use ($objectiveResults) {
                $strand = $list->first()->strand;
                return [
                    'strand_name' => $strand?->name ?? 'General',
                    'objectives' => $list->map(fn ($o) => [
                        'name'   => $o->name,
                        'rating' => $objectiveResults[$o->id]->rating ?? null,
                    ])->values(),
                ];
            })->values();

            $computed = $this->computeCoreSubject(
                $subjectObjectives->pluck('id')->all(),
                $objectiveResults,
                $totalMarks
            );

            $assessment = $subjectAssessments[$subject->id] ?? null;

            return [
                'subject_name' => $subject->name,
                'total_marks'  => $totalMarks,
                'scored_marks' => $computed['scored_marks'],
                'percentage'   => $computed['percentage'],
                'grade'        => $computed['grade'],
                'achievement'  => $computed['achievement'],
                'effort_shown' => $assessment?->effort_shown,
                'observation'  => $assessment?->teacher_observation,
                'strands'      => $grouped,
            ];
        });

        // ---- Specialist payload -------------------------------------
        $specialistPayload = $specials->map(function (Subject $subject) use (
            $subjectAssessments, $subjectSettings, $classStream, $term, $year
        ) {
            $setting = $subjectSettings[$subject->id] ?? SubjectTermSetting::forScope(
                $subject->id, $classStream?->school_class_id, $term->id, $year->id
            );
            $totalMarks = (int) ($subject->max_marks ?? $setting->total_marks ?? 100);
            $scored = $subjectAssessments[$subject->id]?->scored_marks;

            if ($scored !== null && $totalMarks > 0 && (float) $scored > $totalMarks) {
                $scored = $totalMarks;
            }

            $percent = $scored !== null && $totalMarks > 0
                ? round(((float) $scored / $totalMarks) * 100, 1) : null;
            [$grade, $achievement] = $percent === null
                ? [null, null] : $this->gradeFor($percent);

            return [
                'subject_name' => $subject->name,
                'total_marks'  => $totalMarks,
                'scored_marks' => $scored !== null ? (float) $scored : null,
                'percentage'   => $percent,
                'grade'        => $grade,
                'achievement'  => $achievement,
            ];
        });

        // ---- Weekly tests -------------------------------------------
        $totalWeeks = $this->totalWeeksForTerm($term);
        $weeklyRows = StudentWeeklyTest::where('student_id', $student->id)
            ->where('term_id', $term->id)
            ->where('academic_year_id', $year->id)
            ->get();

        $weekly = [];
        foreach (self::WEEKLY_TESTS as $type => $meta) {
            $weeks = [];
            for ($i = 1; $i <= $totalWeeks; $i++) {
                $row = $weeklyRows->firstWhere(fn ($r) =>
                    $r->test_type === $type && (int) $r->week_number === $i
                );
                $weeks[] = [
                    'week'      => $i,
                    'score'     => $row?->score !== null ? (float) $row->score : null,
                    'max_score' => (float) ($row?->max_score ?? $meta['max']),
                ];
            }
            $weekly[] = [
                'test_type' => $type,
                'label'     => $meta['label'],
                'weeks'     => $weeks,
            ];
        }

        // ---- Observations -------------------------------------------
        $report = StudentTermReport::where('student_id', $student->id)
            ->where('term_id', $term->id)
            ->where('academic_year_id', $year->id)
            ->first();

        // ---- Teaching staff for this section ------------------------
        $classTeacherName = null;
        $leadTeacherName  = null;

        if ($classStream) {
            $staffAssignments = TeacherAssignment::with('user:id,name')
                ->where('class_stream_id', $classStream->id)
                ->where('academic_year_id', $year->id)
                ->where('is_active', true)
                ->whereIn('role', [
                    TeacherAssignment::ROLE_CLASS_TEACHER,
                    TeacherAssignment::ROLE_LEAD_TEACHER,
                ])
                ->get();

            $classTeacherName = $staffAssignments
                ->firstWhere('role', TeacherAssignment::ROLE_CLASS_TEACHER)?->user?->name;

            $leadTeacherName = $staffAssignments
                ->firstWhere('role', TeacherAssignment::ROLE_LEAD_TEACHER)?->user?->name;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'student' => [
                    'id'             => $student->id,
                    'slug'           => $student->slug,
                    'student_number' => $student->student_number,
                    'full_name'      => trim("{$student->first_name} {$student->middle_name} {$student->surname}"),
                    'photo_url'      => $student->photo_path
                        ? Storage::disk('public')->url($student->photo_path)
                        : null,
                    'date_of_birth'  => $student->date_of_birth
                        ? Carbon::parse($student->date_of_birth)->toDateString()
                        : null,
                    'house_name'     => $student->house?->name,
                ],

                'class_stream'  => ['name' => $classStream?->name],
                'term'          => ['id' => $term->id, 'name' => $term->name],
                'academic_year' => ['id' => $year->id, 'name' => $year->name],

                'class_teacher_name' => $classTeacherName,
                'lead_teacher_name'  => $leadTeacherName,

                'attendance'          => $attendance,
                'core_subjects'       => $corePayload,
                'specialist_subjects' => $specialistPayload,
                'weekly_tests'        => $weekly,
                'total_weeks'         => $totalWeeks,

                'observations' => [
                    'class_teacher'     => $report?->class_teacher_observation,
                    'skill_enhancement' => $report?->skill_enhancement_club,
                ],

                'published' => [
                    'at' => $submission->published_at,
                    'by' => $submission->publishedBy?->name,
                ],
            ],
        ]);
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    private function requireParent(Request $request)
    {
        $user = $request->user();
        $role = strtolower(trim((string) ($user?->role ?? '')));
        abort_unless(in_array($role, self::PARENT_ROLES, true), 403, 'Parent access only.');
        return $user;
    }

    private function authorizeChild($user, Student $student): void
    {
        abort_unless(
            $user->students()->where('student_id', $student->id)->exists(),
            403,
            'You do not have access to this student.'
        );
    }

    private function resolveClassStream(Student $student): ?ClassStream
    {
        if ($student->current_class_stream_id) {
            return ClassStream::find($student->current_class_stream_id);
        }
        if ($student->current_class_id) {
            return ClassStream::where('school_class_id', $student->current_class_id)
                ->where('is_active', true)
                ->orderBy('name')
                ->first();
        }
        return null;
    }

    private function attendanceSummary(Student $student, ?ClassStream $classStream, AcademicTerm $term): array
    {
        if (!$classStream) {
            return ['total_sessions' => 0, 'present' => 0, 'late' => 0, 'percentage' => null];
        }

        $registers = AttendanceRegister::where('class_stream_id', $classStream->id)
            ->where('date', '>=', $term->start_date)
            ->where('date', '<=', $term->end_date)
            ->with(['records:id,attendance_register_id,student_id,status'])
            ->get();

        $schoolDays = $registers->filter(fn ($r) =>
            $r->records->whereIn('status', ['present','late'])->count() > 0
        );

        $totalSessions = $schoolDays->count();
        $myRecords = $schoolDays->flatMap(fn ($r) => $r->records->where('student_id', $student->id));
        $present = $myRecords->where('status', 'present')->count();
        $late    = $myRecords->where('status', 'late')->count();

        return [
            'total_sessions' => $totalSessions,
            'present'        => $present,
            'late'           => $late,
            'percentage'     => $totalSessions > 0
                ? round((($present + $late) / $totalSessions) * 100, 1)
                : null,
        ];
    }

    private function computeCoreSubject(array $objectiveIds, $results, int $totalMarks): array
    {
        $ratings = [];
        foreach ($objectiveIds as $id) {
            $r = $results[$id]->rating ?? null;
            if ($r === null || $r === 'unclassified') continue;
            $pct = self::RATING_PCT[$r] ?? null;
            if ($pct !== null) $ratings[] = $pct;
        }

        if (empty($ratings)) {
            return ['scored_marks' => null, 'percentage' => null, 'grade' => null, 'achievement' => null];
        }

        $avg = array_sum($ratings) / count($ratings);
        $scored = round(($avg / 100) * $totalMarks, 2);
        [$grade, $achievement] = $this->gradeFor($avg);

        return [
            'scored_marks' => $scored,
            'percentage'   => round($avg, 1),
            'grade'        => $grade,
            'achievement'  => $achievement,
        ];
    }

    private function gradeFor(float $pct): array
    {
        if ($pct >= 81) return ['A+', 'Outstanding'];
        if ($pct >= 61) return ['A',  'High'];
        if ($pct >= 41) return ['B',  'Good'];
        if ($pct >= 21) return ['C',  'Aspiring'];
        if ($pct >= 10) return ['D',  'Basic'];
        return ['E', 'Unclassified'];
    }

    private function totalWeeksForTerm(AcademicTerm $term): int
    {
        if (!$term->start_date || !$term->end_date) return 12;
        try {
            $start = Carbon::parse($term->start_date)->startOfDay();
            $end   = Carbon::parse($term->end_date)->startOfDay();
            if ($end->lt($start)) return 12;
            $days = (int) abs($start->diffInDays($end)) + 1;
            return max(1, min((int) ceil($days / 7), 52));
        } catch (\Throwable $e) {
            return 12;
        }
    }

    private function feeBalance(int $studentId, int $termId, int $yearId): float
    {
        return (float) FeeInvoice::where('student_id', $studentId)
            ->where('term_id', $termId)
            ->where('academic_year_id', $yearId)
            ->get()
            ->sum(fn ($inv) => max(0, (float) $inv->total_amount - (float) $inv->amount_paid));
    }
}