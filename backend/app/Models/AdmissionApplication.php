<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

class AdmissionApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'contact_email',
        'application_number',
        'tracking_token_hash',
        'academic_year_id',
        'class_applied_id',

        'legal_first_name',
        'middle_name',
        'legal_surname',
        'date_of_birth',
        'gender',
        'blood_group',

        'weight_kg',
        'height_cm',
        'first_language',
        'nationality',
        'religion',
        'emergency_contact',

        'family_member_count',
        'student_lives_with',
        'children_at_mount_view',
        'email_with_mount_view',
        'physical_address',

        'student_photo_path',

        'previous_school_name',
        'previous_school_address',
        'previous_class',
        'previous_year',
        'reason_for_leaving',
        'previous_school_contact',

        'status',
        'source',

        'parent_notes',
        'admissions_notes',
        'principal_comments',
        'administrator_comments',

        'submitted',
        'submitted_at',
        'physical_file_status',
        'physical_file_received_at',
        'enrolled_at',

        'siblings_at_mount_view',
        'medical_conditions',
        'allergies',
        'learning_needs',
        'family_doctor_name',
        'family_doctor_phone',
        'previous_school_country',
        'previous_school_language',
    ];

    protected $hidden = [
        'tracking_token_hash',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'weight_kg' => 'decimal:2',
        'height_cm' => 'decimal:2',
        'family_member_count' => 'integer',
        'children_at_mount_view' => 'integer',
        'submitted' => 'boolean',
        'submitted_at' => 'datetime',
        'physical_file_received_at' => 'datetime',
        'enrolled_at' => 'datetime',
        'siblings_at_mount_view' => 'array',
    ];

    protected $appends = [
        'student_photo_url',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function classApplied(): BelongsTo
    {
        return $this->belongsTo(
            SchoolClass::class,
            'class_applied_id'
        );
    }

    public function parents(): HasMany
    {
        return $this->hasMany(ApplicationParent::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class);
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }

    public function decisions(): HasMany
    {
        return $this->hasMany(AdmissionDecision::class);
    }

    public function termsAcceptances(): HasMany
    {
        return $this->hasMany(TermsAcceptance::class);
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function getStudentPhotoUrlAttribute(): ?string
    {
        return $this->student_photo_path
            ? Storage::disk('public')->url($this->student_photo_path)
            : null;
    }

    public function comments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AdmissionComment::class)
            ->orderByDesc('created_at');
    }
}