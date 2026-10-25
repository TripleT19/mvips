<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentWeeklyTest extends Model
{
    protected $fillable = [
        'student_id','class_stream_id','term_id','academic_year_id',
        'test_type','week_number','score','max_score',
    ];
    protected $casts = ['score' => 'decimal:2', 'max_score' => 'decimal:2'];
}