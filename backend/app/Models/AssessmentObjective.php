<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentObjective extends Model
{
    protected $fillable = [
        'strand_id', 'subject_id', 'school_class_id', 'term_id',
        'academic_year_id', 'name', 'description', 'order',
        'is_active', 'created_by',
    ];
    protected $casts = ['is_active' => 'boolean'];

    public function strand(): BelongsTo { return $this->belongsTo(Strand::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function schoolClass(): BelongsTo { return $this->belongsTo(SchoolClass::class); }
    public function term(): BelongsTo { return $this->belongsTo(Term::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function results(): HasMany { return $this->hasMany(AssessmentObjectiveResult::class); }
}