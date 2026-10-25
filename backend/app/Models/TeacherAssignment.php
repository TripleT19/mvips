<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherAssignment extends Model
{
    use HasFactory;

    public const ROLE_CLASS_TEACHER = 'class_teacher';
    public const ROLE_LEAD_TEACHER = 'lead_teacher';
    public const ROLE_SUBJECT_TEACHER = 'subject_teacher';
    public const ROLE_ASSISTANT_TEACHER = 'assistant_teacher';
    public const ROLE_CLUB_LEAD = 'club_lead';

    protected $fillable = [
        'academic_year_id',
        'user_id',
        'role',
        'school_class_id',
        'class_stream_id', 
        'subject_id',
        'club_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function classStream(): BelongsTo
    {
        return $this->belongsTo(ClassStream::class);
    }
}