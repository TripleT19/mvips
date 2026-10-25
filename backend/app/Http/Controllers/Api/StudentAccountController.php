<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassStream;
use App\Models\Student;
use App\Models\User;
use App\Notifications\ParentSetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class StudentAccountController extends Controller
{
    private const EMAIL_DOMAIN = 'mountviewmw.com';
    private const PARENT_ROLES = ['parent', 'guardian'];
    private const MANAGE_ROLES = ['admin', 'administrator', 'headteacher', 'principal'];

    /* ============================================================
     * SECTIONS
     * ============================================================ */

    public function sections(Request $request)
    {
        $this->guard($request);

        $yearId = $request->input('academic_year_id')
            ?: AcademicYear::where('is_current', true)->value('id');

        if (!$yearId) {
            return response()->json([
                'success' => false,
                'message' => 'No active academic year. Activate one first.',
            ], 422);
        }

        $sections = ClassStream::with(['schoolClass:id,name', 'stream:id,name,colour'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function (ClassStream $s) {
                $count = Student::where('status', 'active')
                    ->where(function ($q) use ($s) {
                        $q->where('current_class_stream_id', $s->id)
                          ->orWhere(function ($q2) use ($s) {
                              $q2->whereNull('current_class_stream_id')
                                 ->where('current_class_id', $s->school_class_id);
                          });
                    })->count();

                return [
                    'id'                => $s->id,
                    'name'              => $s->name,
                    'school_class_name' => $s->schoolClass?->name,
                    'stream_name'       => $s->stream?->name,
                    'stream_colour'     => $s->stream?->colour,
                    'student_count'     => $count,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data'    => $sections,
            'domain'  => self::EMAIL_DOMAIN,
        ]);
    }

    /* ============================================================
     * STUDENTS + current account status
     * ============================================================ */

    public function students(Request $request)
    {
        $this->guard($request);

        $validated = $request->validate([
            'class_stream_id' => ['required', 'integer', 'exists:class_streams,id'],
        ]);

        $classStream = ClassStream::findOrFail($validated['class_stream_id']);

        $students = Student::where('status', 'active')
            ->where(function ($q) use ($classStream) {
                $q->where('current_class_stream_id', $classStream->id)
                  ->orWhere(function ($q2) use ($classStream) {
                      $q2->whereNull('current_class_stream_id')
                         ->where('current_class_id', $classStream->school_class_id);
                  });
            })
            ->with(['guardians' => fn ($g) =>
                $g->select('users.id', 'users.name', 'users.email', 'users.is_active', 'users.role')
            ])
            ->orderBy('surname')
            ->orderBy('first_name')
            ->get();

        $rows = $students->map(function (Student $s) {
            $primary = $s->guardians->firstWhere('pivot.is_primary', true)
                ?: $s->guardians->first();

            return [
                'id'             => $s->id,
                'student_number' => $s->student_number,
                'full_name'      => trim("{$s->first_name} {$s->middle_name} {$s->surname}"),
                'first_name'     => $s->first_name,
                'surname'        => $s->surname,
                'photo_url'      => $s->photo_path
                    ? Storage::disk('public')->url($s->photo_path)
                    : null,
                'has_account'    => $s->guardians->isNotEmpty(),
                'primary_email'  => $primary?->email,
                'guardians'      => $s->guardians->map(fn ($g) => [
                    'id'           => $g->id,
                    'name'         => $g->name,
                    'email'        => $g->email,
                    'is_active'    => (bool) $g->is_active,
                    'relationship' => $g->pivot->relationship,
                    'is_primary'   => (bool) $g->pivot->is_primary,
                ])->values(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'class_stream' => [
                    'id'   => $classStream->id,
                    'name' => $classStream->name,
                ],
                'domain'   => self::EMAIL_DOMAIN,
                'students' => $rows,
            ],
        ]);
    }

    /* ============================================================
     * CREATE / LINK — single row
     * ============================================================ */

    public function store(Request $request)
    {
        $this->guard($request);

        $validated = $request->validate([
            'student_id'   => ['required', 'integer', 'exists:students,id'],
            'email_local'  => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9._-]+$/'],
            'relationship' => ['nullable', 'string', 'max:30'],
            'name'         => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $result = $this->attachAccount($validated);
        } catch (Throwable $e) {
            Log::warning('Student account creation failed', [
                'student_id'  => $validated['student_id'],
                'email_local' => $validated['email_local'],
                'error'       => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => config('app.debug')
                    ? $e->getMessage()
                    : 'Could not create the account.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data'    => $result['data'],
        ], 201);
    }

    /* ============================================================
     * BATCH (after preview confirmation)
     * ============================================================ */

    public function bulkStore(Request $request)
    {
        $this->guard($request);

        $validated = $request->validate([
            'rows'                 => ['required', 'array', 'min:1', 'max:500'],
            'rows.*.student_id'    => ['required', 'integer', 'exists:students,id'],
            'rows.*.email_local'   => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9._-]+$/'],
            'rows.*.relationship'  => ['nullable', 'string', 'max:30'],
            'rows.*.name'          => ['nullable', 'string', 'max:255'],
        ]);

        $results = [];
        $successful = 0;
        $failed = 0;

        foreach ($validated['rows'] as $i => $row) {
            $normalised = [
                'student_id'   => $row['student_id'],
                'email_local'  => $row['email_local'],
                'relationship' => $row['relationship'] ?? 'parent',
                'name'         => $row['name'] ?? null,
            ];

            try {
                $r = $this->attachAccount($normalised);
                $results[] = [
                    'row'        => $i + 1,
                    'student_id' => $row['student_id'],
                    'email'      => strtolower($row['email_local']) . '@' . self::EMAIL_DOMAIN,
                    'success'    => true,
                    'message'    => $r['message'],
                ];
                $successful++;
            } catch (Throwable $e) {
                $results[] = [
                    'row'        => $i + 1,
                    'student_id' => $row['student_id'],
                    'email'      => strtolower($row['email_local']) . '@' . self::EMAIL_DOMAIN,
                    'success'    => false,
                    'message'    => config('app.debug') ? $e->getMessage() : 'Failed.',
                ];
                $failed++;
            }
        }

        return response()->json([
            'success' => $successful > 0,
            'summary' => [
                'total'      => count($validated['rows']),
                'successful' => $successful,
                'failed'     => $failed,
            ],
            'results' => $results,
        ]);
    }

    /* ============================================================
     * PREVIEW — parse CSV and match to students
     * ============================================================ */

    public function preview(Request $request)
    {
        $this->guard($request);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:4096'],
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        if (!$handle) {
            return response()->json(['success' => false, 'message' => 'Could not read the file.'], 422);
        }

        $lines = [];
        $header = null;
        $rowNum = 0;

        while (($line = fgetcsv($handle)) !== false) {
            $rowNum++;
            $line = array_map(fn ($v) => trim((string) $v), $line);

            if ($rowNum === 1) {
                $lower = array_map('strtolower', $line);
                if (array_intersect($lower, ['student_number', 'email', 'email_local', 'name', 'relationship'])) {
                    $header = $lower;
                    continue;
                }
            }

            if (!empty(array_filter($line))) {
                $lines[] = $line;
            }
        }
        fclose($handle);

        $issues = [];
        $preview = [];

        foreach ($lines as $idx => $line) {
            [$studentNumber, $emailLocal, $relationship, $name] = $this->extractColumns($line, $header);

            $studentNumber = $studentNumber ? trim($studentNumber) : null;
            $emailLocal    = $emailLocal ? strtolower(preg_replace('/\s+/', '', $emailLocal)) : null;

            if ($emailLocal && str_contains($emailLocal, '@')) {
                $emailLocal = strstr($emailLocal, '@', true);
            }

            if (!$studentNumber || !$emailLocal) {
                $issues[] = 'Row ' . ($idx + 1) . ': missing student number or email.';
                continue;
            }

            if (!preg_match('/^[a-z0-9._-]+$/', $emailLocal)) {
                $issues[] = 'Row ' . ($idx + 1) . ": \"{$emailLocal}\" contains invalid characters.";
                continue;
            }

            $student = Student::where('student_number', $studentNumber)->first();
            if (!$student) {
                $issues[] = 'Row ' . ($idx + 1) . ": no student found with number {$studentNumber}.";
                continue;
            }

            $preview[] = [
                'student_id'     => $student->id,
                'student_number' => $student->student_number,
                'student_name'   => trim("{$student->first_name} {$student->middle_name} {$student->surname}"),
                'email_local'    => $emailLocal,
                'email'          => $emailLocal . '@' . self::EMAIL_DOMAIN,
                'relationship'   => $relationship ?: 'parent',
                'name'           => $name ?: null,
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'matched'   => count($preview),
                'unmatched' => count($issues),
                'issues'    => $issues,
                'preview'   => $preview,
            ],
        ]);
    }

    /* ============================================================
     * RESEND ACTIVATION
     * ============================================================ */

    public function resendActivation(Request $request, User $user)
    {
        $this->guard($request);

        $role = strtolower((string) $user->role);
        if (!in_array($role, self::PARENT_ROLES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'This endpoint only resends activation emails for parent accounts.',
            ], 422);
        }

        if ($user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This account is already active. Use "Forgot password" on the parent login page instead.',
            ], 422);
        }

        try {
            $this->sendActivationEmail($user);

            return response()->json([
                'success' => true,
                'message' => 'Activation email resent to ' . $user->email . '.',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug')
                    ? $e->getMessage()
                    : 'Could not send the activation email. Check the mail configuration.',
            ], 422);
        }
    }

    /* ============================================================
     * UNLINK a guardian from a student
     * ============================================================ */

    public function unlink(Request $request, Student $student, User $user)
    {
        $this->guard($request);

        $user->students()->detach($student->id);

        return response()->json([
            'success' => true,
            'message' => 'Guardian access removed.',
        ]);
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    private function attachAccount(array $row): array
    {
        $student = Student::findOrFail($row['student_id'] ?? 0);

        $emailLocal = strtolower(
            preg_replace('/[^a-z0-9._-]/', '', (string) ($row['email_local'] ?? ''))
        );

        if ($emailLocal === '') {
            throw new \RuntimeException('Email local part is empty after sanitisation.');
        }

        $email = $emailLocal . '@' . self::EMAIL_DOMAIN;

        /* ---------- Already linked? ---------- */
        $existing = User::where('email', $email)->first();

        if ($existing && $existing->students()->where('student_id', $student->id)->exists()) {
            return [
                'message' => "{$student->first_name} is already linked to {$email}.",
                'data'    => [
                    'user_id'    => $existing->id,
                    'email'      => $email,
                    'student_id' => $student->id,
                ],
            ];
        }

        /* ---------- Existing account with a conflicting role? ---------- */
        if ($existing) {
            $role = strtolower((string) $existing->role);
            if (!in_array($role, self::PARENT_ROLES, true)) {
                throw new \RuntimeException(
                    "This email is already used by a {$existing->role} account. Please use a different email for this student."
                );
            }
        }

        $createdNew = false;

        /* ---------- Create the account if needed ---------- */
        if (!$existing) {
            $name = $row['name'] ?? null;
            $defaultName = !empty($name)
                ? trim((string) $name)
                : trim("{$student->surname} Family");

            $existing = User::create([
                'name'      => $defaultName,
                'email'     => $email,
                'role'      => 'parent',
                'password'  => Hash::make(Str::random(64)),
                'is_active' => false,
            ]);
            $createdNew = true;
        }

        /* ---------- Attach to the student ---------- */
        $isPrimary = !$existing->students()->exists();

        $existing->students()->syncWithoutDetaching([
            $student->id => [
                'relationship' => $row['relationship'] ?? 'parent',
                'is_primary'   => $isPrimary,
            ],
        ]);

        /*
         * Send an activation email when:
         *  - the account was just created, OR
         *  - the account already existed but was never activated
         *    (e.g. the original invite failed or was lost).
         *
         * Skip when the account is already active and we're only
         * linking another child — siblings don't need a new invite.
         */
        $wasActivated   = (bool) $existing->is_active;
        $sendActivation = $createdNew || !$wasActivated;

        if ($sendActivation) {
            $this->sendActivationEmail($existing);
        }

        /* ---------- Message reflects what actually happened ---------- */
        if ($createdNew) {
            $message = "Account created for {$email}. Activation email sent.";
        } elseif (!$wasActivated) {
            $message = "Linked {$student->first_name} to {$email}. Activation email re-sent (the account had not been activated yet).";
        } else {
            $message = "Linked {$student->first_name} to existing account {$email}.";
        }

        return [
            'message' => $message,
            'data' => [
                'user_id'    => $existing->id,
                'email'      => $email,
                'student_id' => $student->id,
            ],
        ];
    }

    /**
     * Send the activation email — loudly.
     *
     * - Success: logs an info line with resolved mailer settings.
     * - Failure: logs the full trace; re-throws when APP_DEBUG=true so
     *   the admin clicking "Save" sees the exact reason.
     */
    private function sendActivationEmail(User $user): void
    {
        $token = Password::broker()->createToken($user);

        $notification = new ParentSetPasswordNotification(
            $token,
            ParentSetPasswordNotification::TYPE_ACTIVATION
        );

        $context = [
            'user_id' => $user->id,
            'email'   => $user->email,
            'mailer'  => config('mail.default'),
            'host'    => config('mail.mailers.smtp.host'),
            'port'    => config('mail.mailers.smtp.port'),
            'from'    => config('mail.from.address'),
        ];

        try {
            $user->notify($notification);
            Log::info('Parent activation email dispatched', $context);
        } catch (Throwable $e) {
            Log::error('Parent activation email FAILED', array_merge($context, [
                'error' => $e->getMessage(),
                'class' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]));

            if (config('app.debug')) {
                throw new \RuntimeException(
                    'Activation email failed: ' . $e->getMessage()
                    . ' [mailer=' . $context['mailer']
                    . ', host=' . ($context['host'] ?? 'n/a')
                    . ', port=' . ($context['port'] ?? 'n/a')
                    . ', from=' . ($context['from'] ?? 'n/a') . ']',
                    0,
                    $e
                );
            }
        }
    }

    private function extractColumns(array $line, ?array $header): array
    {
        if ($header) {
            $map = array_flip($header);

            $studentNumber = $line[$map['student_number'] ?? -1] ?? null;
            $emailLocal    = $line[$map['email_local']    ?? $map['email'] ?? -1] ?? null;
            $relationship  = $line[$map['relationship']   ?? -1] ?? null;
            $name          = $line[$map['name']           ?? -1] ?? null;

            return [$studentNumber, $emailLocal, $relationship, $name];
        }

        return [
            $line[0] ?? null,
            $line[1] ?? null,
            $line[2] ?? null,
            $line[3] ?? null,
        ];
    }

    private function guard(Request $request): void
    {
        $role = strtolower(trim((string) ($request->user()->role ?? '')));
        abort_unless(
            in_array($role, self::MANAGE_ROLES, true),
            403,
            'Only administrators, headteachers and principals can manage student accounts.'
        );
    }
}