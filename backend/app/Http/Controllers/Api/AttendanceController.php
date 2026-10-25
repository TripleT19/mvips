<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\AttendanceRecord;
use App\Models\AttendanceRegister;
use App\Models\ClassStream;
use App\Models\Student;
use App\Models\TeacherAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AttendanceController extends Controller
{
    /** Viewers — can see every section, cannot mark. */
    private const VIEWER_ROLES = [
        'admin', 'administrator', 'headteacher', 'principal',
        'admissions_officer', 'bursar', 'finance', 'accountant',
        'hod', 'head_of_department',
    ];

    /**
     * Anyone who can open `attendance/sections` at all — this powers the
     * section picker on the Assessment Sheet page, so every teacher role
     * that could plausibly grade a subject must be here.
     */
    private const MARKER_ROLES = [
        // Class-level
        'lead_teacher', 'class_teacher', 'assistant_teacher',
        'teacher',
        'teaching_assistant', 'ta',
        'stream_lead', 'club_lead',

        // Subject & specialists
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

    /** Assignment roles that grant *mark* permission (class-level only). */
    private const CAN_MARK_ASSIGNMENT_ROLES = [
        TeacherAssignment::ROLE_CLASS_TEACHER,
        TeacherAssignment::ROLE_LEAD_TEACHER,
        TeacherAssignment::ROLE_ASSISTANT_TEACHER,
    ];

    /** Assignment roles that grant *section visibility* (all teachers). */
    private const SECTIONS_ASSIGNMENT_ROLES = [
        TeacherAssignment::ROLE_CLASS_TEACHER,
        TeacherAssignment::ROLE_LEAD_TEACHER,
        TeacherAssignment::ROLE_ASSISTANT_TEACHER,
        TeacherAssignment::ROLE_SUBJECT_TEACHER,
    ];

    private const STATUSES = ['present', 'absent', 'late', 'excused', 'sick'];

    private const ATTENDANCE_STATUSES = ['present', 'late'];

    /* ============================================================
     * SECTIONS
     * ============================================================ */

    public function sections(Request $request)
    {
        $user = $request->user();
        $role = $this->normaliseRole((string) ($user->role ?? ''));

        $isViewer  = in_array($role, self::VIEWER_ROLES, true);
        $isTeacher = $this->isTeacherRole($role);

        if (!$isViewer && !$isTeacher) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to attendance registers.',
            ], 403);
        }

        $query = ClassStream::with([
            'schoolClass:id,name',
            'stream:id,name,code,colour',
        ])
            ->where('is_active', true)
            ->orderBy('name');

        if (!$isViewer) {
            $assignedIds = TeacherAssignment::where('user_id', $user->id)
                ->whereIn('role', self::SECTIONS_ASSIGNMENT_ROLES)
                ->whereNotNull('class_stream_id')
                ->pluck('class_stream_id')
                ->unique()
                ->all();

            if (empty($assignedIds)) {
                return response()->json([
                    'success' => true,
                    'data'    => [],
                    'message' => 'You are not yet assigned to a class section.',
                ]);
            }

            $query->whereIn('id', $assignedIds);
        }

        $sections = $query->get()->map(function (ClassStream $cs) use ($user) {
            return [
                'id'                => $cs->id,
                'name'              => $cs->name,
                'school_class_id'   => $cs->school_class_id,
                'school_class_name' => $cs->schoolClass?->name,
                'stream_id'         => $cs->stream_id,
                'stream_name'       => $cs->stream?->name,
                'stream_colour'     => $cs->stream?->colour,
                'can_mark'          => $this->canMark($user, $cs),
                'can_assess'        => $this->canAssess($user, $cs),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data'    => $sections,
        ]);
    }

    /* ============================================================
     * ROSTER
     * ============================================================ */

    public function roster(Request $request, ClassStream $classStream)
    {
        $user = $request->user();

        if (!$this->canView($user, $classStream)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this section.',
            ], 403);
        }

        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $date  = $validated['date'] ?? now()->toDateString();
        $today = now()->toDateString();

        if ($date > $today) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot view or mark a register for a future date.',
            ], 422);
        }

        $classStream->load(['schoolClass:id,name', 'stream:id,name,colour']);

        $academicYear = AcademicYear::where('is_current', true)->first();
        $isToday      = $date === $today;

        $register = AttendanceRegister::where('class_stream_id', $classStream->id)
            ->where('date', $date)
            ->with(['records', 'markedBy:id,name'])
            ->first();

        $studentIds = $this->rosterStudentIds($classStream, $register, $isToday);

        $roster = Student::whereIn('id', $studentIds)
            ->orderBy('surname')
            ->orderBy('first_name')
            ->get(['id', 'student_number', 'first_name', 'middle_name', 'surname', 'photo_path']);

        $recordByStudent = $register
            ? $register->records->keyBy('student_id')
            : collect();

        $students = $roster->map(function (Student $student) use ($recordByStudent) {
            $record = $recordByStudent->get($student->id);

            $photoUrl = $student->photo_path
                ? Storage::disk('public')->url($student->photo_path)
                : null;

            return [
                'id'             => $student->id,
                'student_number' => $student->student_number,
                'full_name'      => trim("{$student->first_name} {$student->middle_name} {$student->surname}"),
                'surname'        => $student->surname,
                'photo_url'      => $photoUrl,
                'status'         => $record?->status ?? 'present',
                'remarks'        => $record?->remarks,
                'marked'         => $record !== null,
            ];
        })->values();

        $canMark = $this->canMark($user, $classStream);

        return response()->json([
            'success' => true,
            'data'    => [
                'date'          => $date,
                'is_today'      => $isToday,
                'class_stream'  => [
                    'id'                => $classStream->id,
                    'name'              => $classStream->name,
                    'school_class_name' => $classStream->schoolClass?->name,
                    'stream_name'       => $classStream->stream?->name,
                    'stream_colour'     => $classStream->stream?->colour,
                ],
                'academic_year' => $academicYear
                    ? ['id' => $academicYear->id, 'name' => $academicYear->name]
                    : null,
                'register'      => $register
                    ? [
                        'id'             => $register->id,
                        'status'         => $register->status,
                        'marked_at'      => $register->marked_at,
                        'marked_by_name' => $register->markedBy?->name,
                    ]
                    : null,
                'students'      => $students,
                'statuses'      => self::STATUSES,
                'can_mark'      => $canMark,
                'can_edit'      => $canMark && $academicYear !== null && $isToday,
            ],
        ]);
    }

    /* ============================================================
     * SAVE
     * ============================================================ */

    public function save(Request $request, ClassStream $classStream)
    {
        $user = $request->user();

        if (!$this->canMark($user, $classStream)) {
            return response()->json([
                'success' => false,
                'message' => 'You can only mark attendance for classes you are currently assigned to.',
            ], 403);
        }

        $validated = $request->validate([
            'date'                 => ['required', 'date_format:Y-m-d'],
            'records'              => ['required', 'array', 'min:1'],
            'records.*.student_id' => ['required', 'integer', 'exists:students,id'],
            'records.*.status'     => ['required', Rule::in(self::STATUSES)],
            'records.*.remarks'    => ['nullable', 'string', 'max:500'],
        ]);

        if ($validated['date'] > now()->toDateString()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot mark a register for a future date.',
            ], 422);
        }

        $academicYear = AcademicYear::where('is_current', true)->first();

        if (!$academicYear) {
            return response()->json([
                'success' => false,
                'message' => 'No current academic year. Ask an administrator to activate one.',
            ], 422);
        }

        $rosterIds = $this->sectionStudentIds($classStream);

        foreach ($validated['records'] as $i => $row) {
            if (!in_array($row['student_id'], $rosterIds, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Row ' . ($i + 1) . ': student is not in this section.',
                ], 422);
            }
        }

        $register = DB::transaction(function () use ($classStream, $academicYear, $validated, $user) {
            $register = AttendanceRegister::updateOrCreate(
                [
                    'class_stream_id' => $classStream->id,
                    'date'            => $validated['date'],
                ],
                [
                    'academic_year_id' => $academicYear->id,
                    'marked_by'        => $user->id,
                    'marked_at'        => now(),
                    'status'           => 'submitted',
                ]
            );

            foreach ($validated['records'] as $row) {
                AttendanceRecord::updateOrCreate(
                    [
                        'attendance_register_id' => $register->id,
                        'student_id'             => $row['student_id'],
                    ],
                    [
                        'status'  => $row['status'],
                        'remarks' => $row['remarks'] ?? null,
                    ]
                );
            }

            return $register;
        });

        return response()->json([
            'success' => true,
            'message' => 'Register saved.',
            'data'    => [
                'register_id'  => $register->id,
                'date'         => $register->date->toDateString(),
                'record_count' => count($validated['records']),
            ],
        ]);
    }

    /* ============================================================
     * HISTORY
     * ============================================================ */

    public function history(Request $request, ClassStream $classStream)
    {
        $user = $request->user();

        if (!$this->canView($user, $classStream)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this section.',
            ], 403);
        }

        $validated = $request->validate([
            'from'   => ['nullable', 'date_format:Y-m-d'],
            'to'     => ['nullable', 'date_format:Y-m-d'],
            'search' => ['nullable', 'string', 'max:100'],
            'sort'   => ['nullable', Rule::in(['newest', 'oldest'])],
            'limit'  => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        $today = now()->toDateString();

        $query = AttendanceRegister::where('class_stream_id', $classStream->id)
            ->with(['markedBy:id,name'])
            ->withCount([
                'records as present_count' => fn ($q) => $q->where('status', 'present'),
                'records as absent_count'  => fn ($q) => $q->where('status', 'absent'),
                'records as late_count'    => fn ($q) => $q->where('status', 'late'),
                'records as excused_count' => fn ($q) => $q->where('status', 'excused'),
                'records as sick_count'    => fn ($q) => $q->where('status', 'sick'),
                'records as total_count',
            ]);

        $query->where('date', '<=', $today);

        if (!empty($validated['from'])) $query->where('date', '>=', $validated['from']);
        if (!empty($validated['to']))   $query->where('date', '<=', $validated['to']);

        if (!empty($validated['search'])) {
            $s = trim($validated['search']);
            $query->where(function ($q) use ($s) {
                $q->whereDate('date', 'like', "%{$s}%")
                  ->orWhereHas('markedBy', fn ($m) => $m->where('name', 'like', "%{$s}%"));
            });
        }

        $sort = $validated['sort'] ?? 'newest';
        $sort === 'oldest' ? $query->orderBy('date') : $query->orderByDesc('date');

        $limit = $validated['limit'] ?? 90;
        $registers = $query->limit($limit)->get();

        $rows = $registers->map(function ($r) {
            $attended  = $r->present_count + $r->late_count;
            $isHoliday = $r->total_count > 0
                && $attended === 0
                && $r->excused_count === 0
                && $r->sick_count === 0;

            return [
                'id'             => $r->id,
                'date'           => $r->date->toDateString(),
                'status'         => $r->status,
                'marked_at'      => $r->marked_at,
                'marked_by_name' => $r->markedBy?->name,
                'present_count'  => $r->present_count,
                'absent_count'   => $r->absent_count,
                'late_count'     => $r->late_count,
                'excused_count'  => $r->excused_count,
                'sick_count'     => $r->sick_count,
                'total_count'    => $r->total_count,
                'is_holiday'     => $isHoliday,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $rows,
            'meta'    => [
                'from'  => $validated['from'] ?? null,
                'to'    => $validated['to'] ?? $today,
                'sort'  => $sort,
                'limit' => $limit,
                'count' => $rows->count(),
            ],
        ]);
    }

    /* ============================================================
     * SUMMARY
     * ============================================================ */

    public function summary(Request $request, ClassStream $classStream)
    {
        $user = $request->user();

        if (!$this->canView($user, $classStream)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this section.',
            ], 403);
        }

        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to'   => ['nullable', 'date_format:Y-m-d'],
        ]);

        $today = now()->toDateString();

        $registerQuery = AttendanceRegister::with(['records'])
            ->where('class_stream_id', $classStream->id)
            ->where('date', '<=', $today);

        if (!empty($validated['from'])) $registerQuery->where('date', '>=', $validated['from']);
        if (!empty($validated['to']))   $registerQuery->where('date', '<=', $validated['to']);

        $registers = $registerQuery->orderBy('date')->get();

        $holidayDates   = [];
        $schoolDayDates = [];

        foreach ($registers as $register) {
            $presentOrLate = $register->records
                ->whereIn('status', self::ATTENDANCE_STATUSES)
                ->count();

            if ($presentOrLate > 0) {
                $schoolDayDates[] = $register->date->toDateString();
            } else {
                $holidayDates[] = $register->date->toDateString();
            }
        }

        $totalSchoolDays = count($schoolDayDates);
        $holidaySet      = array_flip($holidayDates);

        $registerStudentIds = $registers
            ->flatMap(fn ($r) => $r->records->pluck('student_id'))
            ->unique();

        $currentStudentIds = collect($this->sectionStudentIds($classStream));

        $allIds = $registerStudentIds->merge($currentStudentIds)->unique()->values()->all();

        $students = Student::whereIn('id', $allIds)
            ->orderBy('surname')
            ->orderBy('first_name')
            ->get();

        $studentStats = [];

        foreach ($students as $student) {
            $present = 0;
            $late    = 0;
            $excused = 0;
            $sick    = 0;
            $absent  = 0;

            foreach ($registers as $register) {
                $key = $register->date->toDateString();
                if (isset($holidaySet[$key])) continue;

                $record = $register->records->firstWhere('student_id', $student->id);
                if (!$record) continue;

                switch ($record->status) {
                    case 'present': $present++; break;
                    case 'late':    $late++;    break;
                    case 'excused': $excused++; break;
                    case 'sick':    $sick++;    break;
                    case 'absent':  $absent++;  break;
                }
            }

            $daysAttended = $present + $late;
            $percentage   = $totalSchoolDays > 0
                ? round(($daysAttended / $totalSchoolDays) * 100, 1)
                : 0.0;

            $studentStats[] = [
                'student_id'        => $student->id,
                'student_number'    => $student->student_number,
                'full_name'         => trim("{$student->first_name} {$student->middle_name} {$student->surname}"),
                'photo_url'         => $student->photo_path
                    ? Storage::disk('public')->url($student->photo_path)
                    : null,
                'days_attended'     => $daysAttended,
                'days_present'      => $present,
                'days_late'         => $late,
                'days_absent'       => $absent,
                'days_excused'      => $excused,
                'days_sick'         => $sick,
                'total_school_days' => $totalSchoolDays,
                'percentage'        => $percentage,
            ];
        }

        usort($studentStats, fn ($a, $b) => $a['percentage'] <=> $b['percentage']);

        return response()->json([
            'success' => true,
            'data'    => [
                'class_stream'       => ['id' => $classStream->id, 'name' => $classStream->name],
                'period'             => [
                    'from' => $validated['from'] ?? ($registers->first()?->date?->toDateString()),
                    'to'   => $validated['to'] ?? $today,
                ],
                'total_school_days'  => $totalSchoolDays,
                'total_holiday_days' => count($holidayDates),
                'holiday_dates'      => $holidayDates,
                'students'           => $studentStats,
            ],
        ]);
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    private function normaliseRole(string $role): string
    {
        $role = strtolower(trim($role));
        $role = preg_replace('/[\s\-\.]+/', '_', $role);
        $role = preg_replace('/_+/', '_', $role);
        return trim($role, '_');
    }

    private function isTeacherRole(string $role): bool
    {
        if (in_array($role, self::MARKER_ROLES, true)) {
            return true;
        }
        return str_ends_with($role, '_teacher') || str_contains($role, 'specialist');
    }

    /**
     * Can this user MARK attendance for this section?
     * Requires BOTH a teacher user role AND a class-level assignment.
     * Specialists never pass — even if they teach in the section.
     */
    private function canMark($user, ClassStream $classStream): bool
    {
        if (!$user) return false;

        $role = $this->normaliseRole((string) ($user->role ?? ''));

        if (!$this->isTeacherRole($role)) return false;

        $currentYearId = AcademicYear::where('is_current', true)->value('id');
        if (!$currentYearId) return false;

        return TeacherAssignment::where('user_id', $user->id)
            ->where('class_stream_id', $classStream->id)
            ->where('academic_year_id', $currentYearId)
            ->where('is_active', true)
            ->whereIn('role', self::CAN_MARK_ASSIGNMENT_ROLES)
            ->exists();
    }

    /**
     * Can this user open the Assessment Sheet for this section?
     * True for any teacher (including subject specialists) who is
     * assigned to the section. Viewers are excluded — they use the
     * results-publishing page instead.
     */
    private function canAssess($user, ClassStream $classStream): bool
    {
        if (!$user) return false;

        $role = $this->normaliseRole((string) ($user->role ?? ''));

        if (in_array($role, self::VIEWER_ROLES, true)) return false;
        if (!$this->isTeacherRole($role)) return false;

        return TeacherAssignment::where('user_id', $user->id)
            ->where('class_stream_id', $classStream->id)
            ->whereIn('role', self::SECTIONS_ASSIGNMENT_ROLES)
            ->exists();
    }

    /**
     * Can this user VIEW the section's registers at all?
     * Viewers always can. Teachers can if any assignment on the
     * section exists (class-level or subject).
     */
    private function canView($user, ClassStream $classStream): bool
    {
        if (!$user) return false;

        $role = $this->normaliseRole((string) ($user->role ?? ''));

        if (in_array($role, self::VIEWER_ROLES, true)) return true;
        if (!$this->isTeacherRole($role)) return false;

        return TeacherAssignment::where('user_id', $user->id)
            ->where('class_stream_id', $classStream->id)
            ->whereIn('role', self::SECTIONS_ASSIGNMENT_ROLES)
            ->exists();
    }

    /**
     * Resolve which student IDs appear on a register for a given date.
     */
    private function rosterStudentIds(ClassStream $classStream, ?AttendanceRegister $register, bool $isToday): array
    {
        if (!$isToday && $register && $register->records->isNotEmpty()) {
            return $register->records->pluck('student_id')->unique()->values()->all();
        }

        return $this->sectionStudentIds($classStream);
    }

    /**
     * Resolve student IDs currently enrolled in this section.
     * Prefer strict stream assignment; fall back to class-level students.
     */
    private function sectionStudentIds(ClassStream $classStream): array
    {
        $strict = Student::where('status', 'active')
            ->where('current_class_stream_id', $classStream->id)
            ->pluck('id')
            ->all();

        if (!empty($strict)) {
            return $strict;
        }

        return Student::where('status', 'active')
            ->whereNull('current_class_stream_id')
            ->where('current_class_id', $classStream->school_class_id)
            ->pluck('id')
            ->all();
    }
}