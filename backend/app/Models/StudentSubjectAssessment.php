<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentSubjectAssessment extends Model
{
    protected $fillable = [
        'student_id','subject_id','class_stream_id','term_id','academic_year_id',
        'effort_shown','teacher_observation','scored_marks','assessed_by',
    ];
    protected $casts = ['scored_marks' => 'decimal:2'];
}