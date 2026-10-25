<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\AdmissionApplication;
use App\Models\AttendanceRegister;
use App\Models\ClassStream;
use App\Models\Event;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\Gallery;
use App\Models\Story;
use App\Models\Student;
use App\Models\TeacherAssignment;
use App\Models\TermReportSubmission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DashboardController extends Controller
{
    private const ADMIN_ROLES       = ['admin', 'administrator', 'super_admin', 'superadmin'];
    private const HEADTEACHER_ROLES = ['headteacher', 'head_teacher', 'principal', 'vice_principal', 'deputy_head', 'head'];
    private const HOD_ROLES         = ['hod', 'head_of_department', 'head_of_subject', 'subject_head'];
    private const BURSAR_ROLES      = ['bursar', 'finance', 'accountant'];
    private const ADMISSION_ROLES   = ['admissions_officer', 'admissions'];
    private const PARENT_ROLES      = ['parent', 'guardian'];
    private const EDITOR_ROLES      = ['editor', 'content_editor', 'staff'];

    private const ASSIGNMENT_ROLES = [
        TeacherAssignment::ROLE_CLASS_TEACHER,
        TeacherAssignment::ROLE_LEAD_TEACHER,
        TeacherAssignment::ROLE_ASSISTANT_TEACHER,
        TeacherAssignment::ROLE_SUBJECT_TEACHER,
        TeacherAssignment::ROLE_CLUB_LEAD,
    ];

    /* ============================================================
     * MAIN ENTRY
     * ============================================================ */

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Authentication required.');

        $role      = $this->normaliseRole((string) $user->role);
        $roleGroup = $this->roleGroup($role);

        return response()->json([
            'success' => true,
            'data'    => [
                'role_group' => $roleGroup,
                'role_label' => $this->roleLabel($role),
                'name'       => $user->name,
                'subtitle'   => $this->roleSubtitle($roleGroup),
                'payload'    => $this->payloadFor($user, $roleGroup),
            ],
        ]);
    }

    /* ============================================================
     * ROLE MAPPING
     * ============================================================ */

    private function roleGroup(string $role): string
    {
        if (in_array($role, self::ADMIN_ROLES, true)) return 'admin';
        if (in_array($role, self::HEADTEACHER_ROLES, true)) return 'headteacher';
        if (in_array($role, self::HOD_ROLES, true)) return 'teacher';
        if (in_array($role, self::BURSAR_ROLES, true)) return 'bursar';
        if (in_array($role, self::ADMISSION_ROLES, true)) return 'admissions';
        if (in_array($role, self::PARENT_ROLES, true)) return 'parent';
        if (in_array($role, self::EDITOR_ROLES, true)) return 'editor';
        return 'teacher';
    }

    private function roleLabel(string $role): string
    {
        $map = [
            'admin' => 'Administrator', 'administrator' => 'Administrator',
            'super_admin' => 'Super Administrator', 'superadmin' => 'Super Administrator',
            'headteacher' => 'Headteacher', 'head_teacher' => 'Headteacher',
            'principal' => 'Principal', 'vice_principal' => 'Vice Principal',
            'deputy_head' => 'Deputy Head', 'head' => 'Head',
            'hod' => 'Head of Department', 'head_of_department' => 'Head of Department',
            'head_of_subject' => 'Head of Subject', 'subject_head' => 'Subject Head',
            'bursar' => 'Bursar', 'finance' => 'Finance', 'accountant' => 'Accountant',
            'admissions_officer' => 'Admissions Officer', 'admissions' => 'Admissions',
            'parent' => 'Parent', 'guardian' => 'Guardian',
            'editor' => 'Editor', 'content_editor' => 'Content Editor', 'staff' => 'Staff',
        ];
        if (isset($map[$role])) return $map[$role];
        return ucfirst(str_replace('_', ' ', $role));
    }

    private function roleSubtitle(string $group): string
    {
        return match ($group) {
            'admin'       => 'System & content overview',
            'headteacher' => 'School leadership overview',
            'teacher'     => 'Your teaching overview',
            'bursar'      => 'Financial overview',
            'admissions'  => 'Admissions pipeline',
            'editor'      => 'Website content overview',
            'parent'      => 'Parent portal',
            default       => 'Overview',
        };
    }

    private function payloadFor(User $user, string $group): array
    {
        return match ($group) {
            'admin'       => $this->adminPayload(),
            'headteacher' => $this->headteacherPayload(),
            'teacher'     => $this->teacherPayload($user),
            'bursar'      => $this->bursarPayload(),
            'admissions'  => $this->admissionsPayload(),
            'editor'      => $this->editorPayload(),
            default       => ['stats' => []],
        };
    }

    /* ============================================================
     * ADMIN — results, users, CMS. NO admissions, NO fees.
     * ============================================================ */

    private function adminPayload(): array
    {
        $yearId = AcademicYear::where('is_current', true)->value('id');
        $termId = AcademicTerm::where('is_current', true)->value('id');

        /* ---- Results ---- */
        $submittedResults = TermReportSubmission::where('status', TermReportSubmission::STATUS_SUBMITTED)
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->count();

        $publishedResults = TermReportSubmission::where('status', TermReportSubmission::STATUS_PUBLISHED)
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->count();

        /* ---- Users ---- */
        $totalUsers  = User::count();
        $activeUsers = User::where('is_active', true)->count();

        /* ---- CMS ---- */
        $totalStories     = Story::count();
        $publishedStories = Story::where('status', 'published')->count();
        $draftStories     = Story::where('status', 'draft')->count();

        /* ---- Recent submissions (results pipeline) ---- */
        $recentSubmissions = TermReportSubmission::with([
                'student:id,student_number,first_name,middle_name,surname,photo_path',
                'classStream:id,name',
                'term:id,name',
                'submittedBy:id,name',
            ])
            ->whereIn('status', [
                TermReportSubmission::STATUS_SUBMITTED,
                TermReportSubmission::STATUS_HELD,
            ])
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->latest('submitted_at')
            ->limit(6)
            ->get()
            ->map(fn ($s) => $this->formatSubmission($s));

        /* ---- Recent users ---- */
        $recentUsers = User::orderByDesc('created_at')
            ->limit(6)
            ->get(['id', 'name', 'email', 'role', 'is_active', 'created_at'])
            ->map(fn ($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => $u->role,
                'role_label' => $this->roleLabel($this->normaliseRole((string) $u->role)),
                'is_active'  => (bool) $u->is_active,
                'created_at' => $u->created_at,
            ]);

        /* ---- Recent stories ---- */
        $recentStories = Story::with('category:id,name')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($s) => [
                'id'         => $s->id,
                'title'      => $s->title,
                'status'     => $s->status,
                'featured'   => (bool) $s->featured,
                'author'     => $s->author,
                'category'   => $s->category?->name,
                'created_at' => $s->created_at,
            ]);

        return [
            'stats' => [
                [
                    'label' => 'Submitted results',
                    'value' => $submittedResults,
                    'hint'  => 'Awaiting publish',
                    'tone'  => $submittedResults > 0 ? 'amber' : 'emerald',
                    'icon'  => 'file',
                ],
                [
                    'label' => 'Published results',
                    'value' => $publishedResults,
                    'hint'  => 'Current term',
                    'tone'  => 'emerald',
                    'icon'  => 'check',
                ],
                [
                    'label' => 'Users',
                    'value' => $totalUsers,
                    'hint'  => "{$activeUsers} active",
                    'tone'  => 'violet',
                    'icon'  => 'users',
                ],
                [
                    'label' => 'Stories',
                    'value' => $totalStories,
                    'hint'  => "{$publishedStories} published · {$draftStories} draft",
                    'tone'  => 'blue',
                    'icon'  => 'book',
                ],
            ],
            'recent_submissions' => $recentSubmissions,
            'recent_users'       => $recentUsers,
            'recent_stories'     => $recentStories,
        ];
    }

    /* ============================================================
     * HEADTEACHER — fees, admissions, attendance, results overview
     * ============================================================ */

    private function headteacherPayload(): array
    {
        $yearId = AcademicYear::where('is_current', true)->value('id');
        $termId = AcademicTerm::where('is_current', true)->value('id');
        $today  = now()->toDateString();

        /* ---- Fees ---- */
        $invoiceQuery = FeeInvoice::query()
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->when($termId, fn ($q) => $q->where('term_id', $termId));

        $billed      = (float) (clone $invoiceQuery)->sum('total_amount');
        $collected   = (float) (clone $invoiceQuery)->sum('amount_paid');
        $outstanding = max(0, $billed - $collected);
        $collectionRate = $billed > 0 ? round(($collected / $billed) * 100, 1) : 0;

        /* ---- Attendance today ---- */
        $totalSections = ClassStream::where('is_active', true)->count();
        $markedToday   = AttendanceRegister::where('date', $today)->count();
        $attendancePct = $totalSections > 0
            ? round(($markedToday / $totalSections) * 100)
            : 0;

        /* ---- Admissions ---- */
        $admissionsBase = AdmissionApplication::whereNotIn('status', ['draft']);

        $pipeline = [
            'submitted'             => (clone $admissionsBase)->where('status', 'submitted')->count(),
            'document_verification' => (clone $admissionsBase)->where('status', 'document_verification')->count(),
            'assessments_scheduled' => (clone $admissionsBase)->where('status', 'assessment_scheduled')->count(),
            'assessments_completed' => (clone $admissionsBase)->where('status', 'assessment_completed')->count(),
            'awaiting_approval'     => (clone $admissionsBase)->where('status', 'principal_review')->count(),
            'approved'              => (clone $admissionsBase)->where('status', 'approved')->count(),
            'enrolled'              => (clone $admissionsBase)->where('status', 'enrolled')->count(),
        ];

        $pendingAdmissions = $pipeline['submitted']
            + $pipeline['document_verification']
            + $pipeline['assessments_scheduled']
            + $pipeline['assessments_completed']
            + $pipeline['awaiting_approval'];

        /* ---- Pending results ---- */
        $pendingResults = TermReportSubmission::where('status', TermReportSubmission::STATUS_SUBMITTED)
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->count();

        /* ---- Recent submissions ---- */
        $recentSubmissions = TermReportSubmission::with([
                'student:id,student_number,first_name,middle_name,surname,photo_path',
                'classStream:id,name',
                'term:id,name',
                'submittedBy:id,name',
            ])
            ->whereIn('status', [
                TermReportSubmission::STATUS_SUBMITTED,
                TermReportSubmission::STATUS_HELD,
            ])
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->latest('submitted_at')
            ->limit(6)
            ->get()
            ->map(fn ($s) => $this->formatSubmission($s));

        return [
            'stats' => [
                [
                    'label' => 'Fees outstanding',
                    'value' => $this->formatMoneyShort($outstanding),
                    'hint'  => 'MWK · current term',
                    'tone'  => $outstanding > 0 ? 'amber' : 'emerald',
                    'icon'  => 'dollar',
                ],
                [
                    'label' => 'Attendance today',
                    'value' => "{$attendancePct}%",
                    'hint'  => "{$markedToday} of {$totalSections} sections",
                    'tone'  => $attendancePct >= 80 ? 'emerald' : ($attendancePct >= 50 ? 'amber' : 'slate'),
                    'icon'  => 'clipboard',
                ],
                [
                    'label' => 'Pending admissions',
                    'value' => $pendingAdmissions,
                    'hint'  => 'In pipeline',
                    'tone'  => $pendingAdmissions > 0 ? 'violet' : 'emerald',
                    'icon'  => 'inbox',
                ],
                [
                    'label' => 'Pending results',
                    'value' => $pendingResults,
                    'hint'  => 'Awaiting publish',
                    'tone'  => $pendingResults > 0 ? 'amber' : 'emerald',
                    'icon'  => 'file',
                ],
            ],
            'fees_snapshot' => [
                'billed'          => $billed,
                'collected'       => $collected,
                'outstanding'     => $outstanding,
                'collection_rate' => $collectionRate,
            ],
            'admissions_pipeline' => $pipeline,
            'attendance_today'    => [
                'total'   => $totalSections,
                'marked'  => $markedToday,
                'percent' => $attendancePct,
            ],
            'recent_submissions' => $recentSubmissions,
        ];
    }

    /* ============================================================
     * TEACHER (incl. specialists, TAs, club leads) — no CMS
     * ============================================================ */

    private function teacherPayload(User $user): array
    {
        $year = AcademicYear::where('is_current', true)->first();
        if (!$year) {
            return [
                'stats'   => [],
                'message' => 'No current academic year. Contact the administration.',
            ];
        }

        $assignments = TeacherAssignment::with([
                'classStream:id,name,stream_id,school_class_id',
                'classStream.stream:id,name,colour',
                'subject:id,name,code',
            ])
            ->where('user_id', $user->id)
            ->where('academic_year_id', $year->id)
            ->where('is_active', true)
            ->whereIn('role', self::ASSIGNMENT_ROLES)
            ->get();

        if ($assignments->isEmpty()) {
            return [
                'stats'   => [],
                'message' => 'You have no active class or subject assignments this academic year.',
            ];
        }

        /* ---- Group assignments by section ---- */
        $sectionsMap = [];
        foreach ($assignments as $a) {
            if (!$a->class_stream_id) continue;
            $sid = $a->class_stream_id;
            if (!isset($sectionsMap[$sid])) {
                $sectionsMap[$sid] = [
                    'id'            => $sid,
                    'name'          => $a->classStream?->name ?? 'Section',
                    'stream_colour' => $a->classStream?->stream?->colour,
                    'roles'         => [],
                    'subjects'      => [],
                ];
            }
            $sectionsMap[$sid]['roles'][] = $a->role;
            if ($a->subject) {
                $sectionsMap[$sid]['subjects'][] = $a->subject->name;
            }
        }

        $sectionIds = array_keys($sectionsMap);

        /* ---- Today's registers ---- */
        $today = now()->toDateString();
        $todayRegisters = empty($sectionIds)
            ? collect()
            : AttendanceRegister::whereIn('class_stream_id', $sectionIds)
                ->where('date', $today)
                ->get()
                ->keyBy('class_stream_id');

        /* ---- Student counts per section ---- */
        $studentCounts = empty($sectionIds)
            ? collect()
            : Student::where('status', 'active')
                ->whereIn('current_class_stream_id', $sectionIds)
                ->selectRaw('current_class_stream_id, count(*) as c')
                ->groupBy('current_class_stream_id')
                ->pluck('c', 'current_class_stream_id');

        /* ---- Format sections ---- */
        $sectionsArr = [];
        foreach ($sectionsMap as $sid => $s) {
            $roles          = array_values(array_unique($s['roles']));
            $isClassTeacher = in_array(TeacherAssignment::ROLE_CLASS_TEACHER, $roles, true)
                           || in_array(TeacherAssignment::ROLE_LEAD_TEACHER, $roles, true);

            $register = $todayRegisters->get($sid);

            $sectionsArr[] = [
                'id'                  => $sid,
                'name'                => $s['name'],
                'stream_colour'       => $s['stream_colour'],
                'roles'               => $roles,
                'subjects'            => array_values(array_unique($s['subjects'])),
                'is_class_teacher'    => $isClassTeacher,
                'student_count'       => (int) ($studentCounts[$sid] ?? 0),
                'attendance_marked'   => $register !== null,
                'attendance_marked_at'=> $register?->marked_at,
            ];
        }

        /* ---- Recent submissions from class-teacher sections ---- */
        $classTeacherSectionIds = collect($sectionsArr)
            ->where('is_class_teacher', true)
            ->pluck('id')
            ->all();

        $recentSubmissions = empty($classTeacherSectionIds)
            ? collect()
            : TermReportSubmission::with([
                    'student:id,student_number,first_name,middle_name,surname,photo_path',
                    'classStream:id,name',
                    'term:id,name',
                    'submittedBy:id,name',
                ])
                ->whereIn('class_stream_id', $classTeacherSectionIds)
                ->whereIn('status', [
                    TermReportSubmission::STATUS_DRAFT,
                    TermReportSubmission::STATUS_SUBMITTED,
                ])
                ->latest('updated_at')
                ->limit(6)
                ->get()
                ->map(fn ($s) => $this->formatSubmission($s));

        /* ---- Stats ---- */
        $unmarkedCount = collect($sectionsArr)
            ->where('is_class_teacher', true)
            ->where('attendance_marked', false)
            ->count();

        $draftCount    = $recentSubmissions->where('status', TermReportSubmission::STATUS_DRAFT)->count();
        $totalStudents = collect($sectionsArr)->sum('student_count');

        return [
            'stats' => [
                [
                    'label' => 'My sections',
                    'value' => count($sectionsArr),
                    'hint'  => 'Teaching this year',
                    'tone'  => 'blue',
                    'icon'  => 'school',
                ],
                [
                    'label' => 'Students',
                    'value' => $totalStudents,
                    'hint'  => 'Across my sections',
                    'tone'  => 'violet',
                    'icon'  => 'users',
                ],
                [
                    'label' => 'Attendance pending',
                    'value' => $unmarkedCount,
                    'hint'  => $unmarkedCount === 0 ? 'All marked today' : 'Unmarked today',
                    'tone'  => $unmarkedCount > 0 ? 'amber' : 'emerald',
                    'icon'  => 'clipboard',
                ],
                [
                    'label' => 'Draft reports',
                    'value' => $draftCount,
                    'hint'  => 'Waiting to be submitted',
                    'tone'  => $draftCount > 0 ? 'amber' : 'emerald',
                    'icon'  => 'file',
                ],
            ],
            'sections'           => $sectionsArr,
            'recent_submissions' => $recentSubmissions,
        ];
    }

    /* ============================================================
     * BURSAR / FINANCE
     * ============================================================ */

    private function bursarPayload(): array
    {
        $yearId = AcademicYear::where('is_current', true)->value('id');
        $termId = AcademicTerm::where('is_current', true)->value('id');

        $invoiceQuery = FeeInvoice::query()
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->when($termId, fn ($q) => $q->where('term_id', $termId));

        $billed       = (float) (clone $invoiceQuery)->sum('total_amount');
        $collected    = (float) (clone $invoiceQuery)->sum('amount_paid');
        $outstanding  = max(0, $billed - $collected);
        $invoiceCount = (clone $invoiceQuery)->count();

        $recentPayments = FeePayment::with([
                'student:id,first_name,middle_name,surname,student_number',
                'bankAccount:id,name',
            ])
            ->when($yearId, fn ($q) => $q->whereHas('invoice', fn ($q2) => $q2->where('academic_year_id', $yearId)))
            ->when($termId, fn ($q) => $q->whereHas('invoice', fn ($q2) => $q2->where('term_id', $termId)))
            ->orderByDesc('paid_on')
            ->orderByDesc('id')
            ->limit(6)
            ->get()
            ->map(fn ($p) => [
                'id'           => $p->id,
                'student_name' => trim("{$p->student->first_name} {$p->student->middle_name} {$p->student->surname}"),
                'amount'       => (float) $p->amount,
                'method'       => $p->payment_method,
                'paid_on'      => $p->paid_on,
                'bank_account' => $p->bankAccount?->name,
            ]);

        $topOutstanding = FeeInvoice::with([
                'student:id,first_name,middle_name,surname,student_number',
                'feeStructure:id,name',
            ])
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->whereIn('status', ['pending', 'partial'])
            ->orderByRaw('(total_amount - amount_paid) DESC')
            ->limit(5)
            ->get()
            ->map(fn ($inv) => [
                'invoice_id'     => $inv->id,
                'student_name'   => trim("{$inv->student->first_name} {$inv->student->middle_name} {$inv->student->surname}"),
                'student_number' => $inv->student->student_number,
                'structure'      => $inv->feeStructure?->name,
                'total'          => (float) $inv->total_amount,
                'paid'           => (float) $inv->amount_paid,
                'balance'        => max(0, (float) $inv->total_amount - (float) $inv->amount_paid),
                'status'         => $inv->status,
            ]);

        return [
            'stats' => [
                [
                    'label' => 'Billed',
                    'value' => $this->formatMoneyShort($billed),
                    'hint'  => 'MWK · current term',
                    'tone'  => 'blue',
                    'icon'  => 'receipt',
                ],
                [
                    'label' => 'Collected',
                    'value' => $this->formatMoneyShort($collected),
                    'hint'  => 'MWK · current term',
                    'tone'  => 'emerald',
                    'icon'  => 'wallet',
                ],
                [
                    'label' => 'Outstanding',
                    'value' => $this->formatMoneyShort($outstanding),
                    'hint'  => "MWK · {$invoiceCount} invoices",
                    'tone'  => $outstanding > 0 ? 'amber' : 'emerald',
                    'icon'  => 'dollar',
                ],
                [
                    'label' => 'Collection rate',
                    'value' => $billed > 0 ? round(($collected / $billed) * 100, 1) . '%' : '0%',
                    'hint'  => 'Current term',
                    'tone'  => 'violet',
                    'icon'  => 'trending',
                ],
            ],
            'recent_payments' => $recentPayments,
            'top_outstanding' => $topOutstanding,
        ];
    }

    /* ============================================================
     * ADMISSIONS
     * ============================================================ */

    private function admissionsPayload(): array
    {
        $base = AdmissionApplication::whereNotIn('status', ['draft']);

        $pipeline = [
            'submitted'             => (clone $base)->where('status', 'submitted')->count(),
            'document_verification' => (clone $base)->where('status', 'document_verification')->count(),
            'assessments_scheduled' => (clone $base)->where('status', 'assessment_scheduled')->count(),
            'assessments_completed' => (clone $base)->where('status', 'assessment_completed')->count(),
            'awaiting_approval'     => (clone $base)->where('status', 'principal_review')->count(),
            'approved'              => (clone $base)->where('status', 'approved')->count(),
            'denied'                => (clone $base)->where('status', 'denied')->count(),
            'waitlisted'            => (clone $base)->where('status', 'waitlisted')->count(),
            'enrolled'              => (clone $base)->where('status', 'enrolled')->count(),
        ];

        return [
            'stats' => [
                [
                    'label' => 'Total applications',
                    'value' => (clone $base)->count(),
                    'hint'  => 'Non-draft',
                    'tone'  => 'blue',
                    'icon'  => 'users',
                ],
                [
                    'label' => 'Submitted',
                    'value' => $pipeline['submitted'],
                    'hint'  => 'Awaiting processing',
                    'tone'  => 'violet',
                    'icon'  => 'inbox',
                ],
                [
                    'label' => 'Awaiting review',
                    'value' => $pipeline['awaiting_approval'],
                    'hint'  => 'Principal review',
                    'tone'  => 'amber',
                    'icon'  => 'clipboard',
                ],
                [
                    'label' => 'Enrolled',
                    'value' => $pipeline['enrolled'],
                    'hint'  => 'This year',
                    'tone'  => 'emerald',
                    'icon'  => 'check',
                ],
            ],
            'admissions_pipeline' => $pipeline,
            'recent_applications' => AdmissionApplication::whereNotIn('status', ['draft'])
                ->with(['academicYear:id,name', 'classApplied:id,name'])
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn ($a) => [
                    'id'             => $a->id,
                    'number'         => $a->application_number,
                    'name'           => trim("{$a->legal_first_name} {$a->middle_name} {$a->legal_surname}"),
                    'status'         => $a->status,
                    'submitted_at'   => $a->submitted_at,
                    'class_applied'  => $a->classApplied?->name,
                    'academic_year'  => $a->academicYear?->name,
                ])
                ->values(),
        ];
    }

    /* ============================================================
     * EDITOR / STAFF
     * ============================================================ */

    private function editorPayload(): array
    {
        $totalStories     = Story::count();
        $publishedStories = Story::where('status', 'published')->count();
        $draftStories     = Story::where('status', 'draft')->count();
        $totalEvents      = Event::count();
        $galleryAlbums    = Gallery::count();

        return [
            'stats' => [
                [
                    'label' => 'Stories',
                    'value' => $totalStories,
                    'hint'  => "{$publishedStories} published · {$draftStories} draft",
                    'tone'  => 'blue',
                    'icon'  => 'book',
                ],
                [
                    'label' => 'Events',
                    'value' => $totalEvents,
                    'hint'  => 'Across the website',
                    'tone'  => 'violet',
                    'icon'  => 'calendar',
                ],
                [
                    'label' => 'Gallery albums',
                    'value' => $galleryAlbums,
                    'hint'  => 'Photo collections',
                    'tone'  => 'amber',
                    'icon'  => 'image',
                ],
            ],
            'recent_stories' => Story::with('category:id,name')
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn ($s) => [
                    'id'         => $s->id,
                    'title'      => $s->title,
                    'status'     => $s->status,
                    'featured'   => (bool) $s->featured,
                    'author'     => $s->author,
                    'category'   => $s->category?->name,
                    'created_at' => $s->created_at,
                ])->values(),
        ];
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    private function normaliseRole(string $role): string
    {
        $role = strtolower(trim($role));
        $role = preg_replace('/[\s\-\.]+/', '_', $role);
        return trim(preg_replace('/_+/', '_', $role), '_');
    }

    /** Compact money for stat cards — e.g. "45.0K", "1.2M". */
    private function formatMoneyShort(float $n): string
    {
        if ($n >= 1_000_000) return number_format($n / 1_000_000, 1) . 'M';
        if ($n >= 1_000)     return number_format($n / 1_000, 1) . 'K';
        return number_format($n, 0);
    }

    /** Shared submission shape across admin, headteacher, and teacher views. */
    private function formatSubmission(TermReportSubmission $s): array
    {
        return [
            'id'           => $s->id,
            'student'      => $s->student ? [
                'id'             => $s->student->id,
                'student_number' => $s->student->student_number,
                'full_name'      => trim("{$s->student->first_name} {$s->student->middle_name} {$s->student->surname}"),
                'photo_url'      => $s->student->photo_path
                    ? Storage::disk('public')->url($s->student->photo_path)
                    : null,
            ] : null,
            'class_stream' => $s->classStream?->name,
            'term'         => $s->term?->name,
            'status'       => $s->status,
            'submitted_at' => $s->submitted_at,
            'submitted_by' => $s->submittedBy?->name,
            'updated_at'   => $s->updated_at,
        ];
    }
}