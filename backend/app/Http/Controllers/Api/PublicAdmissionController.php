<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AdmissionCredentialsMail;
use App\Models\AcademicYear;
use App\Models\AdmissionApplication;
use App\Models\SchoolClass;
use App\Models\User;
use App\Notifications\AdmissionSubmittedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PublicAdmissionController extends Controller
{
    private const REQUIRED_DOCUMENT_TYPES = [
        'birth_certificate_or_passport',
        'passport_photograph_1',
        'passport_photograph_2',
    ];

    /*
    |--------------------------------------------------------------------------
    | START NEW APPLICATION
    |--------------------------------------------------------------------------
    */

    public function start(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'academic_year' => ['nullable', 'string', 'max:50'],
            'source' => ['nullable', 'in:online'],
        ]);

        $academicYear = null;

        if (!empty($validated['academic_year'])) {
            $academicYear = AcademicYear::where('name', $validated['academic_year'])->first();
        }
        if (!$academicYear) {
            $academicYear = AcademicYear::where('is_current', true)->first();
        }
        if (!$academicYear) {
            return response()->json([
                'success' => false,
                'message' => 'No active academic year is available.',
            ], 422);
        }

        $email = strtolower(trim($validated['email']));

        [$application, $accessToken] = DB::transaction(function () use (
            $academicYear,
            $validated,
            $email
        ) {
            $prefix = 'MVIPS-' . $academicYear->name . '-';

            $lastApplication = AdmissionApplication::where(
                'application_number',
                'like',
                $prefix . '%'
            )->orderByDesc('id')->first();

            $nextNumber = $lastApplication
                ? (int) Str::after($lastApplication->application_number, $prefix) + 1
                : 1;

            $applicationNumber = $prefix . str_pad(
                $nextNumber,
                5,
                '0',
                STR_PAD_LEFT
            );

            $accessToken = Str::random(64);

            $application = AdmissionApplication::create([
                'application_number' => $applicationNumber,
                'contact_email' => $email,
                'academic_year_id' => $academicYear->id,
                'tracking_token_hash' => hash('sha256', $accessToken),
                'status' => 'draft',
                'source' => $validated['source'] ?? 'online',
                'submitted' => false,
            ]);

            return [$application, $accessToken];
        });

        try {
            Mail::to($email)->send(new AdmissionCredentialsMail($application, $accessToken));
        } catch (\Throwable $e) {
            Log::error('Admission credentials email failed.', [
                'application_id' => $application->id,
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Your application has been created, but we could not send the confirmation email. Please copy and save the access details shown below.',
                'application_number' => $application->application_number,
                'access_token' => $accessToken,
                'email_sent' => false,
                'status' => $application->status,
                'academic_year' => $academicYear->name,
            ], 201);
        }

        return response()->json([
            'success' => true,
            'message' => 'Your application has been created. We have emailed your access details — please check your inbox.',
            'application_number' => $application->application_number,
            'access_token' => $accessToken,
            'email_sent' => true,
            'status' => $application->status,
            'academic_year' => $academicYear->name,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | RESEND CREDENTIALS
    |--------------------------------------------------------------------------
    */

    public function resendCredentials(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = strtolower(trim($validated['email']));

        $drafts = AdmissionApplication::where('contact_email', $email)
            ->where('status', 'draft')
            ->orderByDesc('id')
            ->get();

        foreach ($drafts as $application) {
            try {
                $plainToken = Str::random(64);
                $application->tracking_token_hash = hash('sha256', $plainToken);
                $application->save();

                Mail::to($email)->send(
                    new AdmissionCredentialsMail($application, $plainToken, true)
                );
            } catch (\Throwable $e) {
                Log::error('Admission resend failed.', [
                    'application_id' => $application->id,
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'If that email matches an application on file, we have emailed the access details.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW (track)
    |--------------------------------------------------------------------------
    */

    public function show(Request $request, string $applicationNumber)
    {
        $application = $this->findAuthorizedApplication($request, $applicationNumber);

        return response()->json([
            'success' => true,
            'data' => $this->formatApplication($application),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    public function save(Request $request, string $applicationNumber)
    {
        $application = $this->findAuthorizedApplication($request, $applicationNumber);

        if ($this->applicationLocked($application)) {
            return response()->json([
                'success' => false,
                'message' => 'This application can no longer be edited.',
            ], 422);
        }

        $student = $request->input('student', []);
        if (!is_array($student)) {
            throw ValidationException::withMessages([
                'student' => 'Student information must be an object.',
            ]);
        }

        $classValue = $student['class_applied_id']
            ?? $student['class_applied_for']
            ?? null;

        $classId = $this->resolveClassId($classValue);

        /* Previous school fields also come through as top-level keys */
        $previous = $request->input('previous_school', []);
        if (!is_array($previous)) $previous = [];

        DB::transaction(function () use (
            $application,
            $student,
            $classId,
            $previous,
            $request
        ) {
            $application->fill([
                'legal_first_name' => $student['legal_first_name'] ?? null,
                'middle_name' => $student['middle_name'] ?? null,
                'legal_surname' => $student['legal_surname'] ?? null,
                'date_of_birth' => $this->normalizeDate($student['date_of_birth'] ?? null),
                'gender' => $student['gender'] ?? null,
                'blood_group' => $student['blood_group'] ?? null,
                'class_applied_id' => $classId,
                'weight_kg' => $student['weight_kg'] ?? $student['weight'] ?? null,
                'height_cm' => $student['height_cm'] ?? $student['height'] ?? null,
                'first_language' => $student['first_language'] ?? null,
                'nationality' => $student['nationality'] ?? null,
                'religion' => $student['religion'] ?? null,
                'emergency_contact' => $student['emergency_contact'] ?? null,
                'family_member_count' =>
                    $student['family_member_count']
                    ?? $student['family_members_count']
                    ?? null,
                'student_lives_with' =>
                    $student['student_lives_with']
                    ?? $student['lives_with']
                    ?? null,
                'children_at_mount_view' =>
                    $student['children_at_mount_view']
                    ?? $student['existing_mount_view_children_count']
                    ?? null,
                'siblings_at_mount_view' =>
                    is_array($student['siblings_at_mount_view'] ?? null)
                        ? array_values(array_filter(
                            $student['siblings_at_mount_view'],
                            fn ($n) => trim((string) $n) !== ''
                        ))
                        : null,
                'email_with_mount_view' => $student['email_with_mount_view'] ?? null,
                'physical_address' => $student['physical_address'] ?? null,

                /* Medical */
                'medical_conditions' => $student['medical_conditions'] ?? null,
                'allergies' => $student['allergies'] ?? null,
                'learning_needs' => $student['learning_needs'] ?? null,
                'family_doctor_name' => $student['family_doctor_name'] ?? null,
                'family_doctor_phone' => $student['family_doctor_phone'] ?? null,

                /* Previous school — accept either nested or flat */
                'previous_school_name' =>
                    $previous['name']
                    ?? $student['previous_school_name']
                    ?? null,
                'previous_school_address' =>
                    $previous['address']
                    ?? $student['previous_school_address']
                    ?? null,
                'previous_class' =>
                    $previous['previous_class']
                    ?? $student['previous_class']
                    ?? null,
                'previous_year' =>
                    $previous['last_year']
                    ?? $student['previous_year']
                    ?? null,
                'reason_for_leaving' =>
                    $previous['reason_for_leaving']
                    ?? $student['reason_for_leaving']
                    ?? null,
                'previous_school_contact' =>
                    $previous['contact']
                    ?? $student['previous_school_contact']
                    ?? null,
                'previous_school_country' =>
                    $previous['country']
                    ?? $student['previous_school_country']
                    ?? null,
                'previous_school_language' =>
                    $previous['instructional_language']
                    ?? $student['previous_school_language']
                    ?? null,
            ]);

            $application->save();

            if ($request->has('parents')) {
                $parents = $request->input('parents');
                if (!is_array($parents)) {
                    throw ValidationException::withMessages([
                        'parents' => 'Parents must be an array.',
                    ]);
                }

                foreach ($parents as $index => $parent) {
                    if (!is_array($parent)) {
                        throw ValidationException::withMessages([
                            "parents.$index" => 'Parent information must be an object.',
                        ]);
                    }
                    if (empty($parent['full_name']) || empty($parent['relationship'])) {
                        throw ValidationException::withMessages([
                            "parents.$index.full_name" =>
                                'Parent/guardian full name is required.',
                            "parents.$index.relationship" =>
                                'Parent/guardian relationship is required.',
                        ]);
                    }
                }

                $application->parents()->delete();

                foreach ($parents as $parent) {
                    $employerPays = filter_var(
                        $parent['employer_pays_fees'] ?? false,
                        FILTER_VALIDATE_BOOLEAN
                    );

                    $application->parents()->create([
                        'full_name' => $parent['full_name'],
                        'relationship' => $parent['relationship'],
                        'phone_number' =>
                            $parent['phone']
                            ?? $parent['phone_number']
                            ?? null,
                        'email' => $parent['email'] ?? null,
                        'occupation' => $parent['occupation'] ?? null,
                        'position_title' => $parent['position_title'] ?? null,
                        'employer' => $parent['employer'] ?? null,
                        'work_address' => $parent['work_address'] ?? null,
                        'work_phone' => $parent['work_phone'] ?? null,
                        'employer_pays_fees' => $employerPays,
                        'employer_payment_percentage' => $employerPays &&
                            isset($parent['employer_payment_percentage']) &&
                            $parent['employer_payment_percentage'] !== ''
                                ? (int) $parent['employer_payment_percentage']
                                : null,
                        'physical_address' => $parent['physical_address'] ?? null,
                        'postal_address' => $parent['postal_address'] ?? null,
                        'emergency_contact' => filter_var(
                            $parent['emergency_contact'] ?? false,
                            FILTER_VALIDATE_BOOLEAN
                        ),
                        'preferred_communication' =>
                            $parent['preferred_communication'] ?? null,
                        'is_primary' => filter_var(
                            $parent['is_primary'] ?? false,
                            FILTER_VALIDATE_BOOLEAN
                        ),
                    ]);
                }
            }
        });

        $application->load(['academicYear', 'classApplied', 'parents', 'documents']);

        return response()->json([
            'success' => true,
            'message' => 'Application saved successfully.',
            'data' => $this->formatApplication($application),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPLOAD DOCUMENT
    |--------------------------------------------------------------------------
    */

    public function uploadDocument(Request $request, string $applicationNumber)
    {
        $application = $this->findAuthorizedApplication($request, $applicationNumber);

        if ($this->applicationLocked($application)) {
            return response()->json([
                'success' => false,
                'message' => 'This application can no longer be edited.',
            ], 422);
        }

        if (!$request->hasFile('document')) {
            return response()->json([
                'success' => false,
                'message' => 'No document file was received by the server.',
            ], 422);
        }

        $file = $request->file('document');
        if (!$file->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'The uploaded document is not valid.',
            ], 422);
        }

        $request->validate([
            'document_type' => ['required', 'string', 'max:100'],
        ]);

        $allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $allowedExtensions, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported document type.',
            ], 422);
        }

        $maxSize = 5 * 1024 * 1024;
        if ($file->getSize() > $maxSize) {
            return response()->json([
                'success' => false,
                'message' => 'The document is too large. Maximum size is 5 MB.',
            ], 422);
        }

        $directory = 'admissions/' . $application->application_number . '/documents';

        try {
            $path = $file->store($directory, 'local');
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'The document could not be stored.',
            ], 500);
        }

        try {
            $document = $application->documents()->create([
                'document_type' => $request->input('document_type'),
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'verification_status' => 'pending',
            ]);
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($path);
            return response()->json([
                'success' => false,
                'message' => 'The document record could not be saved.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully.',
            'data' => [
                'id' => $document->id,
                'document_type' => $document->document_type,
                'original_name' => $document->original_name,
                'mime_type' => $document->mime_type,
                'file_size' => $document->file_size,
                'verification_status' => $document->verification_status,
            ],
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | UPLOAD PHOTO
    |--------------------------------------------------------------------------
    */

    public function uploadPhoto(Request $request, string $applicationNumber)
    {
        $application = $this->findAuthorizedApplication($request, $applicationNumber);

        if ($this->applicationLocked($application)) {
            return response()->json([
                'success' => false,
                'message' => 'This application can no longer be edited.',
            ], 422);
        }

        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($application->student_photo_path) {
            Storage::disk('local')->delete($application->student_photo_path);
        }

        $directory = 'admissions/' . $application->application_number . '/photo';
        $path = $request->file('photo')->store($directory, 'local');

        $application->student_photo_path = $path;
        $application->save();

        return response()->json([
            'success' => true,
            'message' => 'Student photograph uploaded successfully.',
            'data' => ['has_photo' => true],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW PHOTO
    |--------------------------------------------------------------------------
    */

    public function showPhoto(Request $request, string $applicationNumber)
    {
        $application = $this->findAuthorizedApplication($request, $applicationNumber);

        if (!$application->student_photo_path) {
            return response()->json([
                'success' => false,
                'message' => 'No student photograph has been uploaded.',
            ], 404);
        }

        $disk = Storage::disk('local');
        if (!$disk->exists($application->student_photo_path)) {
            return response()->json([
                'success' => false,
                'message' => 'The student photograph could not be found.',
            ], 404);
        }

        return $disk->response($application->student_photo_path);
    }

    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    public function submit(Request $request, string $applicationNumber)
    {
        $application = $this->findAuthorizedApplication($request, $applicationNumber);

        if ($application->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft applications can be submitted.',
            ], 422);
        }

        $request->validate([
            'terms_accepted' => ['required', 'accepted'],
        ]);

        $requiredFields = [
            'legal_first_name' => 'First name',
            'legal_surname' => 'Surname',
            'date_of_birth' => 'Date of birth',
            'gender' => 'Gender',
            'class_applied_id' => 'Class applied for',
            'physical_address' => 'Physical address',
        ];

        foreach ($requiredFields as $field => $label) {
            if ($application->{$field} === null || $application->{$field} === '') {
                return response()->json([
                    'success' => false,
                    'message' => "{$label} is required before submission.",
                ], 422);
            }
        }

        if (!SchoolClass::where('id', $application->class_applied_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'The selected class could not be found.',
            ], 422);
        }

        if ($application->parents()->count() < 1) {
            return response()->json([
                'success' => false,
                'message' => 'At least one parent or guardian is required.',
            ], 422);
        }

        if (!$application->student_photo_path) {
            return response()->json([
                'success' => false,
                'message' => 'A student photograph is required.',
            ], 422);
        }

        if (!Storage::disk('local')->exists($application->student_photo_path)) {
            return response()->json([
                'success' => false,
                'message' => 'The student photograph could not be found.',
            ], 422);
        }

        $uploadedDocumentTypes = $application->documents()
            ->pluck('document_type')
            ->unique()->values()->toArray();

        $missingDocuments = array_values(array_diff(
            self::REQUIRED_DOCUMENT_TYPES,
            $uploadedDocumentTypes
        ));

        if (!empty($missingDocuments)) {
            $labels = array_map(fn ($t) => $this->documentLabel($t), $missingDocuments);
            return response()->json([
                'success' => false,
                'message' =>
                    'Some required documents are missing: ' . implode(', ', $labels) . '.',
                'missing_documents' => $missingDocuments,
                'missing_document_labels' => $labels,
            ], 422);
        }

        DB::transaction(function () use ($application) {
            $application->status = 'submitted';
            $application->submitted = true;
            $application->submitted_at = now();
            $application->save();
        });

        $recipients = User::query()
            ->where('is_active', true)
            ->whereIn('role', ['administrator', 'admissions_officer', 'principal'])
            ->get();

        foreach ($recipients as $recipient) {
            try {
                $recipient->notify(new AdmissionSubmittedNotification($application));
            } catch (\Throwable $e) {
                Log::error('Admission notification failed.', [
                    'user_id' => $recipient->id,
                    'application_id' => $application->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $application->load([
            'academicYear', 'classApplied', 'parents', 'documents',
            'assessments.results', 'assessments.assessor:id,name',
            'decisions.approvedClass', 'decisions.house', 'decisions.academicYear',
            'termsAcceptances.termsCondition', 'comments.user:id,name',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully.',
            'data' => $this->formatApplication($application),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    private function documentLabel(string $type): string
    {
        return match ($type) {
            'birth_certificate_or_passport' =>
                'Birth Certificate or Main Passport Pages',
            'passport_photograph_1' => 'Passport Photograph 1',
            'passport_photograph_2' => 'Passport Photograph 2',
            'school_report' => 'Original Mark Sheets / School Report',
            default => $type,
        };
    }

    private function resolveClassId($value): ?int
    {
        if ($value === null || $value === '') return null;

        if (
            is_int($value) ||
            (is_string($value) && ctype_digit(trim($value)))
        ) {
            $classId = (int) $value;
            if (!SchoolClass::where('id', $classId)->exists()) {
                throw ValidationException::withMessages([
                    'student.class_applied_id' => 'The selected class does not exist.',
                ]);
            }
            return $classId;
        }

        $className = trim((string) $value);
        if ($className === '') return null;

        $schoolClass = SchoolClass::where('name', $className)
            ->where('is_active', true)
            ->first();

        if (!$schoolClass) {
            $schoolClass = SchoolClass::whereRaw(
                'LOWER(name) = ?',
                [strtolower($className)]
            )->where('is_active', true)->first();
        }

        if (!$schoolClass) {
            $schoolClass = SchoolClass::where('code', $className)
                ->where('is_active', true)
                ->first();
        }

        if (!$schoolClass) {
            /* Auto-create if missing so the applicant is never blocked */
            $schoolClass = SchoolClass::create([
                'name' => $className,
                'is_active' => true,
                'sort_order' => 99,
            ]);
        }

        return (int) $schoolClass->id;
    }

    private function normalizeDate($date): ?string
    {
        if (!$date) return null;
        $date = trim((string) $date);
        return $date === '' ? null : substr($date, 0, 10);
    }

    private function findAuthorizedApplication(
        Request $request,
        string $applicationNumber
    ): AdmissionApplication {
        $token = $request->header('X-Admission-Token');

        if (!$token) abort(401, 'Admission access token is required.');

        $application = AdmissionApplication::with([
            'academicYear',
            'classApplied',
            'parents',
            'documents',
            'assessments.results',
            'assessments.assessor:id,name',
            'decisions.approvedClass',
            'decisions.house',
            'decisions.academicYear',
            'termsAcceptances.termsCondition',
            'comments.user:id,name',
        ])
            ->where('application_number', $applicationNumber)
            ->first();

        if (!$application) abort(404, 'Application not found.');

        if (!hash_equals(
            (string) $application->tracking_token_hash,
            hash('sha256', $token)
        )) {
            abort(403, 'Invalid admission access token.');
        }

        return $application;
    }

    private function applicationLocked(AdmissionApplication $application): bool
    {
        return in_array($application->status, [
            'submitted', 'document_verification', 'assessment_scheduled',
            'assessment_completed', 'principal_review', 'approved',
            'denied', 'waitlisted', 'enrolled', 'transferred', 'withdrawn',
        ], true);
    }

    private function formatApplication(AdmissionApplication $application): array
    {
        $class = null;
        if ($application->class_applied_id) {
            $class = SchoolClass::find($application->class_applied_id);
        }

        return [
            'id' => $application->id,
            'application_number' => $application->application_number,
            'contact_email' => $application->contact_email,
            'status' => $application->status,
            'submitted' => (bool) $application->submitted,
            'submitted_at' => $application->submitted_at,

            'academic_year' => $application->academicYear
                ? [
                    'id' => $application->academicYear->id,
                    'name' => $application->academicYear->name,
                ]
                : null,

            'student' => [
                'legal_first_name' => $application->legal_first_name,
                'middle_name' => $application->middle_name,
                'legal_surname' => $application->legal_surname,
                'date_of_birth' => $application->date_of_birth
                    ? substr((string) $application->date_of_birth, 0, 10)
                    : null,
                'gender' => $application->gender,
                'blood_group' => $application->blood_group,
                'class_applied_id' => $application->class_applied_id
                    ? (int) $application->class_applied_id : null,
                'class_applied_for' => $class?->name,
                'class' => $class
                    ? ['id' => $class->id, 'name' => $class->name, 'code' => $class->code]
                    : null,
                'weight_kg' => $application->weight_kg,
                'height_cm' => $application->height_cm,
                'first_language' => $application->first_language,
                'nationality' => $application->nationality,
                'religion' => $application->religion,
                'emergency_contact' => $application->emergency_contact,
                'family_member_count' => $application->family_member_count,
                'student_lives_with' => $application->student_lives_with,
                'children_at_mount_view' => $application->children_at_mount_view,
                'siblings_at_mount_view' =>
                    $application->siblings_at_mount_view ?? [],
                'email_with_mount_view' => $application->email_with_mount_view,
                'physical_address' => $application->physical_address,

                'medical_conditions' => $application->medical_conditions,
                'allergies' => $application->allergies,
                'learning_needs' => $application->learning_needs,
                'family_doctor_name' => $application->family_doctor_name,
                'family_doctor_phone' => $application->family_doctor_phone,

                'has_photo' => !empty($application->student_photo_path),
            ],

            'parents' => $application->parents->map(function ($parent) {
                return [
                    'id' => $parent->id,
                    'full_name' => $parent->full_name,
                    'relationship' => $parent->relationship,
                    'phone' => $parent->phone_number ?? $parent->phone ?? null,
                    'email' => $parent->email,
                    'occupation' => $parent->occupation,
                    'position_title' => $parent->position_title,
                    'employer' => $parent->employer,
                    'work_address' => $parent->work_address,
                    'work_phone' => $parent->work_phone,
                    'employer_pays_fees' => (bool) $parent->employer_pays_fees,
                    'employer_payment_percentage' =>
                        $parent->employer_payment_percentage,
                    'physical_address' => $parent->physical_address,
                    'postal_address' => $parent->postal_address,
                    'emergency_contact' => (bool) $parent->emergency_contact,
                    'preferred_communication' => $parent->preferred_communication,
                    'is_primary' => (bool) $parent->is_primary,
                ];
            })->values(),

            'previous_school' => [
                'name' => $application->previous_school_name,
                'address' => $application->previous_school_address,
                'previous_class' => $application->previous_class,
                'last_year' => $application->previous_year,
                'reason_for_leaving' => $application->reason_for_leaving,
                'contact' => $application->previous_school_contact,
                'country' => $application->previous_school_country,
                'instructional_language' => $application->previous_school_language,
            ],

            'documents' => $application->documents->map(function ($document) {
                return [
                    'id' => $document->id,
                    'document_type' => $document->document_type,
                    'original_filename' => $document->original_name,
                    'mime_type' => $document->mime_type,
                    'file_size' => $document->file_size,
                    'verification_status' => $document->verification_status,
                    'verified_at' => $document->verified_at,
                    'created_at' => $document->created_at,
                ];
            })->values(),

            'assessments' => $application->assessments->map(function ($assessment) {
                return [
                    'id' => $assessment->id,
                    'assessment_type' => $assessment->assessment_type,
                    'assessment_date' => $assessment->assessment_date,
                    'assessment_time' => $assessment->assessment_time,
                    'location' => $assessment->location,
                    'result' => $assessment->result,
                    'comments' => $assessment->comments,
                    'recommendation' => $assessment->recommendation,
                    'assessor' => $assessment->assessor
                        ? ['id' => $assessment->assessor->id, 'name' => $assessment->assessor->name]
                        : null,
                    'results' => $assessment->results->map(function ($result) {
                        return [
                            'id' => $result->id,
                            'area' => $result->area,
                            'score' => $result->score,
                            'maximum_score' => $result->maximum_score,
                            'comments' => $result->comments,
                        ];
                    })->values(),
                ];
            })->values(),

            'decisions' => $application->decisions->map(function ($decision) {
                return [
                    'id' => $decision->id,
                    'decision' => $decision->decision,
                    'decision_date' => $decision->decision_date,
                    'comments' => $decision->comments,
                    'principal_comments' => $decision->principal_comments,
                    'approved_class' => $decision->approvedClass
                        ? ['id' => $decision->approvedClass->id, 'name' => $decision->approvedClass->name]
                        : null,
                    'house' => $decision->house
                        ? ['id' => $decision->house->id, 'name' => $decision->house->name]
                        : null,
                    'academic_year' => $decision->academicYear
                        ? ['id' => $decision->academicYear->id, 'name' => $decision->academicYear->name]
                        : null,
                ];
            })->values(),

            'terms_acceptances' => $application->termsAcceptances->map(function ($acceptance) {
                return [
                    'id' => $acceptance->id,
                    'parent_guardian_name' => $acceptance->parent_guardian_name,
                    'accepted' => (bool) $acceptance->accepted,
                    'accepted_at' => $acceptance->accepted_at,
                ];
            })->values(),

            'comments' => $application->comments->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'role_snapshot' => $comment->role_snapshot,
                    'created_at' => $comment->created_at,
                    'author' => $comment->user
                        ? ['id' => $comment->user->id, 'name' => $comment->user->name]
                        : null,
                ];
            })->values(),

            'created_at' => $application->created_at,
            'updated_at' => $application->updated_at,
        ];
    }
}