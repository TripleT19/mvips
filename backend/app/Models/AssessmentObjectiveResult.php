<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentObjectiveResult extends Model
{
    public const RATINGS = ['exceeding', 'high', 'good', 'aspiring', 'basic', 'unclassified'];

    protected $fillable = [
        'assessment_objective_id', 'student_id', 'term_id', 'academic_year_id',
        'rating', 'remarks', 'assessed_by',
    ];

    public function objective(): BelongsTo { return $this->belongsTo(AssessmentObjective::class, 'assessment_objective_id'); }
    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
}