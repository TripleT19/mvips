<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TermReportSubmission extends Model
{
    public const STATUS_DRAFT     = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_HELD      = 'held';

    protected $fillable = [
        'student_id', 'class_stream_id', 'term_id', 'academic_year_id',
        'status', 'submitted_at', 'submitted_by',
        'published_at', 'published_by',
        'hold_reason', 'fees_balance_at_publish',
    ];

    protected $casts = [
        'submitted_at'            => 'datetime',
        'published_at'            => 'datetime',
        'fees_balance_at_publish' => 'decimal:2',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function classStream(): BelongsTo { return $this->belongsTo(ClassStream::class); }
    public function term(): BelongsTo { return $this->belongsTo(AcademicTerm::class, 'term_id'); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function submittedBy(): BelongsTo { return $this->belongsTo(User::class, 'submitted_by'); }
    public function publishedBy(): BelongsTo { return $this->belongsTo(User::class, 'published_by'); }

    public function isLocked(): bool
    {
        return in_array($this->status, [self::STATUS_SUBMITTED, self::STATUS_PUBLISHED, self::STATUS_HELD], true);
    }
}