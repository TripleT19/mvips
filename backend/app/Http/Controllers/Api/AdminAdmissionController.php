<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\AdmissionComment;
use App\Models\AdmissionDecision;
use App\Models\ApplicationDocument;
use App\Models\Assessment;
use App\Models\AuditLog;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentClassHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;

class AdminAdmissionController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LIST APPLICATIONS
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $query = AdmissionApplication::query()
            ->with(['academicYear:id,name', 'classApplied:id,name'])
            ->withCount(['documents', 'assessments']);

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('application_number', 'like', "%{$search}%")
                    ->orWhere('legal_first_name', 'like', "%{$search}%")
                    ->orWhere('legal_surname', 'like', "%{$search}%")
                    ->orWhereHas('parents', function ($p) use ($search) {
                        $p->where('full_name', 'like', "%{$search}%")
                            ->orWhere('phone_number', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        } else {
            $query->whereNotIn('status', ['draft']);
        }

        if ($request->filled('physical_file_status')) {
            $query->where('physical_file_status', $request->query('physical_file_status'));
        }
        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->query('academic_year_id'));
        }
        if ($request->filled('class_applied_id')) {
            $query->where('class_applied_id', $request->query('class_applied_id'));
        }
        if ($request->filled('source')) {
            $query->where('source', $request->query('source'));
        }

        $perPage = min((int) $request->query('per_page', 25), 100);

        return response()->json([
            'success' => true,
            'data' => $query->latest()->paginate($perPage),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show(AdmissionApplication $application)
    {
        $application->load([
            'academicYear', 'classApplied', 'parents',
            'documents.verifiedBy:id,name',
            'assessments.results', 'assessments.assessor:id,name',
            'decisions.decidedBy:id,name',
            'decisions.approvedClass:id,name',
            'decisions.house:id,name,colour',
            'decisions.academicYear:id,name',
            'termsAcceptances.termsCondition',
            'comments.user:id,name',
            'student.currentClass', 'student.house', 'student.academicYear',
        ]);

        $this->audit('view_application', $application);

        return response()->json([
            'success' => true,
            'data' => $application,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | FORM OPTIONS
    |--------------------------------------------------------------------------
    */

    public function formOptions()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'classes' => SchoolClass::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get(['id', 'name', 'code']),

                'academic_years' => \App\Models\AcademicYear::query()
                    ->orderByDesc('name')
                    ->get(['id', 'name', 'is_current']),

                'houses' => \App\Models\House::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'name', 'colour']),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STORE (admin create)
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $validated = $this->validateApplicationPayload($request);

        $academicYear = null;
        if (!empty($validated['academic_year_id'])) {
            $academicYear = \App\Models\AcademicYear::find($validated['academic_year_id']);
        }
        if (!$academicYear) {
            $academicYear = \App\Models\AcademicYear::where('is_current', true)->first();
        }
        if (!$academicYear) {
            return response()->json([
                'success' => false,
                'message' => 'No active academic year is available.',
            ], 422);
        }

        $status = $validated['status'] ?? 'draft';

        $application = DB::transaction(function () use (
            $validated, $academicYear, $status, $request
        ) {
            $prefix = 'MVIPS-' . $academicYear->name . '-';
            $lastApplication = AdmissionApplication::where(
                'application_number', 'like', $prefix . '%'
            )->orderByDesc('id')->first();

            $nextNumber = $lastApplication
                ? (int) Str::after($lastApplication->application_number, $prefix) + 1
                : 1;

            $applicationNumber = $prefix . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
            $accessToken = Str::random(64);

            $application = AdmissionApplication::create([
                'application_number' => $applicationNumber,
                'tracking_token_hash' => hash('sha256', $accessToken),
                'contact_email' => $validated['contact_email'] ?? null,
                'academic_year_id' => $academicYear->id,
                'class_applied_id' => $this->resolveClassId($validated) ?? null,
                'legal_first_name' => $validated['student']['legal_first_name'] ?? null,
                'middle_name' => $validated['student']['middle_name'] ?? null,
                'legal_surname' => $validated['student']['legal_surname'] ?? null,
                'date_of_birth' => $this->normalizeDate($validated['student']['date_of_birth'] ?? null),
                'gender' => $validated['student']['gender'] ?? null,
                'blood_group' => $validated['student']['blood_group'] ?? null,
                'weight_kg' => $validated['student']['weight_kg'] ?? null,
                'height_cm' => $validated['student']['height_cm'] ?? null,
                'first_language' => $validated['student']['first_language'] ?? null,
                'nationality' => $validated['student']['nationality'] ?? null,
                'religion' => $validated['student']['religion'] ?? null,
                'emergency_contact' => $validated['student']['emergency_contact'] ?? null,
                'family_member_count' => $validated['student']['family_member_count'] ?? null,
                'student_lives_with' => $validated['student']['student_lives_with'] ?? null,
                'children_at_mount_view' => $validated['student']['children_at_mount_view'] ?? null,
                'siblings_at_mount_view' => $validated['student']['siblings_at_mount_view'] ?? null,
                'email_with_mount_view' => $validated['student']['email_with_mount_view'] ?? null,
                'physical_address' => $validated['student']['physical_address'] ?? null,
                'medical_conditions' => $validated['student']['medical_conditions'] ?? null,
                'allergies' => $validated['student']['allergies'] ?? null,
                'learning_needs' => $validated['student']['learning_needs'] ?? null,
                'family_doctor_name' => $validated['student']['family_doctor_name'] ?? null,
                'family_doctor_phone' => $validated['student']['family_doctor_phone'] ?? null,
                'previous_school_name' => $validated['student']['previous_school_name'] ?? null,
                'previous_school_address' => $validated['student']['previous_school_address'] ?? null,
                'previous_class' => $validated['student']['previous_class'] ?? null,
                'previous_year' => $validated['student']['previous_year'] ?? null,
                'reason_for_leaving' => $validated['student']['reason_for_leaving'] ?? null,
                'previous_school_contact' => $validated['student']['previous_school_contact'] ?? null,
                'previous_school_country' => $validated['student']['previous_school_country'] ?? null,
                'previous_school_language' => $validated['student']['previous_school_language'] ?? null,
                'status' => $status,
                'source' => $validated['source'] ?? 'paper',
                'submitted' => $status !== 'draft',
                'submitted_at' => $status !== 'draft' ? now() : null,
            ]);

            $this->syncParents($application, $validated['parents'] ?? []);
            return $application;
        });

        $this->audit('application_created_by_admin', $application, [
            'created_by' => $request->user()?->id,
        ]);

        $application->load(['academicYear', 'classApplied', 'parents', 'documents']);

        return response()->json([
            'success' => true,
            'message' => 'Application created successfully.',
            'data' => $application,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, AdmissionApplication $application)
    {
        $validated = $this->validateApplicationPayload($request);

        DB::transaction(function () use ($application, $validated) {
            if (!empty($validated['academic_year_id'])) {
                $application->academic_year_id = $validated['academic_year_id'];
            }
            $resolvedClass = $this->resolveClassId($validated);
            if ($resolvedClass !== null) {
                $application->class_applied_id = $resolvedClass;
            }
            if (array_key_exists('contact_email', $validated)) {
                $application->contact_email = $validated['contact_email'];
            }

            $student = $validated['student'] ?? [];

            $application->fill([
                'legal_first_name' => $student['legal_first_name'] ?? null,
                'middle_name' => $student['middle_name'] ?? null,
                'legal_surname' => $student['legal_surname'] ?? null,
                'date_of_birth' => $this->normalizeDate($student['date_of_birth'] ?? null),
                'gender' => $student['gender'] ?? null,
                'blood_group' => $student['blood_group'] ?? null,
                'weight_kg' => $student['weight_kg'] ?? null,
                'height_cm' => $student['height_cm'] ?? null,
                'first_language' => $student['first_language'] ?? null,
                'nationality' => $student['nationality'] ?? null,
                'religion' => $student['religion'] ?? null,
                'emergency_contact' => $student['emergency_contact'] ?? null,
                'family_member_count' => $student['family_member_count'] ?? null,
                'student_lives_with' => $student['student_lives_with'] ?? null,
                'children_at_mount_view' => $student['children_at_mount_view'] ?? null,
                'siblings_at_mount_view' => $student['siblings_at_mount_view'] ?? null,
                'email_with_mount_view' => $student['email_with_mount_view'] ?? null,
                'physical_address' => $student['physical_address'] ?? null,
                'medical_conditions' => $student['medical_conditions'] ?? null,
                'allergies' => $student['allergies'] ?? null,
                'learning_needs' => $student['learning_needs'] ?? null,
                'family_doctor_name' => $student['family_doctor_name'] ?? null,
                'family_doctor_phone' => $student['family_doctor_phone'] ?? null,
                'previous_school_name' => $student['previous_school_name'] ?? null,
                'previous_school_address' => $student['previous_school_address'] ?? null,
                'previous_class' => $student['previous_class'] ?? null,
                'previous_year' => $student['previous_year'] ?? null,
                'reason_for_leaving' => $student['reason_for_leaving'] ?? null,
                'previous_school_contact' => $student['previous_school_contact'] ?? null,
                'previous_school_country' => $student['previous_school_country'] ?? null,
                'previous_school_language' => $student['previous_school_language'] ?? null,
            ]);

            if (array_key_exists('source', $validated)) {
                $application->source = $validated['source'];
            }

            if (!empty($validated['status'])) {
                $newStatus = $validated['status'];
                if (
                    !$application->submitted &&
                    $application->status === 'draft' &&
                    $newStatus !== 'draft'
                ) {
                    $application->submitted = true;
                    $application->submitted_at = now();
                }
                $application->status = $newStatus;
            }

            $application->save();

            if (array_key_exists('parents', $validated)) {
                $this->syncParents($application, $validated['parents'] ?? []);
            }
        });

        $this->audit('application_updated_by_admin', $application);

        $application->fresh()->load([
            'academicYear', 'classApplied', 'parents',
            'documents.verifiedBy:id,name',
            'assessments.results', 'assessments.assessor:id,name',
            'decisions.decidedBy:id,name',
            'decisions.approvedClass:id,name',
            'decisions.house:id,name,colour',
            'decisions.academicYear:id,name',
            'comments.user:id,name',
            'student.currentClass', 'student.house', 'student.academicYear',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Application updated successfully.',
            'data' => $application,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY DOCUMENT
    |--------------------------------------------------------------------------
    */

    public function verifyDocument(
        Request $request,
        AdmissionApplication $application,
        ApplicationDocument $document
    ) {
        abort_unless($document->admission_application_id === $application->id, 404);

        $validated = $request->validate([
            'verification_status' => ['required', Rule::in(['pending', 'verified', 'rejected'])],
            'physical_received' => ['nullable', 'boolean'],
            'verification_notes' => ['nullable', 'string'],
        ]);

        $physicalReceived = $validated['physical_received'] ?? $document->physical_received;

        $document->update([
            'verification_status' => $validated['verification_status'],
            'physical_received' => $physicalReceived,
            'physical_received_at' => $physicalReceived
                ? ($document->physical_received_at ?: now())
                : null,
            'verification_notes' => $validated['verification_notes'] ?? null,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        $this->audit('verify_document', $application, [
            'document_id' => $document->id,
            'status' => $validated['verification_status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document updated successfully.',
            'data' => $document->fresh()->load('verifiedBy:id,name'),
        ]);
    }

    public function previewDocument(AdmissionApplication $application, ApplicationDocument $document)
    {
        abort_unless($document->admission_application_id === $application->id, 404);
        $disk = Storage::disk('local');
        if (!$disk->exists($document->file_path)) abort(404);

        $filename = $this->documentFilename($application, $document);

        return $disk->response($document->file_path, $filename, [
            'Content-Type' => $document->mime_type ?? 'application/octet-stream',
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
        ]);
    }

    public function downloadDocument(AdmissionApplication $application, ApplicationDocument $document)
    {
        abort_unless($document->admission_application_id === $application->id, 404);
        $disk = Storage::disk('local');
        if (!$disk->exists($document->file_path)) abort(404);

        $filename = $this->documentFilename($application, $document);

        return $disk->download($document->file_path, $filename, [
            'Content-Type' => $document->mime_type ?? 'application/octet-stream',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSESSMENTS
    |--------------------------------------------------------------------------
    */

    public function scheduleAssessment(Request $request, AdmissionApplication $application)
    {
        $validated = $request->validate([
            'assessment_date' => ['required', 'date'],
            'assessment_time' => ['nullable', 'date_format:H:i'],
            'location' => ['nullable', 'string', 'max:255'],
            'assessor_id' => ['nullable', 'integer', 'exists:users,id'],
            'assessment_type' => ['nullable', 'string', 'max:255'],
        ]);

        $assessment = $application->assessments()->create($validated);
        $application->update(['status' => 'assessment_scheduled']);

        $this->audit('assessment_scheduled', $application, [
            'assessment_id' => $assessment->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment scheduled successfully.',
            'data' => $assessment,
        ]);
    }

    public function completeAssessment(Request $request, Assessment $assessment)
    {
        $validated = $request->validate([
            'result' => ['required', Rule::in([
                'pass', 'fail', 'pending', 'recommended', 'not_recommended',
            ])],
            'comments' => ['nullable', 'string'],
            'recommendation' => ['nullable', 'string'],
            'results' => ['nullable', 'array'],
            'results.*.area' => ['required', 'string', 'max:255'],
            'results.*.score' => ['nullable', 'numeric'],
            'results.*.maximum_score' => ['nullable', 'numeric'],
            'results.*.comments' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($assessment, $validated) {
            $assessment->update(collect($validated)->except('results')->all());

            if (array_key_exists('results', $validated)) {
                $assessment->results()->delete();
                foreach ($validated['results'] ?? [] as $result) {
                    $assessment->results()->create($result);
                }
            }

            $assessment->application()->update(['status' => 'assessment_completed']);
        });

        $this->audit('assessment_completed', $assessment->application, [
            'assessment_id' => $assessment->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment completed successfully.',
            'data' => $assessment->fresh()->load('results'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DECISION (create, update, delete)
    |--------------------------------------------------------------------------
    */

    public function decide(Request $request, AdmissionApplication $application)
    {
        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'denied', 'waitlisted'])],
            'approved_class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'approved_class_name' => ['nullable', 'string', 'max:255'],
            'house_id' => ['nullable', 'integer', 'exists:houses,id'],
            'house_name' => ['nullable', 'string', 'max:255'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'comments' => ['nullable', 'string'],
            'principal_comments' => ['nullable', 'string'],
        ]);

        $this->resolveDecisionForeignKeys($validated);

        if ($validated['decision'] === 'approved' && empty($validated['approved_class_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'An approved class is required when approving an application.',
            ], 422);
        }

        $decision = DB::transaction(function () use ($request, $application, $validated) {
            $decision = $application->decisions()->create([
                'decision' => $validated['decision'],
                'approved_class_id' => $validated['approved_class_id'] ?? null,
                'house_id' => $validated['house_id'] ?? null,
                'academic_year_id' => $validated['academic_year_id'] ?? null,
                'comments' => $validated['comments'] ?? null,
                'principal_comments' => $validated['principal_comments'] ?? null,
                'decision_date' => now(),
                'decided_by' => $request->user()->id,
            ]);

            $application->update([
                'status' => $validated['decision'],
                'principal_comments' => $validated['principal_comments'] ?? null,
            ]);

            return $decision;
        });

        $this->audit('admission_decision', $application, [
            'decision' => $validated['decision'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admission decision recorded successfully.',
            'data' => $decision->load(
                'approvedClass', 'house', 'academicYear', 'decidedBy:id,name'
            ),
        ]);
    }

    public function updateDecision(
        Request $request,
        AdmissionApplication $application,
        AdmissionDecision $decision
    ) {
        abort_unless($decision->admission_application_id === $application->id, 404);

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'denied', 'waitlisted'])],
            'approved_class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'approved_class_name' => ['nullable', 'string', 'max:255'],
            'house_id' => ['nullable', 'integer', 'exists:houses,id'],
            'house_name' => ['nullable', 'string', 'max:255'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'comments' => ['nullable', 'string'],
            'principal_comments' => ['nullable', 'string'],
        ]);

        $this->resolveDecisionForeignKeys($validated);

        if ($validated['decision'] === 'approved' && empty($validated['approved_class_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'An approved class is required when approving an application.',
            ], 422);
        }

        DB::transaction(function () use ($application, $decision, $validated) {
            $decision->update([
                'decision' => $validated['decision'],
                'approved_class_id' => $validated['approved_class_id'] ?? null,
                'house_id' => $validated['house_id'] ?? null,
                'academic_year_id' => $validated['academic_year_id'] ?? null,
                'comments' => $validated['comments'] ?? null,
                'principal_comments' => $validated['principal_comments'] ?? null,
            ]);

            $application->update([
                'status' => $validated['decision'],
                'principal_comments' => $validated['principal_comments'] ?? null,
            ]);
        });

        $this->audit('admission_decision_updated', $application, [
            'decision_id' => $decision->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Decision updated successfully.',
            'data' => $decision->fresh()->load(
                'approvedClass', 'house', 'academicYear', 'decidedBy:id,name'
            ),
        ]);
    }

    public function destroyDecision(AdmissionApplication $application, AdmissionDecision $decision)
    {
        abort_unless($decision->admission_application_id === $application->id, 404);

        $decision->delete();

        $this->audit('admission_decision_deleted', $application, [
            'decision_id' => $decision->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Decision deleted successfully.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ENROL
    |--------------------------------------------------------------------------
    */

    public function enrol(Request $request, AdmissionApplication $application)
    {
        if ($application->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Only approved applications can be enrolled.',
            ], 422);
        }

        if ($application->student) {
            return response()->json([
                'success' => true,
                'message' => 'Student record already exists.',
                'data' => $application->student,
            ], 200);
        }

        $validated = $request->validate([
            'class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'class_name' => ['nullable', 'string', 'max:255'],
            'house_id' => ['nullable', 'integer', 'exists:houses,id'],
            'house_name' => ['nullable', 'string', 'max:255'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
        ]);

        /* Resolve class */
        if (empty($validated['class_id']) && !empty($validated['class_name'])) {
            $class = SchoolClass::firstOrCreate(
                ['name' => $validated['class_name']],
                ['is_active' => true, 'sort_order' => 99]
            );
            $validated['class_id'] = $class->id;
        }
        if (empty($validated['class_id']) && $application->class_applied_id) {
            $validated['class_id'] = $application->class_applied_id;
        }
        if (empty($validated['class_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'A class is required for enrolment.',
            ], 422);
        }

        /* Resolve house */
        if (empty($validated['house_id']) && !empty($validated['house_name'])) {
            $house = \App\Models\House::firstOrCreate(
                ['name' => $validated['house_name']],
                ['is_active' => true, 'colour' => '#252B68']
            );
            $validated['house_id'] = $house->id;
        }

        $student = DB::transaction(function () use ($application, $validated) {
            $year = \App\Models\AcademicYear::findOrFail($validated['academic_year_id']);
            $yearNumber = preg_replace('/[^0-9]/', '', $year->name) ?: date('Y');

            $count = Student::where('academic_year_id', $year->id)
                ->lockForUpdate()->count() + 1;

            $number = 'MVIS-' . $yearNumber . '-'
                . str_pad((string) $count, 4, '0', STR_PAD_LEFT);

            $student = Student::create([
                'student_number' => $number,
                'admission_application_id' => $application->id,
                'first_name' => $application->legal_first_name,
                'middle_name' => $application->middle_name,
                'surname' => $application->legal_surname,
                'date_of_birth' => $application->date_of_birth,
                'gender' => $application->gender,
                'blood_group' => $application->blood_group,
                'nationality' => $application->nationality,
                'first_language' => $application->first_language,
                'religion' => $application->religion,
                'photo_path' => $application->student_photo_path,
                'current_class_id' => $validated['class_id'],
                'house_id' => $validated['house_id'] ?? null,
                'academic_year_id' => $validated['academic_year_id'],
                'admission_date' => now()->toDateString(),
                'status' => 'active',
            ]);

            StudentClassHistory::create([
                'student_id' => $student->id,
                'class_id' => $validated['class_id'],
                'academic_year_id' => $validated['academic_year_id'],
                'house_id' => $validated['house_id'] ?? null,
                'start_date' => now()->toDateString(),
            ]);

            $application->update([
                'status' => 'enrolled',
                'enrolled_at' => now(),
            ]);

            return $student;
        });

        $this->audit('student_enrolled', $application, ['student_id' => $student->id]);

        return response()->json([
            'success' => true,
            'message' => 'Student record created successfully.',
            'data' => $student->load('currentClass', 'house', 'academicYear'),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */

    public function dashboard()
    {
        $query = AdmissionApplication::query()->whereNotIn('status', ['draft']);

        return response()->json([
            'success' => true,
            'data' => [
                'total' => (clone $query)->count(),
                'submitted' => (clone $query)->where('status', 'submitted')->count(),
                'document_verification' => (clone $query)->where('status', 'document_verification')->count(),
                'assessments_scheduled' => (clone $query)->where('status', 'assessment_scheduled')->count(),
                'assessments_completed' => (clone $query)->where('status', 'assessment_completed')->count(),
                'awaiting_approval' => (clone $query)->where('status', 'principal_review')->count(),
                'approved' => (clone $query)->where('status', 'approved')->count(),
                'denied' => (clone $query)->where('status', 'denied')->count(),
                'waitlisted' => (clone $query)->where('status', 'waitlisted')->count(),
                'enrolled' => (clone $query)->where('status', 'enrolled')->count(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | NOTIFICATIONS
    |--------------------------------------------------------------------------
    */

    public function notifications(Request $request)
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->orderByDesc('created_at')->limit(30)->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'read_at' => $n->read_at,
                'created_at' => $n->created_at,
                'title' => $n->data['title'] ?? 'Notification',
                'message' => $n->data['message'] ?? '',
                'application_id' => $n->data['application_id'] ?? null,
                'application_number' => $n->data['application_number'] ?? null,
                'url' => $n->data['url'] ?? null,
            ]);

        return response()->json([
            'success' => true,
            'unread_count' => $user->unreadNotifications()->count(),
            'data' => $notifications,
        ]);
    }

    public function markNotificationRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();
        if ($notification) $notification->markAsRead();

        return response()->json([
            'success' => true,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllNotificationsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true, 'unread_count' => 0]);
    }

    /*
    |--------------------------------------------------------------------------
    | COMMENTS
    |--------------------------------------------------------------------------
    */

    public function storeComment(Request $request, AdmissionApplication $application)
    {
        $user = $request->user();

        if (!in_array($user->role, ['administrator', 'principal'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only the headteacher or an administrator can comment on applications.',
            ], 403);
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $comment = $application->comments()->create([
            'user_id' => $user->id,
            'role_snapshot' => $user->role,
            'body' => trim($validated['body']),
        ]);

        $this->audit('comment_added', $application, ['comment_id' => $comment->id]);

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully.',
            'data' => [
                'id' => $comment->id,
                'body' => $comment->body,
                'role_snapshot' => $comment->role_snapshot,
                'created_at' => $comment->created_at,
                'author' => ['id' => $user->id, 'name' => $user->name],
            ],
        ], 201);
    }

    public function updateComment(
        Request $request,
        AdmissionApplication $application,
        AdmissionComment $comment
    ) {
        abort_unless($comment->admission_application_id === $application->id, 404);

        $user = $request->user();
        if ($comment->user_id !== $user->id && $user->role !== 'administrator') {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own comments.',
            ], 403);
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $comment->update(['body' => trim($validated['body'])]);

        return response()->json([
            'success' => true,
            'message' => 'Comment updated successfully.',
            'data' => $comment->fresh()->load('user:id,name'),
        ]);
    }

    public function destroyComment(
        Request $request,
        AdmissionApplication $application,
        AdmissionComment $comment
    ) {
        abort_unless($comment->admission_application_id === $application->id, 404);

        $user = $request->user();
        if ($comment->user_id !== $user->id && $user->role !== 'administrator') {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own comments.',
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PRINTABLE
    |--------------------------------------------------------------------------
    */

    public function printApplication(Request $request, AdmissionApplication $application)
    {
        $token = $request->bearerToken() ?: $request->query('token');

        if (!$token) {
            return $this->printErrorPage('Print session missing.',
                'No access token was supplied. Please reopen the application from the admin portal.', 401);
        }

        $personalToken = PersonalAccessToken::findToken($token);
        if (!$personalToken) {
            return $this->printErrorPage('Print session expired.',
                'Your access token is invalid or has expired. Please log in again and try printing again.', 401);
        }

        $user = $personalToken->tokenable;
        if (!$user || !$user->is_active) {
            return $this->printErrorPage('Account inactive.',
                'Your account is inactive. Please contact an administrator.', 401);
        }

        if (!in_array($user->role, ['administrator', 'admissions_officer', 'principal'], true)) {
            return $this->printErrorPage('Access denied.',
                'You do not have permission to print this application.', 403);
        }

        $application->load([
            'academicYear', 'classApplied', 'parents',
            'documents.verifiedBy:id,name',
            'assessments.results', 'assessments.assessor:id,name',
            'decisions.decidedBy:id,name',
            'decisions.approvedClass:id,name',
            'decisions.house:id,name,colour',
            'decisions.academicYear:id,name',
            'termsAcceptances.termsCondition',
            'comments.user:id,name',
            'student.currentClass', 'student.house', 'student.academicYear',
        ]);

        return response($this->buildPrintHtml($application))
            ->header('Content-Type', 'text/html; charset=utf-8');
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    private function resolveClassId(array $validated): ?int
    {
        if (!empty($validated['class_applied_id'])) {
            return (int) $validated['class_applied_id'];
        }
        if (!empty($validated['class_applied_name'])) {
            $class = SchoolClass::firstOrCreate(
                ['name' => $validated['class_applied_name']],
                ['is_active' => true, 'sort_order' => 99]
            );
            return (int) $class->id;
        }
        return null;
    }

    private function resolveDecisionForeignKeys(array &$validated): void
    {
        if (
            empty($validated['approved_class_id']) &&
            !empty($validated['approved_class_name'])
        ) {
            $class = SchoolClass::firstOrCreate(
                ['name' => $validated['approved_class_name']],
                ['is_active' => true, 'sort_order' => 99]
            );
            $validated['approved_class_id'] = $class->id;
        }

        if (empty($validated['house_id']) && !empty($validated['house_name'])) {
            $house = \App\Models\House::firstOrCreate(
                ['name' => $validated['house_name']],
                ['is_active' => true, 'colour' => '#252B68']
            );
            $validated['house_id'] = $house->id;
        }
    }

    private function validateApplicationPayload(Request $request): array
    {
        return $request->validate([
            'status' => ['nullable', Rule::in([
                'draft', 'submitted', 'document_verification', 'assessment_scheduled',
                'assessment_completed', 'principal_review', 'approved',
                'denied', 'waitlisted', 'enrolled', 'transferred', 'withdrawn',
            ])],
            'source' => ['nullable', Rule::in(['online', 'paper'])],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'class_applied_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'class_applied_name' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],

            'student' => ['required', 'array'],
            'student.legal_first_name' => ['required', 'string', 'max:255'],
            'student.legal_surname' => ['required', 'string', 'max:255'],
            'student.middle_name' => ['nullable', 'string', 'max:255'],
            'student.date_of_birth' => ['nullable', 'date'],
            'student.gender' => ['nullable', 'string', 'max:50'],
            'student.blood_group' => ['nullable', 'string', 'max:10'],
            'student.weight_kg' => ['nullable', 'numeric'],
            'student.height_cm' => ['nullable', 'numeric'],
            'student.first_language' => ['nullable', 'string', 'max:100'],
            'student.nationality' => ['nullable', 'string', 'max:100'],
            'student.religion' => ['nullable', 'string', 'max:100'],
            'student.emergency_contact' => ['nullable', 'string', 'max:100'],
            'student.family_member_count' => ['nullable', 'integer', 'min:0'],
            'student.student_lives_with' => ['nullable', 'string', 'max:100'],
            'student.children_at_mount_view' => ['nullable', 'integer', 'min:0'],
            'student.siblings_at_mount_view' => ['nullable', 'array'],
            'student.siblings_at_mount_view.*' => ['nullable', 'string', 'max:255'],
            'student.email_with_mount_view' => ['nullable', 'email', 'max:255'],
            'student.physical_address' => ['nullable', 'string'],
            'student.medical_conditions' => ['nullable', 'string'],
            'student.allergies' => ['nullable', 'string'],
            'student.learning_needs' => ['nullable', 'string'],
            'student.family_doctor_name' => ['nullable', 'string', 'max:255'],
            'student.family_doctor_phone' => ['nullable', 'string', 'max:50'],
            'student.previous_school_name' => ['nullable', 'string', 'max:255'],
            'student.previous_school_address' => ['nullable', 'string'],
            'student.previous_class' => ['nullable', 'string', 'max:100'],
            'student.previous_year' => ['nullable', 'string', 'max:20'],
            'student.reason_for_leaving' => ['nullable', 'string'],
            'student.previous_school_contact' => ['nullable', 'string', 'max:255'],
            'student.previous_school_country' => ['nullable', 'string', 'max:100'],
            'student.previous_school_language' => ['nullable', 'string', 'max:100'],

            'parents' => ['nullable', 'array'],
            'parents.*.full_name' => ['required_with:parents', 'string', 'max:255'],
            'parents.*.relationship' => ['required_with:parents', 'string', 'max:100'],
            'parents.*.phone_number' => ['nullable', 'string', 'max:50'],
            'parents.*.phone' => ['nullable', 'string', 'max:50'],
            'parents.*.email' => ['nullable', 'email', 'max:255'],
            'parents.*.occupation' => ['nullable', 'string', 'max:255'],
            'parents.*.position_title' => ['nullable', 'string', 'max:255'],
            'parents.*.employer' => ['nullable', 'string', 'max:255'],
            'parents.*.work_address' => ['nullable', 'string'],
            'parents.*.work_phone' => ['nullable', 'string', 'max:50'],
            'parents.*.employer_pays_fees' => ['nullable', 'boolean'],
            'parents.*.employer_payment_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'parents.*.physical_address' => ['nullable', 'string'],
            'parents.*.postal_address' => ['nullable', 'string'],
            'parents.*.emergency_contact' => ['nullable', 'boolean'],
            'parents.*.preferred_communication' => ['nullable', 'string', 'max:50'],
            'parents.*.is_primary' => ['nullable', 'boolean'],
        ]);
    }

    private function syncParents(AdmissionApplication $application, array $parents): void
    {
        $application->parents()->delete();

        foreach ($parents as $parent) {
            $employerPays = filter_var(
                $parent['employer_pays_fees'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            );

            $application->parents()->create([
                'full_name' => $parent['full_name'],
                'relationship' => $parent['relationship'],
                'phone_number' => $parent['phone_number'] ?? $parent['phone'] ?? null,
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
                    $parent['emergency_contact'] ?? false, FILTER_VALIDATE_BOOLEAN
                ),
                'preferred_communication' => $parent['preferred_communication'] ?? null,
                'is_primary' => filter_var(
                    $parent['is_primary'] ?? false, FILTER_VALIDATE_BOOLEAN
                ),
            ]);
        }
    }

    private function normalizeDate($date): ?string
    {
        if (!$date) return null;
        $date = trim((string) $date);
        return $date === '' ? null : substr($date, 0, 10);
    }

    private function documentFilename(AdmissionApplication $application, ApplicationDocument $document): string
    {
        $studentName = trim(
            ($application->legal_first_name ?? '') . ' ' .
            ($application->legal_surname ?? '')
        );
        $studentSlug = Str::slug($studentName, '_') ?: 'student';

        $typeLabels = [
            'birth_certificate_or_passport' => 'Birth_Certificate_or_Main_Passport_Pages',
            'passport_photograph_1' => 'Passport_Photograph_1',
            'passport_photograph_2' => 'Passport_Photograph_2',
            'school_report' => 'Original_Mark_Sheets_or_School_Report',
        ];
        $typeSlug = $typeLabels[$document->document_type]
            ?? Str::slug($document->document_type, '_');

        $extension = strtolower(pathinfo($document->original_name, PATHINFO_EXTENSION)) ?: 'pdf';

        return "{$studentSlug}_{$typeSlug}.{$extension}";
    }

    private function printErrorPage(string $heading, string $message, int $status)
    {
        $e = fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
        $html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' .
            $e($heading) . '</title><style>body{font-family:Arial;padding:40px;background:#f8fafc;color:#172033}' .
            '.card{max-width:480px;margin:40px auto;border:1px solid #e2e8f0;border-radius:16px;padding:24px;background:#fff}' .
            'h1{color:#252B68;font-size:20px;margin:0 0 8px}p{color:#4b5563;font-size:14px;line-height:1.5;margin:0}' .
            '.brand{color:#F58220;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}' .
            '</style></head><body><div class="card"><div class="brand">Mount View Admin</div>' .
            '<h1>' . $e($heading) . '</h1><p>' . $e($message) . '</p></div></body></html>';

        return response($html, $status)->header('Content-Type', 'text/html; charset=utf-8');
    }

    private function getLogoBase64(): ?string
    {
        $candidates = [
            public_path('logo.jpg'), public_path('logo.png'),
            public_path('images/logo.jpg'), public_path('images/logo.png'),
            storage_path('app/public/logo.jpg'), storage_path('app/public/logo.png'),
        ];
        foreach ($candidates as $path) {
            if (!is_file($path)) continue;
            $data = @file_get_contents($path);
            if ($data === false || $data === '') continue;
            $mime = @mime_content_type($path) ?: 'image/jpeg';
            return 'data:' . $mime . ';base64,' . base64_encode($data);
        }
        return null;
    }

    private function getLocalFileBase64(?string $path): ?string
    {
        if (!$path) return null;
        $disk = Storage::disk('local');
        if (!$disk->exists($path)) return null;
        $data = $disk->get($path);
        if ($data === false || $data === '') return null;
        $mime = $disk->mimeType($path) ?: 'application/octet-stream';
        return 'data:' . $mime . ';base64,' . base64_encode($data);
    }

    private function buildPrintHtml(AdmissionApplication $application): string
    {
        $e = fn ($value) => htmlspecialchars((string) ($value ?? ''), ENT_QUOTES, 'UTF-8');
        $fmtDate = function ($value) {
            if (!$value) return '—';
            try { return Carbon::parse($value)->format('d M Y'); }
            catch (\Throwable $ex) { return (string) $value; }
        };
        $fmtDateTime = function ($value) {
            if (!$value) return '—';
            try { return Carbon::parse($value)->format('d M Y, H:i'); }
            catch (\Throwable $ex) { return (string) $value; }
        };

        $logoBase64 = $this->getLogoBase64();
        $headerLogoHtml = $logoBase64
            ? '<img src="' . $logoBase64 . '" alt="Mount View" class="header-logo">' : '';
        $watermarkHtml = $logoBase64
            ? '<div class="watermark" aria-hidden="true"><img src="' . $logoBase64 . '" alt=""></div>' : '';

        $photoBase64 = $this->getLocalFileBase64($application->student_photo_path);
        $photoHtml = $photoBase64
            ? '<img src="' . $photoBase64 . '" alt="Student photograph" class="student-photo">'
            : '<div class="student-photo placeholder">No photograph</div>';

        $renderRows = function (array $pairs) use ($e) {
            $html = '';
            foreach ($pairs as $label => $value) {
                $html .= '<tr><th>' . $e($label) . '</th><td>' .
                    ($value === '' || $value === null ? '—' : $e($value)) . '</td></tr>';
            }
            return $html;
        };

        $fullName = trim(
            ($application->legal_first_name ?? '') . ' ' .
            ($application->middle_name ?? '') . ' ' .
            ($application->legal_surname ?? '')
        );
        $fullNameEsc = $e($fullName);
        $appNumberDisplay = $e($application->application_number);
        $statusLabel = $e(ucfirst(str_replace('_', ' ', $application->status ?? '')));

        $classAppliedName = $application->classApplied ? $application->classApplied->name : null;
        $classAppliedDisplay = $e($classAppliedName);
        $academicYearName = $application->academicYear ? $application->academicYear->name : null;
        $academicYearDisplay = $e($academicYearName);
        $sourceLabel = $e(ucfirst($application->source ?? ''));
        $physicalFileLabel = $e(ucfirst(str_replace('_', ' ', $application->physical_file_status ?? '')));
        $submittedAtDisplay = $e($fmtDateTime($application->submitted_at));
        $generatedAtDisplay = $e(now()->format('d M Y, H:i'));
        $siblingsText = is_array($application->siblings_at_mount_view)
            ? implode(', ', $application->siblings_at_mount_view) : null;

        $studentDetailsRows = $renderRows([
            'Legal First Name' => $application->legal_first_name,
            'Middle Name' => $application->middle_name,
            'Legal Surname' => $application->legal_surname,
            'Date of Birth' => $fmtDate($application->date_of_birth),
            'Gender' => $application->gender,
            'Blood Group' => $application->blood_group,
            'Nationality' => $application->nationality,
            'First Language' => $application->first_language,
            'Religion' => $application->religion,
            'Weight (kg)' => $application->weight_kg,
            'Height (cm)' => $application->height_cm,
            'Emergency Contact' => $application->emergency_contact,
            'Family Members' => $application->family_member_count,
            'Student Lives With' => $application->student_lives_with,
            'Children at Mount View' => $application->children_at_mount_view,
            'Siblings at Mount View' => $siblingsText,
            'Email with Mount View' => $application->email_with_mount_view,
            'Class Applied For' => $classAppliedName,
            'Academic Year' => $academicYearName,
            'Physical Address' => $application->physical_address,
        ]);

        $medicalRows = $renderRows([
            'Medical Conditions' => $application->medical_conditions,
            'Allergies' => $application->allergies,
            'Learning Needs' => $application->learning_needs,
            'Family Doctor' => $application->family_doctor_name,
            'Family Doctor Phone' => $application->family_doctor_phone,
        ]);

        $previousSchoolRows = $renderRows([
            'School Name' => $application->previous_school_name,
            'Country' => $application->previous_school_country,
            'Instructional Language' => $application->previous_school_language,
            'School Address' => $application->previous_school_address,
            'Previous Class' => $application->previous_class,
            'Previous Year' => $application->previous_year,
            'Reason for Leaving' => $application->reason_for_leaving,
            'School Contact' => $application->previous_school_contact,
        ]);

        $notesRows = $renderRows([
            'Parent Notes' => $application->parent_notes,
            'Admissions Notes' => $application->admissions_notes,
            'Administrator Comments' => $application->administrator_comments,
            'Principal Comments' => $application->principal_comments,
        ]);

        $docLabels = [
            'birth_certificate_or_passport' => 'Birth Certificate or Main Passport Pages',
            'passport_photograph_1' => 'Passport Photograph 1',
            'passport_photograph_2' => 'Passport Photograph 2',
            'school_report' => 'Original Mark Sheets / School Report',
        ];

        $parentsHtml = '';
        if ($application->parents->isEmpty()) {
            $parentsHtml = '<tr><td colspan="4" class="empty">No parents recorded.</td></tr>';
        } else {
            foreach ($application->parents as $parent) {
                $phoneValue = $parent->phone_number ?: $parent->phone;
                $parentsHtml .= '<tr>';
                $parentsHtml .= '<td>' . $e($parent->full_name) . '</td>';
                $parentsHtml .= '<td>' . $e($parent->relationship) . '</td>';
                $parentsHtml .= '<td>' . $e($phoneValue) . '</td>';
                $parentsHtml .= '<td>' . $e($parent->email) . '</td>';
                $parentsHtml .= '</tr>';

                $parentsHtml .= '<tr class="sub-row"><td colspan="4">';
                $parentsHtml .= '<strong>Occupation:</strong> ' . $e($parent->occupation) . ' &nbsp;·&nbsp; ';
                $parentsHtml .= '<strong>Position:</strong> ' . $e($parent->position_title) . ' &nbsp;·&nbsp; ';
                $parentsHtml .= '<strong>Employer:</strong> ' . $e($parent->employer) . ' &nbsp;·&nbsp; ';
                $parentsHtml .= '<strong>Work Phone:</strong> ' . $e($parent->work_phone);
                if ($parent->employer_pays_fees) {
                    $parentsHtml .= ' &nbsp;·&nbsp; <strong>Employer pays fees:</strong> '
                        . $e($parent->employer_payment_percentage) . '%';
                }
                $parentsHtml .= '</td></tr>';

                if ($parent->work_address) {
                    $parentsHtml .= '<tr class="sub-row"><td colspan="4">'
                        . '<strong>Work Address:</strong> ' . $e($parent->work_address)
                        . '</td></tr>';
                }
            }
        }

        $documentsHtml = '';
        if ($application->documents->isEmpty()) {
            $documentsHtml = '<tr><td colspan="7" class="empty">No documents uploaded.</td></tr>';
        } else {
            foreach ($application->documents as $doc) {
                $label = $docLabels[$doc->document_type] ?? $doc->document_type;
                $size = $doc->file_size ? number_format($doc->file_size / 1024, 1) . ' KB' : '—';
                $status = ucfirst($doc->verification_status ?? 'pending');
                $physical = $doc->physical_received ? 'Yes' : 'No';
                $verifiedByName = $doc->verifiedBy ? $doc->verifiedBy->name : null;

                $documentsHtml .= '<tr>';
                $documentsHtml .= '<td>' . $e($label) . '</td>';
                $documentsHtml .= '<td>' . $e($doc->original_name) . '</td>';
                $documentsHtml .= '<td>' . $e($size) . '</td>';
                $documentsHtml .= '<td>' . $e($status) . '</td>';
                $documentsHtml .= '<td>' . $e($physical) . '</td>';
                $documentsHtml .= '<td>' . $e($verifiedByName) . '</td>';
                $documentsHtml .= '<td>' . $e($fmtDateTime($doc->verified_at)) . '</td>';
                $documentsHtml .= '</tr>';
            }
        }

        $assessmentsHtml = '';
        if ($application->assessments->isEmpty()) {
            $assessmentsHtml = '<p class="empty">No assessments scheduled.</p>';
        } else {
            foreach ($application->assessments as $assessment) {
                $resultLabel = $assessment->result
                    ? ucfirst(str_replace('_', ' ', $assessment->result)) : null;
                $assessorName = $assessment->assessor ? $assessment->assessor->name : null;

                $assessmentsHtml .= '<div class="assessment-block">';
                $assessmentsHtml .= '<table class="data">';
                $assessmentsHtml .= $renderRows([
                    'Type' => $assessment->assessment_type ?: 'Assessment',
                    'Date' => $fmtDate($assessment->assessment_date),
                    'Time' => $assessment->assessment_time,
                    'Location' => $assessment->location,
                    'Assessor' => $assessorName,
                    'Result' => $resultLabel,
                    'Comments' => $assessment->comments,
                    'Recommendation' => $assessment->recommendation,
                ]);
                $assessmentsHtml .= '</table>';
                $assessmentsHtml .= '</div>';
            }
        }

        $decisionsHtml = '';
        if ($application->decisions->isEmpty()) {
            $decisionsHtml = '<p class="empty">No decision recorded.</p>';
        } else {
            foreach ($application->decisions as $decision) {
                $decisionsHtml .= '<table class="data">';
                $decisionsHtml .= $renderRows([
                    'Decision' => ucfirst($decision->decision),
                    'Decision Date' => $fmtDateTime($decision->decision_date),
                    'Decided By' => $decision->decidedBy?->name,
                    'Approved Class' => $decision->approvedClass?->name,
                    'House' => $decision->house?->name,
                    'Academic Year' => $decision->academicYear?->name,
                    'Comments' => $decision->comments,
                    'Principal Comments' => $decision->principal_comments,
                ]);
                $decisionsHtml .= '</table>';
            }
        }

        $studentRecordSection = '';
        if ($application->student) {
            $student = $application->student;
            $studentRecordRows = $renderRows([
                'Student Number' => $student->student_number,
                'Current Class' => $student->currentClass?->name,
                'House' => $student->house?->name,
                'Academic Year' => $student->academicYear?->name,
                'Admission Date' => $fmtDate($student->admission_date),
                'Status' => $student->status,
            ]);
            $studentRecordSection = '<h2 class="section">Enrolled Student Record</h2>'
                . '<table class="data">' . $studentRecordRows . '</table>';
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Application {$appNumberDisplay}</title>
<style>
  * { box-sizing: border-box; }
  @page { margin: 14mm 12mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: Arial, sans-serif; color: #172033; font-size: 12px; line-height: 1.5; padding: 24px; position: relative; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60%; max-width: 520px; opacity: 0.06; pointer-events: none; z-index: 0; }
  .watermark img { width: 100%; height: auto; display: block; }
  .content { position: relative; z-index: 1; }
  .header { display: flex; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 3px solid #252B68; padding-bottom: 12px; margin-bottom: 20px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .header-logo { width: 60px; height: 60px; object-fit: contain; border-radius: 8px; }
  .brand-text h1 { margin: 0; font-size: 20px; color: #252B68; font-weight: 900; }
  .brand-text p { margin: 2px 0 0; color: #F58220; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
  .ref { text-align: right; font-size: 11px; color: #666; }
  .ref strong { display: block; color: #252B68; font-size: 14px; margin-top: 4px; font-family: monospace; }
  .summary { display: flex; align-items: flex-start; gap: 18px; margin-bottom: 20px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
  .student-photo { width: 110px; height: 130px; object-fit: cover; border-radius: 8px; border: 2px solid #fff; box-shadow: 0 0 0 1px #e2e8f0; flex-shrink: 0; background: #fff; }
  .student-photo.placeholder { display: flex; align-items: center; justify-content: center; font-size: 11px; color: #94a3b8; }
  .summary-meta h2 { margin: 0 0 6px; font-size: 18px; color: #252B68; font-weight: 900; }
  .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 24px; font-size: 11px; }
  .summary-grid strong { display: block; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
  h2.section { font-size: 13px; color: #252B68; margin: 22px 0 8px; text-transform: uppercase; letter-spacing: 1px; border-left: 4px solid #F58220; padding-left: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  table th, table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; font-size: 11px; }
  table th { background: #f5f5f5; font-weight: 700; color: #333; }
  table.data th { width: 28%; }
  .sub-row td { background: #fafafa; font-size: 10px; color: #475569; }
  .empty { text-align: center; color: #94a3b8; font-style: italic; }
  .assessment-block { margin-bottom: 12px; page-break-inside: avoid; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
  @media print { body { padding: 0; } h2.section { page-break-after: avoid; } tr { page-break-inside: avoid; } }
</style>
</head>
<body>
{$watermarkHtml}
<div class="content">
  <div class="header">
    <div class="brand">
      {$headerLogoHtml}
      <div class="brand-text">
        <h1>Mount View International</h1>
        <p>Primary School &amp; Early Years Centre · Admission Application</p>
      </div>
    </div>
    <div class="ref">
      Application Number
      <strong>{$appNumberDisplay}</strong>
      Submitted: {$submittedAtDisplay}
    </div>
  </div>

  <div class="summary">
    {$photoHtml}
    <div class="summary-meta">
      <h2>{$fullNameEsc}</h2>
      <div class="summary-grid">
        <div><strong>Status</strong>{$statusLabel}</div>
        <div><strong>Class Applied For</strong>{$classAppliedDisplay}</div>
        <div><strong>Academic Year</strong>{$academicYearDisplay}</div>
        <div><strong>Source</strong>{$sourceLabel}</div>
        <div><strong>Physical File</strong>{$physicalFileLabel}</div>
        <div><strong>Submitted</strong>{$submittedAtDisplay}</div>
      </div>
    </div>
  </div>

  <h2 class="section">Student Information</h2>
  <table class="data">{$studentDetailsRows}</table>

  <h2 class="section">Medical Information</h2>
  <table class="data">{$medicalRows}</table>

  <h2 class="section">Parents / Guardians</h2>
  <table>
    <thead><tr>
      <th style="width:28%">Full Name</th>
      <th style="width:22%">Relationship</th>
      <th style="width:24%">Phone</th>
      <th style="width:26%">Email</th>
    </tr></thead>
    <tbody>{$parentsHtml}</tbody>
  </table>

  <h2 class="section">Previous School</h2>
  <table class="data">{$previousSchoolRows}</table>

  <h2 class="section">Uploaded Documents</h2>
  <table>
    <thead><tr>
      <th style="width:26%">Document</th>
      <th style="width:20%">Original File</th>
      <th style="width:9%">Size</th>
      <th style="width:11%">Status</th>
      <th style="width:10%">Physical</th>
      <th style="width:12%">Verified By</th>
      <th style="width:12%">Verified At</th>
    </tr></thead>
    <tbody>{$documentsHtml}</tbody>
  </table>

  <h2 class="section">Assessments</h2>
  {$assessmentsHtml}

  <h2 class="section">Admission Decision</h2>
  {$decisionsHtml}

  <h2 class="section">Notes</h2>
  <table class="data">{$notesRows}</table>

  {$studentRecordSection}

  <div class="footer">
    <span>Generated on {$generatedAtDisplay}</span>
    <span>Mount View International Primary School &amp; Early Years Centre</span>
  </div>
</div>
<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 400); });</script>
</body>
</html>
HTML;
    }

    private function audit(
        string $action,
        ?AdmissionApplication $application = null,
        array $metadata = []
    ): void {
        AuditLog::create([
            'user_id' => request()->user()?->id,
            'action' => $action,
            'auditable_type' => $application ? AdmissionApplication::class : null,
            'auditable_id' => $application?->id,
            'application_number' => $application?->application_number,
            'metadata' => $metadata,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}