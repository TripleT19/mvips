<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\AdmissionComment;
use App\Models\AdmissionDecision;
use App\Models\ApplicationDocument;
use App\Models\Assessment;
use App\Models\AuditLog;
use App\Models\ClassStream;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentClassHistory;
use App\Notifications\AssessmentPassedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AdminAdmissionController extends Controller
{
    /* ============================================================ LIST */
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
                    ->orWhereHas('parents', fn ($p) => $p->where('full_name', 'like', "%{$search}%")
                        ->orWhere('phone_number', 'like', "%{$search}%"));
            });
        }
        if ($request->filled('status')) $query->where('status', $request->query('status'));
        else $query->whereNotIn('status', ['draft']);
        if ($request->filled('physical_file_status')) $query->where('physical_file_status', $request->query('physical_file_status'));
        if ($request->filled('academic_year_id')) $query->where('academic_year_id', $request->query('academic_year_id'));
        if ($request->filled('class_applied_id')) $query->where('class_applied_id', $request->query('class_applied_id'));
        if ($request->filled('source')) $query->where('source', $request->query('source'));

        return response()->json([
            'success' => true,
            'data' => $query->latest()->paginate(min((int) $request->query('per_page', 25), 100)),
        ]);
    }

    /* ============================================================ SHOW */
    public function show(AdmissionApplication $application)
    {
        $application->load([
            'academicYear', 'classApplied', 'parents',
            'documents.verifiedBy:id,name',
            'assessments.results', 'assessments.assessor:id,name',
            'decisions.decidedBy:id,name', 'decisions.approvedClass:id,name',
            'decisions.house:id,name,colour', 'decisions.academicYear:id,name',
            'termsAcceptances.termsCondition', 'comments.user:id,name',
            'student.currentClass', 'student.currentClassStream.stream',
            'student.house', 'student.academicYear',
        ]);

        $this->audit('view_application', $application);

        return response()->json(['success' => true, 'data' => $application]);
    }

    /* ============================================================ FORM OPTIONS */
    public function formOptions()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'classes' => SchoolClass::where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'code']),
                'class_streams' => ClassStream::with(['stream:id,name,code,colour', 'schoolClass:id,name'])
                    ->where('is_active', true)->orderBy('name')
                    ->get(['id', 'school_class_id', 'stream_id', 'name']),
                'academic_years' => \App\Models\AcademicYear::orderByDesc('name')->get(['id', 'name', 'is_current']),
                'houses' => \App\Models\House::where('is_active', true)->orderBy('name')->get(['id', 'name', 'colour']),
            ],
        ]);
    }

    /* ============================================================ STORE */
    public function store(Request $request)
    {
        $validated = $this->validateApplicationPayload($request);

        $academicYear = !empty($validated['academic_year_id'])
            ? \App\Models\AcademicYear::find($validated['academic_year_id'])
            : \App\Models\AcademicYear::where('is_current', true)->first();

        if (!$academicYear) {
            return response()->json(['success' => false, 'message' => 'No active academic year is available.'], 422);
        }

        $paperEnrol = $request->boolean('paper_enrol', false);
        $paperData = null;

        if ($paperEnrol) {
            $paperData = $request->validate([
                'paper_decision' => ['required', Rule::in(['approved', 'denied', 'waitlisted'])],
                'paper_class_stream_id' => ['nullable', 'integer', 'exists:class_streams,id'],
                'paper_house_id' => ['nullable', 'integer', 'exists:houses,id'],
                'paper_comments' => ['nullable', 'string'],
                'paper_principal_comments' => ['nullable', 'string'],
            ]);

            if ($paperData['paper_decision'] === 'approved') {
                if (empty($paperData['paper_class_stream_id'])) {
                    throw ValidationException::withMessages([
                        'paper_class_stream_id' => 'Select the class section the student is already in.',
                    ]);
                }
                if (empty($paperData['paper_house_id'])) {
                    throw ValidationException::withMessages([
                        'paper_house_id' => 'Select the house the student is already in.',
                    ]);
                }

                $stream = ClassStream::find($paperData['paper_class_stream_id']);
                $resolvedClassId = $this->resolveClassId($validated);
                if ($stream && $resolvedClassId && $stream->school_class_id !== $resolvedClassId) {
                    throw ValidationException::withMessages([
                        'paper_class_stream_id' => 'The selected section does not belong to the chosen class.',
                    ]);
                }
            }
        }

        $status = $paperEnrol ? null : ($validated['status'] ?? 'draft');

        [$application, $student] = DB::transaction(function () use ($validated, $academicYear, $status, $paperEnrol, $paperData) {
            $prefix = 'MVIPS-' . $academicYear->name . '-';
            $last = AdmissionApplication::where('application_number', 'like', $prefix . '%')
                ->orderByDesc('id')->first();
            $next = $last ? (int) Str::after($last->application_number, $prefix) + 1 : 1;

            $application = AdmissionApplication::create([
                'application_number' => $prefix . str_pad($next, 5, '0', STR_PAD_LEFT),
                'tracking_token_hash' => hash('sha256', Str::random(64)),
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
                'previous_school_contact' => $validated['student']['previous_school_contact'] ?? null,
                'previous_school_country' => $validated['student']['previous_school_country'] ?? null,
                'previous_school_language' => $validated['student']['previous_school_language'] ?? null,
                'physical_file_status' => $validated['physical_file_status'] ?? 'pending',
                'status' => $paperEnrol ? 'draft' : ($status ?? 'draft'),
                'source' => $validated['source'] ?? 'paper',
                'submitted' => $paperEnrol ? false : ($status !== 'draft'),
                'submitted_at' => ($paperEnrol || $status === 'draft') ? null : now(),
            ]);

            $this->syncParents($application, $validated['parents'] ?? []);

            $student = null;

            if ($paperEnrol && $paperData) {
                $application->decisions()->create([
                    'decision' => $paperData['paper_decision'],
                    'approved_class_id' => $application->class_applied_id,
                    'house_id' => $paperData['paper_house_id'] ?? null,
                    'academic_year_id' => $academicYear->id,
                    'comments' => $paperData['paper_comments'] ?? null,
                    'principal_comments' => $paperData['paper_principal_comments'] ?? null,
                    'decision_date' => now(),
                    'decided_by' => request()->user()?->id,
                ]);

                $application->update(['status' => $paperData['paper_decision']]);

                if ($paperData['paper_decision'] === 'approved'
                    && $application->physical_file_status !== 'pending'
                    && $application->class_applied_id) {
                    $student = $this->createStudentRecord(
                        $application,
                        (int) $application->class_applied_id,
                        (int) $paperData['paper_class_stream_id'],
                        (int) $paperData['paper_house_id'],
                        $academicYear->id
                    );
                }
            }

            return [$application, $student];
        });

        $this->audit('application_created_by_admin', $application, [
            'paper_enrol' => $paperEnrol,
            'enrolled' => $student !== null,
            'created_by' => $request->user()?->id,
        ]);

        $message = 'Application created successfully.';
        if ($paperEnrol) {
            if ($student) {
                $message = 'Paper enrolment complete — student is now in the selected class, stream, and house.';
            } elseif ($paperData && $paperData['paper_decision'] === 'approved') {
                $message = 'Application and decision saved. Enrolment pending physical file receipt.';
            } else {
                $message = 'Application and decision saved.';
            }
        }

        $application->load([
            'academicYear', 'classApplied', 'parents', 'documents',
            'decisions.approvedClass:id,name', 'decisions.house:id,name',
            'student.currentClass', 'student.currentClassStream.stream',
            'student.house', 'student.academicYear',
        ]);

        return response()->json([
            'success' => true,
            'message' => $message,
            'enrolled' => $student !== null,
            'data' => $application,
        ], 201);
    }

    /* ============================================================ UPDATE */
    public function update(Request $request, AdmissionApplication $application)
    {
        $validated = $this->validateApplicationPayload($request);

        $userRole = $request->user()?->role;
        $canEditPrincipal = in_array($userRole, ['headteacher', 'principal', 'administrator'], true);

        DB::transaction(function () use ($application, $validated, $canEditPrincipal) {
            if (!empty($validated['academic_year_id'])) $application->academic_year_id = $validated['academic_year_id'];
            $resolved = $this->resolveClassId($validated);
            if ($resolved !== null) $application->class_applied_id = $resolved;
            if (array_key_exists('contact_email', $validated)) $application->contact_email = $validated['contact_email'];

            $s = $validated['student'] ?? [];
            $application->fill([
                'legal_first_name' => $s['legal_first_name'] ?? null,
                'middle_name' => $s['middle_name'] ?? null,
                'legal_surname' => $s['legal_surname'] ?? null,
                'date_of_birth' => $this->normalizeDate($s['date_of_birth'] ?? null),
                'gender' => $s['gender'] ?? null,
                'blood_group' => $s['blood_group'] ?? null,
                'weight_kg' => $s['weight_kg'] ?? null,
                'height_cm' => $s['height_cm'] ?? null,
                'first_language' => $s['first_language'] ?? null,
                'nationality' => $s['nationality'] ?? null,
                'religion' => $s['religion'] ?? null,
                'emergency_contact' => $s['emergency_contact'] ?? null,
                'family_member_count' => $s['family_member_count'] ?? null,
                'student_lives_with' => $s['student_lives_with'] ?? null,
                'children_at_mount_view' => $s['children_at_mount_view'] ?? null,
                'siblings_at_mount_view' => $s['siblings_at_mount_view'] ?? null,
                'email_with_mount_view' => $s['email_with_mount_view'] ?? null,
                'physical_address' => $s['physical_address'] ?? null,
                'medical_conditions' => $s['medical_conditions'] ?? null,
                'allergies' => $s['allergies'] ?? null,
                'learning_needs' => $s['learning_needs'] ?? null,
                'family_doctor_name' => $s['family_doctor_name'] ?? null,
                'family_doctor_phone' => $s['family_doctor_phone'] ?? null,
                'previous_school_name' => $s['previous_school_name'] ?? null,
                'previous_school_address' => $s['previous_school_address'] ?? null,
                'previous_class' => $s['previous_class'] ?? null,
                'previous_year' => $s['previous_year'] ?? null,
                'previous_school_contact' => $s['previous_school_contact'] ?? null,
                'previous_school_country' => $s['previous_school_country'] ?? null,
                'previous_school_language' => $s['previous_school_language'] ?? null,
            ]);

            if (array_key_exists('source', $validated)) $application->source = $validated['source'];
            if (array_key_exists('physical_file_status', $validated)) $application->physical_file_status = $validated['physical_file_status'];
            if ($canEditPrincipal && array_key_exists('principal_comments', $validated)) {
                $application->principal_comments = $validated['principal_comments'];
            }

            if (!empty($validated['status'])) {
                $new = $validated['status'];
                if (!$application->submitted && $application->status === 'draft' && $new !== 'draft') {
                    $application->submitted = true;
                    $application->submitted_at = now();
                }
                $application->status = $new;
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
            'decisions.decidedBy:id,name', 'decisions.approvedClass:id,name',
            'decisions.house:id,name,colour', 'decisions.academicYear:id,name',
            'comments.user:id,name',
            'student.currentClass', 'student.currentClassStream.stream',
            'student.house', 'student.academicYear',
        ]);

        return response()->json(['success' => true, 'message' => 'Application updated successfully.', 'data' => $application]);
    }

    /* ============================================================ DOCUMENTS */
    public function verifyDocument(Request $request, AdmissionApplication $application, ApplicationDocument $document)
    {
        abort_unless($document->admission_application_id === $application->id, 404);

        $validated = $request->validate([
            'verification_status' => ['required', Rule::in(['pending', 'verified', 'rejected'])],
            'physical_received' => ['nullable', 'boolean'],
            'verification_notes' => ['nullable', 'string'],
        ]);

        $physical = $validated['physical_received'] ?? $document->physical_received;

        $document->update([
            'verification_status' => $validated['verification_status'],
            'physical_received' => $physical,
            'physical_received_at' => $physical ? ($document->physical_received_at ?: now()) : null,
            'verification_notes' => $validated['verification_notes'] ?? null,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        $this->audit('verify_document', $application, ['document_id' => $document->id, 'status' => $validated['verification_status']]);

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

    /* ============================================================ ASSESSMENTS */
    public function scheduleAssessment(Request $request, AdmissionApplication $application)
    {
        $validated = $request->validate([
            'assessment_date' => ['nullable', 'date'],
            'assessment_time' => ['nullable', 'date_format:H:i'],
            'location' => ['nullable', 'string', 'max:255'],
            'assessor_id' => ['nullable', 'integer', 'exists:users,id'],
            'assessment_type' => ['nullable', 'string', 'max:255'],
        ]);

        $validated['assessment_date'] = $validated['assessment_date'] ?? now()->toDateString();

        $assessment = $application->assessments()->create($validated);
        $application->update(['status' => 'assessment_scheduled']);

        $this->audit('assessment_scheduled', $application, ['assessment_id' => $assessment->id]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment scheduled successfully.',
            'data' => $assessment,
        ]);
    }

    public function completeAssessment(Request $request, Assessment $assessment)
    {
        $validated = $request->validate([
            'result' => ['required', Rule::in(['pass', 'fail', 'pending', 'recommended', 'not_recommended'])],
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
                foreach ($validated['results'] ?? [] as $r) $assessment->results()->create($r);
            }
            $assessment->application()->update(['status' => 'assessment_completed']);
        });

        $application = $assessment->application;

        if (in_array($validated['result'], ['pass', 'recommended'], true)) {
            $headteachers = \App\Models\User::where('is_active', true)
                ->whereIn('role', ['headteacher', 'principal'])->get();
            foreach ($headteachers as $ht) {
                try { $ht->notify(new AssessmentPassedNotification($application)); }
                catch (\Throwable $e) { Log::error('Assessment notification failed', ['user_id' => $ht->id, 'error' => $e->getMessage()]); }
            }
        }

        $this->audit('assessment_completed', $application, ['assessment_id' => $assessment->id]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment completed successfully.',
            'data' => $assessment->fresh()->load('results'),
        ]);
    }

    /* ============================================================ DECISIONS */
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
            return response()->json(['success' => false, 'message' => 'An approved class is required when approving.'], 422);
        }

        $decision = DB::transaction(function () use ($request, $application, $validated) {
            $d = $application->decisions()->create([
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
            return $d;
        });

        $this->audit('admission_decision', $application, ['decision' => $validated['decision']]);

        return response()->json([
            'success' => true,
            'message' => 'Admission decision recorded successfully.',
            'data' => $decision->load('approvedClass', 'house', 'academicYear', 'decidedBy:id,name'),
        ]);
    }

    public function updateDecision(Request $request, AdmissionApplication $application, AdmissionDecision $decision)
    {
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
            return response()->json(['success' => false, 'message' => 'An approved class is required when approving.'], 422);
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

        $this->audit('admission_decision_updated', $application, ['decision_id' => $decision->id]);

        return response()->json([
            'success' => true,
            'message' => 'Decision updated successfully.',
            'data' => $decision->fresh()->load('approvedClass', 'house', 'academicYear', 'decidedBy:id,name'),
        ]);
    }

    public function destroyDecision(AdmissionApplication $application, AdmissionDecision $decision)
    {
        abort_unless($decision->admission_application_id === $application->id, 404);
        $decision->delete();
        $this->audit('admission_decision_deleted', $application, ['decision_id' => $decision->id]);
        return response()->json(['success' => true, 'message' => 'Decision deleted successfully.']);
    }

    /* ============================================================ ENROL (new student, auto-balance optional) */
    public function enrol(Request $request, AdmissionApplication $application)
    {
        if ($application->physical_file_status === 'pending') {
            return response()->json([
                'success' => false,
                'code' => 'PHYSICAL_FILE_PENDING',
                'message' => 'Enrolment blocked. Mark the physical file as received first.',
            ], 422);
        }

        if ($application->status !== 'approved') {
            return response()->json(['success' => false, 'message' => 'Only approved applications can be enrolled.'], 422);
        }

        if ($application->student) {
            return response()->json(['success' => true, 'message' => 'Student already exists.', 'data' => $application->student], 200);
        }

        $validated = $request->validate([
            'class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'class_stream_id' => ['nullable', 'integer', 'exists:class_streams,id'],
            'house_id' => ['nullable', 'integer', 'exists:houses,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'auto_assign' => ['nullable', 'boolean'],
        ]);

        $classId = $validated['class_id'] ?? $application->class_applied_id;
        if (!$classId) {
            return response()->json(['success' => false, 'message' => 'A class is required.'], 422);
        }

        $classStreamId = $validated['class_stream_id'] ?? null;
        $houseId = $validated['house_id'] ?? null;
        $autoAssign = (bool) ($validated['auto_assign'] ?? false);

        if ($autoAssign && (!$classStreamId || !$houseId)) {
            $auto = $this->calculateBalancedAssignment(
                (int) $classId,
                $application->gender,
                (int) $validated['academic_year_id']
            );
            $classStreamId = $classStreamId ?? $auto['class_stream_id'];
            $houseId = $houseId ?? $auto['house_id'];
        }

        if (!$classStreamId) {
            return response()->json(['success' => false, 'message' => 'Select a class section, or enable auto-balance.'], 422);
        }
        if (!$houseId) {
            return response()->json(['success' => false, 'message' => 'Select a house, or enable auto-balance.'], 422);
        }

        $stream = ClassStream::find($classStreamId);
        if (!$stream || $stream->school_class_id !== (int) $classId) {
            return response()->json(['success' => false, 'message' => 'The selected section does not belong to the chosen class.'], 422);
        }

        $student = DB::transaction(fn () => $this->createStudentRecord(
            $application, (int) $classId, (int) $classStreamId, (int) $houseId,
            (int) $validated['academic_year_id']
        ));

        $this->audit('student_enrolled', $application, ['student_id' => $student->id, 'auto_assign' => $autoAssign]);

        return response()->json([
            'success' => true,
            'message' => 'Student enrolled successfully.',
            'data' => $student->load('currentClass', 'currentClassStream.stream', 'house', 'academicYear'),
        ], 201);
    }

    /* ============================================================ PAPER ENROL (fast-track, manual only) */
    public function paperEnrol(Request $request, AdmissionApplication $application)
    {
        if ($application->physical_file_status === 'pending') {
            return response()->json([
                'success' => false,
                'code' => 'PHYSICAL_FILE_PENDING',
                'message' => 'Enrolment blocked. Mark the physical file as received first.',
            ], 422);
        }

        if ($application->student) {
            return response()->json(['success' => true, 'message' => 'Student already exists.', 'data' => $application->student], 200);
        }

        $validated = $request->validate([
            'decision' => ['required', 'in:approved,denied,waitlisted'],
            'class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'class_stream_id' => ['nullable', 'integer', 'exists:class_streams,id'],
            'house_id' => ['nullable', 'integer', 'exists:houses,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'comments' => ['nullable', 'string'],
            'principal_comments' => ['nullable', 'string'],
        ]);

        $academicYear = \App\Models\AcademicYear::findOrFail($validated['academic_year_id']);
        $classId = $validated['class_id'] ?? $application->class_applied_id;

        if ($validated['decision'] === 'approved') {
            if (!$classId) return response()->json(['success' => false, 'message' => 'A class is required when approving.'], 422);
            if (empty($validated['class_stream_id'])) {
                return response()->json(['success' => false, 'message' => 'Select the class section the student is already in.'], 422);
            }
            if (empty($validated['house_id'])) {
                return response()->json(['success' => false, 'message' => 'Select the house the student is already in.'], 422);
            }
            $stream = ClassStream::find($validated['class_stream_id']);
            if (!$stream || $stream->school_class_id !== (int) $classId) {
                return response()->json(['success' => false, 'message' => 'The selected section does not belong to the chosen class.'], 422);
            }
        }

        $student = DB::transaction(function () use ($application, $validated, $academicYear, $classId) {
            $application->decisions()->create([
                'decision' => $validated['decision'],
                'approved_class_id' => $classId,
                'house_id' => $validated['house_id'] ?? null,
                'academic_year_id' => $academicYear->id,
                'comments' => $validated['comments'] ?? null,
                'principal_comments' => $validated['principal_comments'] ?? null,
                'decision_date' => now(),
                'decided_by' => request()->user()?->id,
            ]);

            $application->update([
                'status' => $validated['decision'],
                'principal_comments' => $validated['principal_comments'] ?? null,
                'submitted' => true,
                'submitted_at' => $application->submitted_at ?? now(),
            ]);

            if ($validated['decision'] !== 'approved') return null;

            return $this->createStudentRecord(
                $application,
                (int) $classId,
                (int) $validated['class_stream_id'],
                (int) $validated['house_id'],
                $academicYear->id
            );
        });

        $this->audit('student_paper_enrolled', $application, ['student_id' => $student?->id, 'manual_assignment' => true]);

        return response()->json([
            'success' => true,
            'message' => $student
                ? 'Paper enrolment complete — student is now in the selected class, stream, and house.'
                : 'Decision recorded.',
            'data' => $student
                ? $student->load('currentClass', 'currentClassStream.stream', 'house', 'academicYear')
                : $application->fresh(),
        ], 201);
    }

    /* ============================================================ REASSIGN */
    public function reassignStudent(Request $request, Student $student)
    {
        $validated = $request->validate([
            'class_stream_id' => ['nullable', 'integer', 'exists:class_streams,id'],
            'house_id' => ['nullable', 'integer', 'exists:houses,id'],
        ]);

        DB::transaction(function () use ($student, $validated) {
            if (!empty($validated['class_stream_id'])) {
                $stream = ClassStream::findOrFail($validated['class_stream_id']);
                $student->update([
                    'current_class_stream_id' => $stream->id,
                    'current_class_id' => $stream->school_class_id,
                ]);
            }
            if (array_key_exists('house_id', $validated)) {
                $student->update(['house_id' => $validated['house_id']]);
            }
        });

        $this->audit('student_reassigned', null, ['student_id' => $student->id]);

        return response()->json([
            'success' => true,
            'message' => 'Student reassigned. Class and house balances have changed.',
            'data' => $student->fresh()->load('currentClass', 'currentClassStream.stream', 'house'),
        ]);
    }

    /* ============================================================ HELPERS */
    private function calculateBalancedAssignment(int $classId, ?string $gender, int $academicYearId): array
    {
        $sections = ClassStream::where('school_class_id', $classId)
            ->where('is_active', true)
            ->withCount([
                'students as gender_count' => function ($q) use ($gender) {
                    $q->where('status', 'active');
                    if ($gender) $q->where('gender', $gender);
                },
                'students as total_count' => fn ($q) => $q->where('status', 'active'),
            ])
            ->orderBy('gender_count')
            ->orderBy('total_count')
            ->get();

        $houses = \App\Models\House::where('is_active', true)
            ->withCount([
                'students as gender_count' => function ($q) use ($gender) {
                    $q->where('status', 'active');
                    if ($gender) $q->where('gender', $gender);
                },
                'students as total_count' => fn ($q) => $q->where('status', 'active'),
            ])
            ->orderBy('gender_count')
            ->orderBy('total_count')
            ->get();

        return [
            'class_stream_id' => $sections->first()?->id,
            'house_id' => $houses->first()?->id,
        ];
    }

    private function createStudentRecord(
        AdmissionApplication $application, int $classId,
        ?int $classStreamId, ?int $houseId, int $academicYearId
    ): Student {
        $year = \App\Models\AcademicYear::findOrFail($academicYearId);
        $yearNumber = preg_replace('/[^0-9]/', '', $year->name) ?: date('Y');
        $count = Student::where('academic_year_id', $year->id)->lockForUpdate()->count() + 1;
        $studentNumber = 'MVIPS-' . $yearNumber . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);

        $student = Student::create([
            'student_number' => $studentNumber,
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
            'current_class_id' => $classId,
            'current_class_stream_id' => $classStreamId,
            'house_id' => $houseId,
            'academic_year_id' => $academicYearId,
            'admission_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        StudentClassHistory::create([
            'student_id' => $student->id,
            'class_id' => $classId,
            'class_stream_id' => $classStreamId,
            'academic_year_id' => $academicYearId,
            'house_id' => $houseId,
            'start_date' => now()->toDateString(),
        ]);

        $application->update(['status' => 'enrolled', 'enrolled_at' => now()]);

        return $student;
    }

    private function resolveClassId(array $validated): ?int
    {
        if (!empty($validated['class_applied_id'])) return (int) $validated['class_applied_id'];
        if (!empty($validated['class_applied_name'])) {
            $c = SchoolClass::firstOrCreate(['name' => $validated['class_applied_name']], ['is_active' => true, 'sort_order' => 99]);
            return (int) $c->id;
        }
        return null;
    }

    private function resolveDecisionForeignKeys(array &$validated): void
    {
        if (empty($validated['approved_class_id']) && !empty($validated['approved_class_name'])) {
            $c = SchoolClass::firstOrCreate(['name' => $validated['approved_class_name']], ['is_active' => true, 'sort_order' => 99]);
            $validated['approved_class_id'] = $c->id;
        }
        if (empty($validated['house_id']) && !empty($validated['house_name'])) {
            $h = \App\Models\House::firstOrCreate(['name' => $validated['house_name']], ['is_active' => true, 'colour' => '#252B68']);
            $validated['house_id'] = $h->id;
        }
    }

    private function validateDateOfBirth(?string $date): ?string
    {
        if (!$date) return null;
        try { $d = Carbon::parse($date); } catch (\Throwable $e) { return 'Invalid date of birth.'; }
        $now = Carbon::now()->startOfDay();
        if ($d->isFuture()) return 'Date of birth cannot be in the future.';
        if ($d->diffInMonths($now) < 12) return 'The student must be at least 12 months old.';
        if ($d->diffInYears($now) > 30) return 'The date of birth is not realistic for an applicant.';
        return null;
    }

    private function validateApplicationPayload(Request $request): array
    {
        $data = $request->validate([
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
            'physical_file_status' => ['nullable', Rule::in(['pending', 'received', 'not_required'])],
            'principal_comments' => ['nullable', 'string'],

            'student' => ['required', 'array'],
            'student.legal_first_name' => ['required', 'string', 'max:255'],
            'student.legal_surname' => ['required', 'string', 'max:255'],
            'student.middle_name' => ['nullable', 'string', 'max:255'],
            'student.date_of_birth' => ['nullable', 'date'],

            // REQUIRED
            'student.gender' => ['required', 'string', 'max:50'],
            'student.first_language' => ['required', 'string', 'max:100'],
            'student.nationality' => ['required', 'string', 'max:100'],
            'student.religion' => ['required', 'string', 'max:100'],

            'student.blood_group' => ['nullable', 'string', 'max:10'],
            'student.weight_kg' => ['nullable', 'numeric'],
            'student.height_cm' => ['nullable', 'numeric'],
            'student.emergency_contact' => ['nullable', 'string', 'max:100'],
            'student.family_member_count' => ['nullable', 'integer', 'min:0'],
            'student.student_lives_with' => ['nullable', 'string', 'max:100'],
            'student.children_at_mount_view' => ['nullable', 'integer', 'min:0'],
            'student.siblings_at_mount_view' => ['nullable', 'array'],
            'student.siblings_at_mount_view.*' => ['nullable', 'string', 'max:255'],
            'student.email_with_mount_view' => ['nullable', 'email', 'max:255'],
            'student.physical_address' => ['nullable', 'string'],

            // Medical: accepts "None" as a valid string
            'student.medical_conditions' => ['nullable', 'string'],
            'student.allergies' => ['nullable', 'string'],
            'student.learning_needs' => ['nullable', 'string'],
            'student.family_doctor_name' => ['nullable', 'string', 'max:255'],
            'student.family_doctor_phone' => ['nullable', 'string', 'max:50'],

            // Previous school: nullable because early-years students may have none
            'student.previous_school_name' => ['nullable', 'string', 'max:255'],
            'student.previous_school_address' => ['nullable', 'string'],
            'student.previous_class' => ['nullable', 'string', 'max:100'],
            'student.previous_year' => ['nullable', 'string', 'max:20'],
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

        $dobError = $this->validateDateOfBirth($data['student']['date_of_birth'] ?? null);
        if ($dobError) {
            throw ValidationException::withMessages(['student.date_of_birth' => $dobError]);
        }

        return $data;
    }

    private function syncParents(AdmissionApplication $application, array $parents): void
    {
        $application->parents()->delete();
        foreach ($parents as $parent) {
            $employerPays = filter_var($parent['employer_pays_fees'] ?? false, FILTER_VALIDATE_BOOLEAN);
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
                'employer_payment_percentage' => $employerPays && isset($parent['employer_payment_percentage']) && $parent['employer_payment_percentage'] !== ''
                    ? (int) $parent['employer_payment_percentage'] : null,
                'physical_address' => $parent['physical_address'] ?? null,
                'postal_address' => $parent['postal_address'] ?? null,
                'emergency_contact' => filter_var($parent['emergency_contact'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'preferred_communication' => $parent['preferred_communication'] ?? null,
                'is_primary' => filter_var($parent['is_primary'] ?? false, FILTER_VALIDATE_BOOLEAN),
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
        $studentName = trim(($application->legal_first_name ?? '') . ' ' . ($application->legal_surname ?? ''));
        $studentSlug = Str::slug($studentName, '_') ?: 'student';
        $labels = [
            'birth_certificate_or_passport' => 'Birth_Certificate_or_Main_Passport_Pages',
            'passport_photograph_1' => 'Passport_Photograph_1',
            'passport_photograph_2' => 'Passport_Photograph_2',
            'school_report' => 'Original_Mark_Sheets_or_School_Report',
        ];
        $typeSlug = $labels[$document->document_type] ?? Str::slug($document->document_type, '_');
        $ext = strtolower(pathinfo($document->original_name, PATHINFO_EXTENSION)) ?: 'pdf';
        return "{$studentSlug}_{$typeSlug}.{$ext}";
    }

    /* ============================================================ DASHBOARD / NOTIFS */
    public function dashboard()
    {
        $q = AdmissionApplication::whereNotIn('status', ['draft']);
        return response()->json([
            'success' => true,
            'data' => [
                'total' => (clone $q)->count(),
                'submitted' => (clone $q)->where('status', 'submitted')->count(),
                'document_verification' => (clone $q)->where('status', 'document_verification')->count(),
                'assessments_scheduled' => (clone $q)->where('status', 'assessment_scheduled')->count(),
                'assessments_completed' => (clone $q)->where('status', 'assessment_completed')->count(),
                'awaiting_approval' => (clone $q)->where('status', 'principal_review')->count(),
                'approved' => (clone $q)->where('status', 'approved')->count(),
                'denied' => (clone $q)->where('status', 'denied')->count(),
                'waitlisted' => (clone $q)->where('status', 'waitlisted')->count(),
                'enrolled' => (clone $q)->where('status', 'enrolled')->count(),
            ],
        ]);
    }

    public function notifications(Request $request)
    {
        $user = $request->user();
        $notifications = $user->notifications()->orderByDesc('created_at')->limit(30)->get()
            ->map(fn ($n) => [
                'id' => $n->id, 'read_at' => $n->read_at, 'created_at' => $n->created_at,
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
        $n = $request->user()->notifications()->where('id', $id)->first();
        if ($n) $n->markAsRead();
        return response()->json(['success' => true, 'unread_count' => $request->user()->unreadNotifications()->count()]);
    }

    public function markAllNotificationsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true, 'unread_count' => 0]);
    }

    /* ============================================================ COMMENTS */
    public function storeComment(Request $request, AdmissionApplication $application)
    {
        $user = $request->user();
        if (!in_array($user->role, ['administrator', 'principal', 'headteacher'], true)) {
            return response()->json(['success' => false, 'message' => 'Only the headteacher or administrator can comment.'], 403);
        }
        $validated = $request->validate(['body' => ['required', 'string', 'max:5000']]);
        $comment = $application->comments()->create([
            'user_id' => $user->id, 'role_snapshot' => $user->role, 'body' => trim($validated['body']),
        ]);
        $this->audit('comment_added', $application, ['comment_id' => $comment->id]);
        return response()->json([
            'success' => true,
            'message' => 'Comment added.',
            'data' => [
                'id' => $comment->id, 'body' => $comment->body, 'role_snapshot' => $comment->role_snapshot,
                'created_at' => $comment->created_at,
                'author' => ['id' => $user->id, 'name' => $user->name],
            ],
        ], 201);
    }

    public function updateComment(Request $request, AdmissionApplication $application, AdmissionComment $comment)
    {
        abort_unless($comment->admission_application_id === $application->id, 404);
        $user = $request->user();
        if ($comment->user_id !== $user->id && $user->role !== 'administrator') {
            return response()->json(['success' => false, 'message' => 'You can only edit your own comments.'], 403);
        }
        $validated = $request->validate(['body' => ['required', 'string', 'max:5000']]);
        $comment->update(['body' => trim($validated['body'])]);
        return response()->json(['success' => true, 'message' => 'Comment updated.', 'data' => $comment->fresh()->load('user:id,name')]);
    }

    public function destroyComment(Request $request, AdmissionApplication $application, AdmissionComment $comment)
    {
        abort_unless($comment->admission_application_id === $application->id, 404);
        $user = $request->user();
        if ($comment->user_id !== $user->id && $user->role !== 'administrator') {
            return response()->json(['success' => false, 'message' => 'You can only delete your own comments.'], 403);
        }
        $comment->delete();
        return response()->json(['success' => true, 'message' => 'Comment deleted.']);
    }

    /* ============================================================ PRINT */
    public function printApplication(Request $request, AdmissionApplication $application)
    {
        $token = $request->bearerToken() ?: $request->query('token');
        if (!$token) return $this->printErrorPage('Print session missing.', 'No access token was supplied.', 401);
        $personal = PersonalAccessToken::findToken($token);
        if (!$personal) return $this->printErrorPage('Print session expired.', 'Your access token is invalid.', 401);
        $user = $personal->tokenable;
        if (!$user || !$user->is_active) return $this->printErrorPage('Account inactive.', 'Your account is inactive.', 401);
        if (!in_array($user->role, ['administrator', 'admissions_officer', 'principal', 'headteacher'], true)) {
            return $this->printErrorPage('Access denied.', 'You do not have permission to print.', 403);
        }

        $application->load([
            'academicYear', 'classApplied', 'parents',
            'documents.verifiedBy:id,name',
            'assessments.results', 'assessments.assessor:id,name',
            'decisions.decidedBy:id,name', 'decisions.approvedClass:id,name',
            'decisions.house:id,name,colour', 'decisions.academicYear:id,name',
            'termsAcceptances.termsCondition', 'comments.user:id,name',
            'student.currentClass', 'student.currentClassStream.stream',
            'student.house', 'student.academicYear',
        ]);

        return response($this->buildPrintHtml($application))->header('Content-Type', 'text/html; charset=utf-8');
    }

    private function printErrorPage(string $heading, string $message, int $status)
    {
        $e = fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
        $html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' . $e($heading) .
            '</title><style>body{font-family:Arial;padding:40px;background:#f8fafc;color:#172033}' .
            '.card{max-width:480px;margin:40px auto;border:1px solid #e2e8f0;border-radius:16px;padding:24px;background:#fff}' .
            'h1{color:#252B68;font-size:20px;margin:0 0 8px}p{color:#4b5563;font-size:14px;line-height:1.5;margin:0}' .
            '.brand{color:#F58220;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}' .
            '</style></head><body><div class="card"><div class="brand">Mount View Admin</div>' .
            '<h1>' . $e($heading) . '</h1><p>' . $e($message) . '</p></div></body></html>';
        return response($html, $status)->header('Content-Type', 'text/html; charset=utf-8');
    }

    private function getLogoBase64(): ?string
    {
        foreach ([public_path('logo.jpg'), public_path('logo.png'), public_path('images/logo.jpg'), public_path('images/logo.png'), storage_path('app/public/logo.jpg'), storage_path('app/public/logo.png')] as $path) {
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
        $e = fn ($v) => htmlspecialchars((string) ($v ?? ''), ENT_QUOTES, 'UTF-8');
        $fmtDate = fn ($v) => $v ? Carbon::parse($v)->format('d M Y') : '—';
        $fmtDT = fn ($v) => $v ? Carbon::parse($v)->format('d M Y, H:i') : '—';

        $logo = $this->getLogoBase64();
        $logoHtml = $logo ? '<img src="' . $logo . '" alt="Mount View" class="header-logo">' : '';
        $watermarkHtml = $logo ? '<div class="watermark"><img src="' . $logo . '" alt=""></div>' : '';

        $photo = $this->getLocalFileBase64($application->student_photo_path);
        $photoHtml = $photo
            ? '<img src="' . $photo . '" alt="" class="student-photo">'
            : '<div class="student-photo placeholder">No photograph</div>';

        $rows = function (array $pairs) use ($e) {
            $h = '';
            foreach ($pairs as $l => $v) {
                $h .= '<tr><th>' . $e($l) . '</th><td>' . ($v === '' || $v === null ? '—' : $e($v)) . '</td></tr>';
            }
            return $h;
        };

        $fullName = trim(($application->legal_first_name ?? '') . ' ' . ($application->middle_name ?? '') . ' ' . ($application->legal_surname ?? ''));
        $appNum = $e($application->application_number);
        $statusLabel = $e(ucfirst(str_replace('_', ' ', $application->status ?? '')));
        $classApplied = $application->classApplied?->name;
        $academicYear = $application->academicYear?->name;
        $submittedAt = $e($fmtDT($application->submitted_at));
        $generatedAt = $e(now()->format('d M Y, H:i'));
        $siblingsText = is_array($application->siblings_at_mount_view) ? implode(', ', $application->siblings_at_mount_view) : null;

        $studentRows = $rows([
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
            'Class Applied For' => $classApplied,
            'Academic Year' => $academicYear,
            'Physical Address' => $application->physical_address,
        ]);

        $medicalRows = $rows([
            'Medical Conditions' => $application->medical_conditions,
            'Allergies' => $application->allergies,
            'Learning Needs' => $application->learning_needs,
            'Family Doctor' => $application->family_doctor_name,
            'Family Doctor Phone' => $application->family_doctor_phone,
        ]);

        $prevSchoolRows = $rows([
            'School Name' => $application->previous_school_name,
            'Country' => $application->previous_school_country,
            'Instructional Language' => $application->previous_school_language,
            'School Address' => $application->previous_school_address,
            'Previous Class' => $application->previous_class,
            'Previous Year' => $application->previous_year,
            'School Contact' => $application->previous_school_contact,
        ]);

        $docLabels = [
            'birth_certificate_or_passport' => 'Birth Certificate or Main Passport Pages',
            'passport_photograph_1' => 'Passport Photograph 1',
            'passport_photograph_2' => 'Passport Photograph 2',
            'school_report' => 'Original Mark Sheets / School Report',
        ];

        $parentsHtml = $application->parents->isEmpty()
            ? '<tr><td colspan="4" class="empty">No parents recorded.</td></tr>'
            : $application->parents->map(function ($p) use ($e) {
                $phone = $p->phone_number ?: $p->phone;
                return '<tr><td>' . $e($p->full_name) . '</td><td>' . $e($p->relationship) . '</td>' .
                    '<td>' . $e($phone) . '</td><td>' . $e($p->email) . '</td></tr>';
            })->implode('');

        $docsHtml = $application->documents->isEmpty()
            ? '<tr><td colspan="7" class="empty">No documents.</td></tr>'
            : $application->documents->map(function ($d) use ($e, $docLabels, $fmtDT) {
                $label = $docLabels[$d->document_type] ?? $d->document_type;
                $size = $d->file_size ? number_format($d->file_size / 1024, 1) . ' KB' : '—';
                return '<tr><td>' . $e($label) . '</td><td>' . $e($d->original_name) . '</td>' .
                    '<td>' . $e($size) . '</td><td>' . $e(ucfirst($d->verification_status ?? 'pending')) . '</td>' .
                    '<td>' . ($d->physical_received ? 'Yes' : 'No') . '</td><td>' . $e($d->verifiedBy?->name) . '</td>' .
                    '<td>' . $e($fmtDT($d->verified_at)) . '</td></tr>';
            })->implode('');

        $assessHtml = $application->assessments->isEmpty()
            ? '<p class="empty">No assessments.</p>'
            : $application->assessments->map(function ($a) use ($fmtDate, $rows) {
                return '<div class="assessment-block"><table class="data">' . $rows([
                    'Type' => $a->assessment_type ?: 'Assessment',
                    'Date' => $fmtDate($a->assessment_date),
                    'Time' => $a->assessment_time,
                    'Location' => $a->location,
                    'Assessor' => $a->assessor?->name,
                    'Result' => $a->result ? ucfirst(str_replace('_', ' ', $a->result)) : null,
                    'Comments' => $a->comments,
                    'Recommendation' => $a->recommendation,
                ]) . '</table></div>';
            })->implode('');

        $decisionsHtml = $application->decisions->isEmpty()
            ? '<p class="empty">No decision.</p>'
            : $application->decisions->map(function ($d) use ($fmtDT, $rows) {
                return '<table class="data">' . $rows([
                    'Decision' => ucfirst($d->decision),
                    'Decision Date' => $fmtDT($d->decision_date),
                    'Decided By' => $d->decidedBy?->name,
                    'Approved Class' => $d->approvedClass?->name,
                    'House' => $d->house?->name,
                    'Academic Year' => $d->academicYear?->name,
                    'Comments' => $d->comments,
                ]) . '</table>';
            })->implode('');

        $studentRecord = '';
        if ($application->student) {
            $s = $application->student;
            $rowsHtml = $rows([
                'Student Number' => $s->student_number,
                'Current Class' => $s->currentClass?->name,
                'Section / Stream' => $s->currentClassStream?->name,
                'House' => $s->house?->name,
                'Academic Year' => $s->academicYear?->name,
                'Admission Date' => $fmtDate($s->admission_date),
                'Status' => $s->status,
            ]);
            $studentRecord = '<h2 class="section">Enrolled Student Record</h2><table class="data">' . $rowsHtml . '</table>';
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Application {$appNum}</title>
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
      {$logoHtml}
      <div class="brand-text"><h1>Mount View International</h1><p>Primary School · Admission Application</p></div>
    </div>
    <div class="ref">Application Number<strong>{$appNum}</strong>Submitted: {$submittedAt}</div>
  </div>

  <div class="summary">
    {$photoHtml}
    <div class="summary-meta">
      <h2>{$e($fullName)}</h2>
      <div class="summary-grid">
        <div><strong>Status</strong>{$statusLabel}</div>
        <div><strong>Class Applied For</strong>{$e($classApplied)}</div>
        <div><strong>Academic Year</strong>{$e($academicYear)}</div>
        <div><strong>Submitted</strong>{$submittedAt}</div>
      </div>
    </div>
  </div>

  <h2 class="section">Student Information</h2>
  <table class="data">{$studentRows}</table>

  <h2 class="section">Medical Information</h2>
  <table class="data">{$medicalRows}</table>

  <h2 class="section">Parents / Guardians</h2>
  <table>
    <thead><tr><th style="width:28%">Full Name</th><th style="width:22%">Relationship</th><th style="width:24%">Phone</th><th style="width:26%">Email</th></tr></thead>
    <tbody>{$parentsHtml}</tbody>
  </table>

  <h2 class="section">Previous School</h2>
  <table class="data">{$prevSchoolRows}</table>

  <h2 class="section">Documents</h2>
  <table>
    <thead><tr>
      <th style="width:26%">Document</th><th style="width:20%">File</th><th style="width:9%">Size</th>
      <th style="width:11%">Status</th><th style="width:10%">Physical</th>
      <th style="width:12%">Verified By</th><th style="width:12%">Verified At</th>
    </tr></thead>
    <tbody>{$docsHtml}</tbody>
  </table>

  <h2 class="section">Assessments</h2>
  {$assessHtml}

  <h2 class="section">Admission Decision</h2>
  {$decisionsHtml}

  {$studentRecord}

  <div class="footer">
    <span>Generated on {$generatedAt}</span>
    <span>Mount View International Primary School</span>
  </div>
</div>
<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 400); });</script>
</body>
</html>
HTML;
    }

    private function audit(string $action, ?AdmissionApplication $application = null, array $metadata = []): void
    {
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