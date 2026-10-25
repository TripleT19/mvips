<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\AssessmentObjective;
use App\Models\AssessmentObjectiveResult;
use App\Models\AttendanceRegister;
use App\Models\ClassStream;
use App\Models\Club;
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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AssessmentSheetController extends Controller
{
    private const VIEWER_ROLES = [
        'admin', 'administrator', 'headteacher', 'principal',
        'admissions_officer', 'bursar', 'finance', 'accountant',
        'hod', 'head_of_department',
    ];

    private const TEACHER_ROLES = [
        'lead_teacher', 'class_teacher', 'assistant_teacher',
        'teacher',
        'teaching_assistant', 'ta',
        'stream_lead', 'club_lead',
        'subject_teacher',
        'specialist', 'specialist_teacher', 'special_teacher', 'spec_teacher',
        'music_teacher', 'art_teacher', 'pe_teacher', 'sports_teacher',
        'ict_teacher', 'computing_teacher', 'computer_teacher',
        'swimming_teacher', 'dance_teacher', 'drama_teacher',
        'language_teacher', 'languages_teacher', 'foreign_language_teacher',
        'reading_teacher', 'library_teacher', 'librarian',
        'science_teacher', 'maths_teacher', 'math_teacher',
        'english_teacher', 'history_teacher', 'geography_teacher',
    ];

    private const ASSIGNMENT_ROLES = [
        TeacherAssignment::ROLE_CLASS_TEACHER,
        TeacherAssignment::ROLE_LEAD_TEACHER,
        TeacherAssignment::ROLE_ASSISTANT_TEACHER,
        TeacherAssignment::ROLE_SUBJECT_TEACHER,
    ];

    private const OWNER_ASSIGNMENT_ROLES = [
        TeacherAssignment::ROLE_CLASS_TEACHER,
        TeacherAssignment::ROLE_LEAD_TEACHER,
        TeacherAssignment::ROLE_ASSISTANT_TEACHER,
    ];

    private const RATING_PCT = [
        'basic' => 20, 'aspiring' => 40, 'good' => 60,
        'high' => 80,  'exceeding' => 100, 'unclassified' => null,
    ];

    private const WEEKLY_TESTS = [
        'times_tables' => ['label' => 'Times Tables Test', 'max' => 12],
        'spelling'     => ['label' => 'Weekly Spelling Tests', 'max' => 10],
    ];

    /* ============================================================
     * SECTIONS
     * ============================================================ */

    public function sections(Request $request)
    {
        $user = $request->user();
        abort_unless($user, 401, 'Authentication required.');

        $validated = $request->validate([
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
        ]);

        $year = !empty($validated['academic_year_id'])
            ? AcademicYear::find($validated['academic_year_id'])
            : AcademicYear::where('is_current', true)->first();

        abort_unless($year, 422, 'No current academic year.');

        $role      = $this->normaliseRole((string) ($user->role ?? ''));
        $isViewer  = in_array($role, self::VIEWER_ROLES, true);
        $isTeacher = $this->isTeacherRole($role);

        if ($isViewer) {
            $streamIds = ClassStream::where('is_active', true)->pluck('id')->all();
        } elseif ($isTeacher) {
            $streamIds = TeacherAssignment::where('user_id', $user->id)
                ->where('academic_year_id', $year->id)
                ->where('is_active', true)
                ->whereIn('role', self::ASSIGNMENT_ROLES)
                ->whereNotNull('class_stream_id')
                ->pluck('class_stream_id')
                ->unique()
                ->values()
                ->all();
        } else {
            abort(403, 'No access.');
        }

        if (empty($streamIds)) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $sections = ClassStream::with(['schoolClass:id,name', 'stream:id,name,colour'])
            ->whereIn('id', $streamIds)
            ->orderBy('name')
            ->get();

        $ownerStreamIds = $isViewer
            ? $streamIds
            : TeacherAssignment::where('user_id', $user->id)
                ->where('academic_year_id', $year->id)
                ->where('is_active', true)
                ->whereIn('role', self::OWNER_ASSIGNMENT_ROLES)
                ->whereNotNull('class_stream_id')
                ->pluck('class_stream_id')
                ->unique()
                ->all();

        $rows = $sections->map(fn (ClassStream $s) => [
            'id'                => $s->id,
            'name'              => $s->name,
            'school_class_name' => $s->schoolClass?->name,
            'stream_name'       => $s->stream?->name,
            'stream_colour'     => $s->stream?->colour,
            'can_mark'          => in_array($s->id, $ownerStreamIds, true),
            'can_assess'        => true,
        ]);

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /* ============================================================
     * ROSTER
     * ============================================================ */

    public function roster(Request $request)
    {
        $validated = $request->validate([
            'class_stream_id'  => ['required','integer','exists:class_streams,id'],
            'term_id'          => ['required','integer','exists:academic_terms,id'],
            'academic_year_id' => ['nullable','integer','exists:academic_years,id'],
        ]);

        $user = $request->user();
        $classStream = ClassStream::with(['schoolClass:id,name','stream:id,name,colour'])
            ->findOrFail($validated['class_stream_id']);

        $yearId = $validated['academic_year_id'] ?? null;
        $year = $yearId
            ? AcademicYear::find($yearId)
            : AcademicYear::where('is_current', true)->first();
        abort_unless($year, 422, 'No current academic year.');

        $this->authorizeSection($user, $classStream, $year->id);

        $students = Student::where('status', 'active')
            ->where(function ($q) use ($classStream) {
                $q->where('current_class_stream_id', $classStream->id)
                  ->orWhere(function ($q2) use ($classStream) {
                      $q2->whereNull('current_class_stream_id')
                         ->where('current_class_id', $classStream->school_class_id);
                  });
            })
            ->orderBy('surname')
            ->orderBy('first_name')
            ->get(['id','student_number','first_name','middle_name','surname','photo_path']);

        $allowedSubjectIds = $this->editableSubjects($user, $classStream, $year->id);
        $isSubjectTeacherOnly = $allowedSubjectIds !== null;

        $cores = Subject::where('subject_group', 'core')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id','name']);

        $specials = Subject::where('subject_group', 'specialist')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id','name']);

        $objectiveCounts = AssessmentObjective::where('school_class_id', $classStream->school_class_id)
            ->where('term_id', $validated['term_id'])
            ->where('academic_year_id', $year->id)
            ->where('is_active', true)
            ->when($isSubjectTeacherOnly, fn ($q) => $q->whereIn('subject_id', $allowedSubjectIds))
            ->selectRaw('subject_id, count(*) as c')
            ->groupBy('subject_id')
            ->pluck('c','subject_id');

        $gradedCounts = AssessmentObjectiveResult::join('assessment_objectives as ao', 'ao.id', '=', 'assessment_objective_results.assessment_objective_id')
            ->where('ao.school_class_id', $classStream->school_class_id)
            ->where('ao.term_id', $validated['term_id'])
            ->where('ao.academic_year_id', $year->id)
            ->when($isSubjectTeacherOnly, fn ($q) => $q->whereIn('ao.subject_id', $allowedSubjectIds))
            ->whereNotNull('assessment_objective_results.rating')
            ->where('assessment_objective_results.rating', '!=', 'unclassified')
            ->whereIn('assessment_objective_results.student_id', $students->pluck('id'))
            ->selectRaw('assessment_objective_results.student_id, count(*) as c')
            ->groupBy('assessment_objective_results.student_id')
            ->pluck('c','assessment_objective_results.student_id');

        $rows = $students->map(function (Student $s) use ($objectiveCounts, $gradedCounts) {
            $totalObj  = (int) $objectiveCounts->sum();
            $gradedObj = (int) ($gradedCounts[$s->id] ?? 0);
            return [
                'id'             => $s->id,
                'student_number' => $s->student_number,
                'full_name'      => trim("{$s->first_name} {$s->middle_name} {$s->surname}"),
                'photo_url'      => $s->photo_path ? Storage::disk('public')->url($s->photo_path) : null,
                'graded'         => $gradedObj,
                'total'          => $totalObj,
                'progress'       => $totalObj > 0 ? round(($gradedObj / $totalObj) * 100) : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'class_stream'  => [
                    'id'   => $classStream->id,
                    'name' => $classStream->name,
                    'school_class_name' => $classStream->schoolClass?->name,
                    'stream_name'       => $classStream->stream?->name,
                    'stream_colour'     => $stream_colour = $classStream->stream?->colour,
                ],
                'academic_year'           => ['id' => $year->id, 'name' => $year->name],
                'teacher_scope'           => $isSubjectTeacherOnly ? 'subject_teacher' : 'class_teacher',
                'is_subject_teacher_only' => $isSubjectTeacherOnly,
                'editable_subject_ids'    => $allowedSubjectIds,
                'core_subjects'           => $cores,
                'specialist_subjects'     => $specials,
                'students'                => $rows,
            ],
        ]);
    }

    /* ============================================================
     * FORM
     * ============================================================ */

    public function form(Request $request, Student $student)
    {
        $validated = $request->validate([
            'term_id'          => ['required','integer','exists:academic_terms,id'],
            'academic_year_id' => ['nullable','integer','exists:academic_years,id'],
            'class_stream_id'  => ['nullable','integer','exists:class_streams,id'],
        ]);

        $user = $request->user();
        $requestedStreamId = $validated['class_stream_id'] ?? null;

        $classStream = $this->resolveStudentSection($student, $requestedStreamId);
        abort_unless($classStream, 422, 'Student is not attached to any class or section.');

        $yearId = $validated['academic_year_id'] ?? null;
        $year = $yearId
            ? AcademicYear::find($yearId)
            : AcademicYear::where('is_current', true)->first();
        abort_unless($year, 422, 'No current academic year.');

        $this->authorizeSection($user, $classStream, $year->id);

        $term = AcademicTerm::findOrFail($validated['term_id']);

        // ---- Teacher scope -------------------------------------------
        $allowedSubjectIds = $this->editableSubjects($user, $classStream, $year->id);
        $isSubjectTeacherOnly = $allowedSubjectIds !== null;

        // ---- Class teacher / club lead -------------------------------
        $isClassTeacher = TeacherAssignment::where('user_id', $user->id)
            ->where('class_stream_id', $classStream->id)
            ->where('academic_year_id', $year->id)
            ->where('is_active', true)
            ->where('role', TeacherAssignment::ROLE_CLASS_TEACHER)
            ->exists();

        $isClubLead = $this->isClubLead($user, $year->id);
        $canManageSkillClub = $isClassTeacher || $isClubLead;
        $ledClubs = $isClubLead ? $this->ledClubs($user, $year->id) : collect();

        // ---- Attendance summary --------------------------------------
        $registers = AttendanceRegister::where('class_stream_id', $classStream->id)
            ->where('date', '>=', $term->start_date)
            ->where('date', '<=', $term->end_date)
            ->with(['records:id,attendance_register_id,student_id,status'])
            ->get();

        $schoolDayRegisters = $registers->filter(function ($r) {
            return $r->records->whereIn('status', ['present','late'])->count() > 0;
        });

        $totalSessions = $schoolDayRegisters->count();
        $myRecords = $schoolDayRegisters->flatMap(fn ($r) => $r->records->where('student_id', $student->id));
        $present   = $myRecords->where('status', 'present')->count();
        $late      = $myRecords->where('status', 'late')->count();

        $attendance = [
            'total_sessions' => $totalSessions,
            'present'        => $present,
            'late'           => $late,
            'percentage'     => $totalSessions > 0
                ? round((($present + $late) / $totalSessions) * 100, 1)
                : null,
        ];

        // ---- Subjects (filtered to teacher's scope) ------------------
        $coresQuery = Subject::where('subject_group', 'core')
            ->where('is_active', true)
            ->orderBy('name');

        $specialsQuery = Subject::where('subject_group', 'specialist')
            ->where('is_active', true)
            ->orderBy('name');

        if ($isSubjectTeacherOnly) {
            $coresQuery->whereIn('id', $allowedSubjectIds);
            $specialsQuery->whereIn('id', $allowedSubjectIds);
        }

        $cores = $coresQuery->get();
        $specials = $specialsQuery->get();

        $objectives = AssessmentObjective::with(['strand'])
            ->where('school_class_id', $classStream->school_class_id)
            ->where('term_id', $validated['term_id'])
            ->where('academic_year_id', $year->id)
            ->where('is_active', true)
            ->when($isSubjectTeacherOnly, fn ($q) => $q->whereIn('subject_id', $allowedSubjectIds))
            ->orderBy('order')
            ->get();

        $objectiveResults = AssessmentObjectiveResult::where('student_id', $student->id)
            ->whereIn('assessment_objective_id', $objectives->pluck('id'))
            ->get()
            ->keyBy('assessment_objective_id');

        $subjectAssessments = StudentSubjectAssessment::where('student_id', $student->id)
            ->where('term_id', $validated['term_id'])
            ->where('academic_year_id', $year->id)
            ->get()
            ->keyBy('subject_id');

        $subjectSettings = SubjectTermSetting::where('school_class_id', $classStream->school_class_id)
            ->where('term_id', $validated['term_id'])
            ->where('academic_year_id', $year->id)
            ->get()
            ->keyBy('subject_id');

        // ---- Core subjects payload -----------------------------------
        $corePayload = $cores->map(function (Subject $subject) use (
            $objectives, $objectiveResults, $subjectAssessments, $subjectSettings,
            $classStream, $validated, $year
        ) {
            $setting = $subjectSettings[$subject->id] ?? SubjectTermSetting::forScope(
                $subject->id, $classStream->school_class_id, $validated['term_id'], $year->id
            );
            $totalMarks = (int) ($subject->max_marks ?? $setting->total_marks ?? 100);
            $assessment = $subjectAssessments[$subject->id] ?? null;
            $subjectObjectives = $objectives->where('subject_id', $subject->id);

            $grouped = $subjectObjectives->groupBy('strand_id')->map(function ($list, $strandId) use ($objectiveResults) {
                $strand = $list->first()->strand;
                return [
                    'strand_id'   => (int) $strandId,
                    'strand_name' => $strand?->name ?? 'General',
                    'objectives'  => $list->map(fn ($o) => [
                        'id'     => $o->id,
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

            return [
                'subject_id'          => $subject->id,
                'subject_name'        => $subject->name,
                'total_marks'         => $totalMarks,
                'effort_shown'        => $assessment?->effort_shown,
                'teacher_observation' => $assessment?->teacher_observation,
                'strands'             => $grouped,
                'scored_marks'        => $computed['scored_marks'],
                'percentage'          => $computed['percentage'],
                'grade'               => $computed['grade'],
                'achievement'         => $computed['achievement'],
            ];
        });

        // ---- Specialist payload --------------------------------------
        $specialistPayload = $specials->map(function (Subject $subject) use (
            $subjectAssessments, $subjectSettings, $classStream, $validated, $year
        ) {
            $setting = $subjectSettings[$subject->id] ?? SubjectTermSetting::forScope(
                $subject->id, $classStream->school_class_id, $validated['term_id'], $year->id
            );
            $totalMarks = (int) ($subject->max_marks ?? $setting->total_marks ?? 100);
            $assessment = $subjectAssessments[$subject->id] ?? null;
            $scored = $assessment?->scored_marks;

            if ($scored !== null && $totalMarks > 0 && (float) $scored > $totalMarks) {
                $scored = $totalMarks;
            }

            $percent = $scored !== null && $totalMarks > 0
                ? round(((float) $scored / $totalMarks) * 100, 1) : null;
            [$grade, $achievement] = $percent === null
                ? [null, null] : $this->gradeFor($percent);

            return [
                'subject_id'   => $subject->id,
                'subject_name' => $subject->name,
                'total_marks'  => $totalMarks,
                'scored_marks' => $scored !== null ? (float) $scored : null,
                'percentage'   => $percent,
                'grade'        => $grade,
                'achievement'  => $achievement,
            ];
        });

        // ---- Term length (drives number of weekly test columns) ------
        $totalWeeks = $this->totalWeeksForTerm($term);

        // ---- Weekly tests (class teacher only) -----------------------
        $weekly = [];
        if (!$isSubjectTeacherOnly) {
            $weeklyRows = StudentWeeklyTest::where('student_id', $student->id)
                ->where('term_id', $validated['term_id'])
                ->where('academic_year_id', $year->id)
                ->get();

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
                    'max_score' => $meta['max'],
                    'weeks'     => $weeks,
                ];
            }
        }

        // ---- Report --------------------------------------------------
        $report = null;
        if (!$isSubjectTeacherOnly || $isClubLead) {
            $report = StudentTermReport::where('student_id', $student->id)
                ->where('term_id', $validated['term_id'])
                ->where('academic_year_id', $year->id)
                ->first();
        }

        // ---- Publish state -------------------------------------------
        $submission = TermReportSubmission::with(['submittedBy:id,name', 'publishedBy:id,name'])
            ->where([
                'student_id'       => $student->id,
                'term_id'          => $validated['term_id'],
                'academic_year_id' => $year->id,
            ])->first();

        $isDraft = !$submission || $submission->status === TermReportSubmission::STATUS_DRAFT;
        $isSubmitted = $submission && $submission->status === TermReportSubmission::STATUS_SUBMITTED;

        $publish = [
            'status'            => $submission?->status ?? TermReportSubmission::STATUS_DRAFT,
            'submitted_at'      => $submission?->submitted_at,
            'submitted_by_name' => $submission?->submittedBy?->name,
            'published_at'      => $submission?->published_at,
            'published_by_name' => $submission?->publishedBy?->name,
            'hold_reason'       => $submission?->hold_reason,
            'is_class_teacher'  => $isClassTeacher,
            'can_edit'          => $isDraft,
            'can_submit'        => $isClassTeacher && $isDraft,
            'can_unsubmit'      => $isClassTeacher && $isSubmitted,
        ];

        return response()->json([
            'success' => true,
            'data'    => [
                'student' => [
                    'id'             => $student->id,
                    'student_number' => $student->student_number,
                    'full_name'      => trim("{$student->first_name} {$student->middle_name} {$student->surname}"),
                    'photo_url'      => $student->photo_path ? Storage::disk('public')->url($student->photo_path) : null,
                ],
                'class_stream'  => [
                    'id'   => $classStream->id,
                    'name' => $classStream->name,
                    'school_class_name' => $classStream->schoolClass?->name,
                    'stream_name'       => $classStream->stream?->name,
                ],
                'academic_year' => ['id' => $year->id, 'name' => $year->name],
                'term'          => [
                    'id'         => $term->id,
                    'name'       => $term->name,
                    'start_date' => $term->start_date,
                    'end_date'   => $term->end_date,
                ],
                'attendance'    => $attendance,

                'teacher_scope'           => $isSubjectTeacherOnly ? 'subject_teacher' : 'class_teacher',
                'is_subject_teacher_only' => $isSubjectTeacherOnly,
                'editable_subject_ids'    => $allowedSubjectIds,

                'can_manage_skill_club'   => $canManageSkillClub,
                'led_clubs'               => $ledClubs->map(fn ($c) => [
                    'id' => $c->id, 'name' => $c->name, 'colour' => $c->colour,
                ])->values(),

                'total_weeks'         => $totalWeeks,

                'core_subjects'       => $corePayload,
                'specialist_subjects' => $specialistPayload,
                'weekly_tests'        => $weekly,

                'class_teacher_observation' => $isClassTeacher ? $report?->class_teacher_observation : null,
                'skill_enhancement_club'    => $canManageSkillClub ? $report?->skill_enhancement_club : null,

                'publish'             => $publish,
            ],
        ]);
    }

    /* ============================================================
     * SAVE
     * ============================================================ */

    public function save(Request $request, Student $student)
    {
        $user = $request->user();

        $validated = $request->validate([
            'term_id'          => ['required','integer','exists:academic_terms,id'],
            'academic_year_id' => ['required','integer','exists:academic_years,id'],
            'class_stream_id'  => ['nullable','integer','exists:class_streams,id'],

            'objective_ratings'   => ['nullable','array'],
            'objective_ratings.*.objective_id' => ['required','integer','exists:assessment_objectives,id'],
            'objective_ratings.*.rating'       => ['nullable','string','in:basic,aspiring,good,high,exceeding,unclassified'],

            'core_subjects'      => ['nullable','array'],
            'core_subjects.*.subject_id'          => ['required','integer','exists:subjects,id'],
            'core_subjects.*.effort_shown'        => ['nullable','string','in:basic,aspiring,good,high,exceeding'],
            'core_subjects.*.teacher_observation' => ['nullable','string','max:2000'],

            'specialist_subjects' => ['nullable','array'],
            'specialist_subjects.*.subject_id'   => ['required','integer','exists:subjects,id'],
            'specialist_subjects.*.scored_marks' => ['nullable','numeric','min:0'],

            // Week number range is loosely bounded (1–52) to accommodate
            // any sensible term length without rejecting payloads if the
            // term was shortened/extended mid-flight.
            'weekly_tests'        => ['nullable','array'],
            'weekly_tests.*.test_type'   => ['required','string','in:times_tables,spelling'],
            'weekly_tests.*.week_number' => ['required','integer','between:1,52'],
            'weekly_tests.*.score'       => ['nullable','numeric','min:0'],
            'weekly_tests.*.max_score'   => ['required','numeric','min:0'],

            'class_teacher_observation'  => ['nullable','string','max:5000'],
            'skill_enhancement_club'     => ['nullable','string','max:2000'],
        ]);

        $requestedStreamId = $validated['class_stream_id'] ?? null;
        $classStream = $this->resolveStudentSection($student, $requestedStreamId);
        abort_unless($classStream, 422, 'Student is not attached to any class or section.');

        $this->authorizeSection(
            $user,
            $classStream,
            (int) $validated['academic_year_id'],
            edit: true
        );

        // Lock check
        $submission = TermReportSubmission::where([
            'student_id'       => $student->id,
            'term_id'          => $validated['term_id'],
            'academic_year_id' => $validated['academic_year_id'],
        ])->first();

        if ($submission && $submission->isLocked()) {
            return response()->json([
                'success' => false,
                'message' => 'This report has been submitted for publishing and can no longer be edited.',
                'status'  => $submission->status,
            ], 423);
        }

        // ---- Scored marks cannot exceed max_marks ---------------------
        if (!empty($validated['specialist_subjects'])) {
            $subjectIds = array_column($validated['specialist_subjects'], 'subject_id');
            $subjects = Subject::whereIn('id', $subjectIds)
                ->get(['id', 'name', 'max_marks'])
                ->keyBy('id');

            foreach ($validated['specialist_subjects'] as $row) {
                $scored = $row['scored_marks'] ?? null;
                if ($scored === null) continue;

                $subject = $subjects[$row['subject_id']] ?? null;
                if (!$subject) continue;

                $max = $subject->max_marks !== null ? (int) $subject->max_marks : 100;

                if ((float) $scored > $max) {
                    return response()->json([
                        'success' => false,
                        'message' => sprintf(
                            'Scored marks for "%s" (%s) cannot exceed the maximum of %d.',
                            $subject->name,
                            number_format((float) $scored, 2),
                            $max
                        ),
                    ], 422);
                }
            }
        }

        // ---- Weekly tests cannot exceed their max_score ---------------
        foreach ($validated['weekly_tests'] ?? [] as $row) {
            $score = $row['score'] ?? null;
            $max   = $row['max_score'] ?? 0;
            if ($score !== null && (float) $score > (float) $max) {
                return response()->json([
                    'success' => false,
                    'message' => "Weekly test score ({$score}) cannot exceed {$max}.",
                ], 422);
            }
        }

        // ---- Teacher scope --------------------------------------------
        $allowedSubjectIds = $this->editableSubjects(
            $user, $classStream, (int) $validated['academic_year_id']
        );
        $isSubjectTeacherOnly = $allowedSubjectIds !== null;

        $isClassTeacher = TeacherAssignment::where('user_id', $user->id)
            ->where('class_stream_id', $classStream->id)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('is_active', true)
            ->where('role', TeacherAssignment::ROLE_CLASS_TEACHER)
            ->exists();

        $isClubLead = $this->isClubLead($user, (int) $validated['academic_year_id']);

        foreach ($validated['objective_ratings'] ?? [] as $row) {
            $objective = AssessmentObjective::find($row['objective_id']);

            if (!$objective
                || (int) $objective->school_class_id !== (int) $classStream->school_class_id
                || (int) $objective->term_id !== (int) $validated['term_id']
                || (int) $objective->academic_year_id !== (int) $validated['academic_year_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid objective for this class, term or year.',
                ], 422);
            }

            if ($isSubjectTeacherOnly
                && !in_array($objective->subject_id, $allowedSubjectIds, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only grade subjects assigned to you.',
                ], 403);
            }
        }

        if ($isSubjectTeacherOnly) {
            foreach ($validated['core_subjects'] ?? [] as $row) {
                if (!in_array($row['subject_id'], $allowedSubjectIds, true)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You can only grade subjects assigned to you.',
                    ], 403);
                }
            }
            foreach ($validated['specialist_subjects'] ?? [] as $row) {
                if (!in_array($row['subject_id'], $allowedSubjectIds, true)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You can only grade subjects assigned to you.',
                    ], 403);
                }
            }

            unset($validated['weekly_tests']);
            if (!$isClassTeacher) unset($validated['class_teacher_observation']);
            if (!$isClubLead)    unset($validated['skill_enhancement_club']);
        }

        $year = AcademicYear::findOrFail($validated['academic_year_id']);
        $term = AcademicTerm::findOrFail($validated['term_id']);

        $scope = [
            'term_id'          => $term->id,
            'academic_year_id' => $year->id,
        ];

        DB::transaction(function () use ($validated, $student, $classStream, $user, $scope) {
            foreach ($validated['objective_ratings'] ?? [] as $row) {
                AssessmentObjectiveResult::updateOrCreate(
                    [
                        'assessment_objective_id' => $row['objective_id'],
                        'student_id'              => $student->id,
                    ],
                    [
                        ...$scope,
                        'rating'      => $row['rating'] ?? 'unclassified',
                        'assessed_by' => $user->id,
                    ]
                );
            }

            foreach ($validated['core_subjects'] ?? [] as $row) {
                StudentSubjectAssessment::updateOrCreate(
                    [
                        'student_id'       => $student->id,
                        'subject_id'       => $row['subject_id'],
                        'term_id'          => $scope['term_id'],
                        'academic_year_id' => $scope['academic_year_id'],
                    ],
                    [
                        'class_stream_id'     => $classStream->id,
                        'effort_shown'        => $row['effort_shown'] ?? null,
                        'teacher_observation' => $row['teacher_observation'] ?? null,
                        'assessed_by'         => $user->id,
                    ]
                );
            }

            foreach ($validated['specialist_subjects'] ?? [] as $row) {
                StudentSubjectAssessment::updateOrCreate(
                    [
                        'student_id'       => $student->id,
                        'subject_id'       => $row['subject_id'],
                        'term_id'          => $scope['term_id'],
                        'academic_year_id' => $scope['academic_year_id'],
                    ],
                    [
                        'class_stream_id' => $classStream->id,
                        'scored_marks'    => $row['scored_marks'] ?? null,
                        'assessed_by'     => $user->id,
                    ]
                );
            }

            foreach ($validated['weekly_tests'] ?? [] as $row) {
                StudentWeeklyTest::updateOrCreate(
                    [
                        'student_id'       => $student->id,
                        'test_type'        => $row['test_type'],
                        'week_number'      => $row['week_number'],
                        'term_id'          => $scope['term_id'],
                        'academic_year_id' => $scope['academic_year_id'],
                    ],
                    [
                        'class_stream_id' => $classStream->id,
                        'score'           => $row['score'] ?? null,
                        'max_score'       => $row['max_score'],
                    ]
                );
            }

            // Partial update — club lead saving the skill-club comment
            // must not null out the class teacher's observation, and
            // vice versa.
            $reportUpdates = [];
            if (array_key_exists('class_teacher_observation', $validated)) {
                $reportUpdates['class_teacher_observation'] = $validated['class_teacher_observation'];
            }
            if (array_key_exists('skill_enhancement_club', $validated)) {
                $reportUpdates['skill_enhancement_club'] = $validated['skill_enhancement_club'];
            }

            if (!empty($reportUpdates)) {
                $report = StudentTermReport::firstOrNew([
                    'student_id'       => $student->id,
                    'term_id'          => $scope['term_id'],
                    'academic_year_id' => $scope['academic_year_id'],
                ]);
                $report->class_stream_id = $classStream->id;
                foreach ($reportUpdates as $field => $value) {
                    $report->{$field} = $value;
                }
                $report->save();
            }
        });

        return response()->json(['success' => true, 'message' => 'Saved.']);
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    /**
     * Compute the number of weekly test columns for a term from its
     * start_date and end_date. Falls back to 12 (the historical default)
     * if either date is missing. Capped at 52 for sanity.
     */
    private function totalWeeksForTerm(AcademicTerm $term): int
    {
        if (!$term->start_date || !$term->end_date) {
            return 12;
        }

        try {
            $start = Carbon::parse($term->start_date)->startOfDay();
            $end   = Carbon::parse($term->end_date)->startOfDay();
            if ($end->lt($start)) return 12;

            $days = (int) abs($start->diffInDays($end)) + 1; // inclusive
            $weeks = (int) ceil($days / 7);

            return max(1, min($weeks, 52));
        } catch (\Throwable $e) {
            return 12;
        }
    }

    private function isClubLead($user, ?int $yearId = null): bool
    {
        if (!$user) return false;
        try {
            return Club::whereHas('assignments', function ($q) use ($user, $yearId) {
                $q->where('user_id', $user->id)->where('is_active', true);
                if ($yearId !== null) $q->where('academic_year_id', $yearId);
            })->exists();
        } catch (\Throwable $e) {
            \Log::warning('isClubLead check failed: '.$e->getMessage());
            return false;
        }
    }

    private function ledClubs($user, ?int $yearId = null)
    {
        if (!$user) return collect();
        try {
            return Club::whereHas('assignments', function ($q) use ($user, $yearId) {
                $q->where('user_id', $user->id)->where('is_active', true);
                if ($yearId !== null) $q->where('academic_year_id', $yearId);
            })->orderBy('name')->get(['id', 'name', 'colour']);
        } catch (\Throwable $e) {
            return collect();
        }
    }

    private function editableSubjects($user, ClassStream $classStream, int $academicYearId): ?array
    {
        if (!$user) return [];

        $hasOwner = TeacherAssignment::where('user_id', $user->id)
            ->where('class_stream_id', $classStream->id)
            ->where('academic_year_id', $academicYearId)
            ->where('is_active', true)
            ->whereIn('role', self::OWNER_ASSIGNMENT_ROLES)
            ->exists();

        if ($hasOwner) return null;

        return TeacherAssignment::where('user_id', $user->id)
            ->where('class_stream_id', $classStream->id)
            ->where('academic_year_id', $academicYearId)
            ->where('is_active', true)
            ->where('role', TeacherAssignment::ROLE_SUBJECT_TEACHER)
            ->whereNotNull('subject_id')
            ->pluck('subject_id')
            ->unique()
            ->values()
            ->all();
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
            return [
                'scored_marks' => null,
                'percentage'   => null,
                'grade'        => null,
                'achievement'  => null,
            ];
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

    private function resolveStudentSection(Student $student, ?int $requestedStreamId = null): ?ClassStream
    {
        $with = ['schoolClass:id,name', 'stream:id,name,colour'];

        if ($requestedStreamId) {
            $stream = ClassStream::with($with)->find($requestedStreamId);
            if ($stream && (int) $stream->school_class_id === (int) $student->current_class_id) {
                return $stream;
            }
        }

        if ($student->current_class_stream_id) {
            $direct = ClassStream::with($with)->find($student->current_class_stream_id);
            if ($direct) return $direct;
        }

        if ($student->current_class_id) {
            return ClassStream::with($with)
                ->where('school_class_id', $student->current_class_id)
                ->where('is_active', true)
                ->orderBy('name')
                ->first();
        }

        return null;
    }

    private function normaliseRole(string $role): string
    {
        $role = strtolower(trim($role));
        $role = preg_replace('/[\s\-\.]+/', '_', $role);
        $role = preg_replace('/_+/', '_', $role);
        return trim($role, '_');
    }

    private function isTeacherRole(string $role): bool
    {
        if (in_array($role, self::TEACHER_ROLES, true)) return true;
        return str_ends_with($role, '_teacher') || str_contains($role, 'specialist');
    }

    private function authorizeSection(
        $user,
        ClassStream $classStream,
        ?int $academicYearId = null,
        bool $edit = false
    ): void {
        if (!$user) abort(401, 'Authentication required.');

        $role = $this->normaliseRole((string) ($user->role ?? ''));
        $isViewer  = in_array($role, self::VIEWER_ROLES, true);
        $isTeacher = $this->isTeacherRole($role);

        if ($isViewer) {
            if ($edit) abort(403, 'Your role has read-only access.');
            return;
        }
        if (!$isTeacher) abort(403, 'No access.');

        $q = TeacherAssignment::where('user_id', $user->id)
            ->where('class_stream_id', $classStream->id)
            ->whereIn('role', self::ASSIGNMENT_ROLES);

        if ($academicYearId !== null) {
            $q->where('academic_year_id', $academicYearId);
        }

        if ($q->exists()) return;

        // Club leads need access to any section so they can add the
        // skill-enhancement comment for their club's students.
        if ($this->isClubLead($user, $academicYearId)) return;

        abort(403, 'You are not assigned to this section.');
    }
}