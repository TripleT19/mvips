<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssessmentObjectiveResult;
use App\Models\ClassStream;
use App\Models\FeeInvoice;
use App\Models\Student;
use App\Models\TeacherAssignment;
use App\Models\TermReportSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TermReportPublishController extends Controller
{
    private const PUBLISHER_ROLES = [
        'admin', 'administrator', 'super_admin', 'superadmin',
        'headteacher', 'head_teacher', 'principal',
    ];

    private const VIEWER_ROLES = [
        'admin', 'administrator', 'super_admin', 'superadmin',
        'headteacher', 'head_teacher', 'principal',
        'admissions_officer', 'bursar', 'finance', 'accountant',
    ];

    /* ============================================================
     * STATS — read-only counters for the Results page header
     * ============================================================ */

    public function stats(Request $request)
    {
        $this->authorizeViewer($request);

        $validated = $request->validate([
            'term_id'          => ['nullable', 'integer', 'exists:academic_terms,id'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'class_stream_id'  => ['nullable', 'integer', 'exists:class_streams,id'],
        ]);

        $base = TermReportSubmission::query()
            ->when(!empty($validated['term_id']),
                fn ($q) => $q->where('term_id', $validated['term_id']))
            ->when(!empty($validated['academic_year_id']),
                fn ($q) => $q->where('academic_year_id', $validated['academic_year_id']))
            ->when(!empty($validated['class_stream_id']),
                fn ($q) => $q->where('class_stream_id', $validated['class_stream_id']));

        $submittedCount = (clone $base)
            ->where('status', TermReportSubmission::STATUS_SUBMITTED)
            ->count();

        $publishedRows = (clone $base)
            ->where('status', TermReportSubmission::STATUS_PUBLISHED)
            ->get(['id', 'student_id', 'term_id', 'academic_year_id']);

        $heldCount = (clone $base)
            ->where('status', TermReportSubmission::STATUS_HELD)
            ->count();

        $draftCount = (clone $base)
            ->where('status', TermReportSubmission::STATUS_DRAFT)
            ->count();

        // "Will be blocked" = published reports whose fee balance is still
        // outstanding, i.e. parents currently cannot view them.
        $blocked = 0;
        foreach ($publishedRows as $row) {
            try {
                if ($this->feeBalance($row->student_id, $row->term_id, $row->academic_year_id) > 0.001) {
                    $blocked++;
                }
            } catch (\Throwable $e) {
                Log::warning('Stats fee check failed', [
                    'submission_id' => $row->id,
                    'error'         => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'submitted'       => $submittedCount,
                'published'       => $publishedRows->count(),
                'held'            => $heldCount,
                'draft'           => $draftCount,
                'will_be_blocked' => $blocked,
            ],
        ]);
    }

    /* ============================================================
     * CLASS TEACHER: SUBMIT
     * ============================================================ */

    public function submit(Request $request, Student $student)
    {
        $validated = $request->validate([
            'term_id'          => ['required', 'integer', 'exists:academic_terms,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'class_stream_id'  => ['nullable', 'integer', 'exists:class_streams,id'],
        ]);

        $classStream = $this->resolveStudentSection($student, $validated['class_stream_id'] ?? null);
        abort_unless($classStream, 422, 'Student is not attached to any class or section.');

        $this->authorizeClassTeacher($request->user(), $classStream, $validated['academic_year_id']);

        $existing = TermReportSubmission::where([
            'student_id'       => $student->id,
            'term_id'          => $validated['term_id'],
            'academic_year_id' => $validated['academic_year_id'],
        ])->first();

        if ($existing && $existing->isLocked()) {
            return response()->json([
                'success' => false,
                'message' => match ($existing->status) {
                    TermReportSubmission::STATUS_PUBLISHED => 'Report is already published.',
                    TermReportSubmission::STATUS_HELD      => 'Report is on hold.',
                    default                                 => 'Report has already been submitted.',
                },
            ], 422);
        }

        $hasGrades = AssessmentObjectiveResult::where('student_id', $student->id)
            ->where('term_id', $validated['term_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->whereNotNull('rating')
            ->where('rating', '!=', 'unclassified')
            ->exists();

        if (!$hasGrades) {
            return response()->json([
                'success' => false,
                'message' => 'Enter at least one grade before submitting for publishing.',
            ], 422);
        }

        $submission = TermReportSubmission::updateOrCreate(
            [
                'student_id'       => $student->id,
                'term_id'          => $validated['term_id'],
                'academic_year_id' => $validated['academic_year_id'],
            ],
            [
                'class_stream_id'         => $classStream->id,
                'status'                  => TermReportSubmission::STATUS_SUBMITTED,
                'submitted_at'            => now(),
                'submitted_by'            => $request->user()->id,
                'published_at'            => null,
                'published_by'            => null,
                'hold_reason'             => null,
                'fees_balance_at_publish' => null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Submitted for publishing. The sheet is now locked.',
            'data'    => $submission->load(['submittedBy:id,name', 'publishedBy:id,name']),
        ]);
    }

    public function unsubmit(Request $request, Student $student)
    {
        $validated = $request->validate([
            'term_id'          => ['required', 'integer', 'exists:academic_terms,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
        ]);

        $submission = TermReportSubmission::where([
            'student_id'       => $student->id,
            'term_id'          => $validated['term_id'],
            'academic_year_id' => $validated['academic_year_id'],
        ])->first();

        if (!$submission || $submission->status !== TermReportSubmission::STATUS_SUBMITTED) {
            return response()->json([
                'success' => false,
                'message' => 'Only reports that are submitted (not yet published) can be recalled.',
            ], 422);
        }

        $classStream = $submission->classStream;
        abort_unless($classStream, 422, 'Class section not found.');

        $this->authorizeClassTeacher($request->user(), $classStream, $validated['academic_year_id']);

        $submission->update([
            'status'       => TermReportSubmission::STATUS_DRAFT,
            'submitted_at' => null,
            'submitted_by' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Submission recalled. Fields are editable again.',
        ]);
    }

    /* ============================================================
     * ADMIN: PUBLISH — always succeeds, records fee balance
     * ============================================================ */

    public function publish(Request $request, Student $student)
    {
        $this->authorizePublisher($request);

        $validated = $request->validate([
            'term_id'          => ['required', 'integer', 'exists:academic_terms,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
        ]);

        $submission = TermReportSubmission::where([
            'student_id'       => $student->id,
            'term_id'          => $validated['term_id'],
            'academic_year_id' => $validated['academic_year_id'],
        ])->first();

        if (!$submission || !in_array($submission->status, [
            TermReportSubmission::STATUS_SUBMITTED,
            TermReportSubmission::STATUS_HELD,
        ], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Report is not ready to publish. It must be submitted by a class teacher first.',
            ], 422);
        }

        $balance = $this->feeBalance(
            $student->id,
            $validated['term_id'],
            $validated['academic_year_id']
        );
        $parentBlocked = $balance > 0.001;

        $submission->update([
            'status'                  => TermReportSubmission::STATUS_PUBLISHED,
            'published_at'            => now(),
            'published_by'            => $request->user()->id,
            'hold_reason'             => $parentBlocked
                ? 'Fees balance of MWK ' . number_format($balance, 2) . ' outstanding. Parent view blocked until settled.'
                : null,
            'fees_balance_at_publish' => $balance,
        ]);

        return response()->json([
            'success' => true,
            'message' => $parentBlocked
                ? sprintf(
                    'Results published. Parent view temporarily blocked until the MWK %s balance is settled.',
                    number_format($balance, 2)
                )
                : 'Results published.',
            'data' => $submission->fresh()->load(['publishedBy:id,name']),
            'parent_blocked' => $parentBlocked,
            'fees_balance'   => $balance,
        ]);
    }

    /* ============================================================
     * ADMIN: BULK PUBLISH — same policy
     * ============================================================ */

    public function bulkPublish(Request $request)
    {
        $this->authorizePublisher($request);

        $validated = $request->validate([
            'term_id'          => ['required', 'integer', 'exists:academic_terms,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'class_stream_id'  => ['nullable', 'integer', 'exists:class_streams,id'],
            'student_ids'      => ['nullable', 'array'],
            'student_ids.*'    => ['integer', 'exists:students,id'],
        ]);

        $query = TermReportSubmission::where('term_id', $validated['term_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->whereIn('status', [
                TermReportSubmission::STATUS_SUBMITTED,
                TermReportSubmission::STATUS_HELD,
            ]);

        if (!empty($validated['class_stream_id'])) {
            $query->where('class_stream_id', $validated['class_stream_id']);
        }
        if (!empty($validated['student_ids'])) {
            $query->whereIn('student_id', $validated['student_ids']);
        }

        $submissions = $query->get();

        $published = 0;
        $blocked   = 0;
        $blockedDetails = [];

        DB::transaction(function () use (
            $submissions, $validated, $request, &$published, &$blocked, &$blockedDetails
        ) {
            foreach ($submissions as $sub) {
                $balance = 0.0;
                try {
                    $balance = $this->feeBalance(
                        $sub->student_id,
                        $validated['term_id'],
                        $validated['academic_year_id']
                    );
                } catch (\Throwable $e) {
                    Log::warning('Bulk publish fee check failed', [
                        'submission_id' => $sub->id,
                        'error'         => $e->getMessage(),
                    ]);
                }
                $isBlocked = $balance > 0.001;

                $sub->update([
                    'status'                  => TermReportSubmission::STATUS_PUBLISHED,
                    'published_at'            => now(),
                    'published_by'            => $request->user()->id,
                    'hold_reason'             => $isBlocked
                        ? 'Fees balance of MWK ' . number_format($balance, 2) . ' outstanding.'
                        : null,
                    'fees_balance_at_publish' => $balance,
                ]);
                $published++;

                if ($isBlocked) {
                    $blocked++;
                    $blockedDetails[] = [
                        'student_id' => $sub->student_id,
                        'balance'    => $balance,
                    ];
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => $blocked === 0
                ? "{$published} report(s) published."
                : "{$published} report(s) published. {$blocked} blocked for parent view due to outstanding fees.",
            'data' => [
                'published'      => $published,
                'blocked'        => $blocked,
                'blocked_detail' => $blockedDetails,
            ],
        ]);
    }

    /* ============================================================
     * ADMIN: LIST SUBMISSIONS
     * ============================================================ */

    public function list(Request $request)
    {
        $this->authorizeViewer($request);

        $query = TermReportSubmission::with([
            'student:id,student_number,first_name,middle_name,surname,photo_path',
            'classStream:id,name',
            'term:id,name',
            'submittedBy:id,name',
            'publishedBy:id,name',
        ]);

        if ($request->filled('term_id'))          $query->where('term_id', $request->input('term_id'));
        if ($request->filled('academic_year_id')) $query->where('academic_year_id', $request->input('academic_year_id'));
        if ($request->filled('class_stream_id'))  $query->where('class_stream_id', $request->input('class_stream_id'));
        if ($request->filled('status'))           $query->where('status', $request->input('status'));

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->whereHas('student', function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                  ->orWhere('surname', 'like', "%{$s}%")
                  ->orWhere('student_number', 'like', "%{$s}%");
            });
        }

        $rows = $query->orderByDesc('submitted_at')->orderByDesc('id')->get()
            ->map(function (TermReportSubmission $sub) {
                $student = $sub->student;

                $balance = 0.0;
                try {
                    $balance = $this->feeBalance(
                        $sub->student_id,
                        $sub->term_id,
                        $sub->academic_year_id
                    );
                } catch (\Throwable $e) {
                    Log::warning('List fee calc failed', [
                        'submission_id' => $sub->id,
                        'error'         => $e->getMessage(),
                    ]);
                }

                $photoUrl = null;
                if ($student?->photo_path) {
                    try {
                        $photoUrl = Storage::disk('public')->url($student->photo_path);
                    } catch (\Throwable $e) {
                        $photoUrl = null;
                    }
                }

                return [
                    'id'             => $sub->id,
                    'student'        => $student ? [
                        'id'             => $student->id,
                        'student_number' => $student->student_number,
                        'full_name'      => trim("{$student->first_name} {$student->middle_name} {$student->surname}"),
                        'photo_url'      => $photoUrl,
                    ] : null,
                    'class_stream'    => $sub->classStream?->name,
                    'class_stream_id' => $sub->class_stream_id,
                    'term'            => $sub->term?->name,
                    'status'          => $sub->status,
                    'submitted_at'    => $sub->submitted_at,
                    'submitted_by'    => $sub->submittedBy?->name,
                    'published_at'    => $sub->published_at,
                    'published_by'    => $sub->publishedBy?->name,
                    'hold_reason'     => $sub->hold_reason,
                    'fees_balance'    => $balance,
                ];
            });

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    private function authorizeViewer(Request $request): void
    {
        $user = $request->user();
        abort_unless($user, 401, 'Authentication required.');

        $role = $this->normaliseRole((string) ($user->role ?? ''));
        abort_unless(
            in_array($role, self::VIEWER_ROLES, true),
            403,
            'You do not have access to the results dashboard.'
        );
    }

    private function authorizePublisher(Request $request): void
    {
        $user = $request->user();
        abort_unless($user, 401, 'Authentication required.');

        $role = $this->normaliseRole((string) ($user->role ?? ''));
        abort_unless(
            in_array($role, self::PUBLISHER_ROLES, true),
            403,
            'Only admins, headteachers and principals can publish results.'
        );
    }

    private function normaliseRole(string $role): string
    {
        $role = strtolower(trim($role));
        $role = preg_replace('/[\s\-\.]+/', '_', $role);
        return trim(preg_replace('/_+/', '_', $role), '_');
    }

    private function feeBalance(int $studentId, int $termId, int $yearId): float
    {
        return (float) FeeInvoice::where('student_id', $studentId)
            ->where('term_id', $termId)
            ->where('academic_year_id', $yearId)
            ->get()
            ->sum(fn ($inv) => max(0, (float) $inv->total_amount - (float) $inv->amount_paid));
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

    private function authorizeClassTeacher($user, ClassStream $classStream, int $academicYearId): void
    {
        abort_unless($user, 401, 'Authentication required.');

        $hasAssignment = TeacherAssignment::where('user_id', $user->id)
            ->where('class_stream_id', $classStream->id)
            ->where('academic_year_id', $academicYearId)
            ->where('role', TeacherAssignment::ROLE_CLASS_TEACHER)
            ->where('is_active', true)
            ->exists();

        abort_unless(
            $hasAssignment,
            403,
            'Only the class teacher assigned to this section can submit results for publishing.'
        );
    }
}