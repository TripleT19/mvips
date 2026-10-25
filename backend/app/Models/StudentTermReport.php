<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentTermReport extends Model
{
    protected $fillable = [
        'student_id','class_stream_id','term_id','academic_year_id',
        'traits','class_teacher_observation','skill_enhancement_club',
    ];
    protected $casts = ['traits' => 'array'];
}