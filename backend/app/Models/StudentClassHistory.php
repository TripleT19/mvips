<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentClassHistory extends Model {
    use HasFactory;
    protected $table = 'student_class_history';
    protected $fillable = ['student_id','class_id','academic_year_id','house_id','start_date','end_date'];
    protected $casts = ['start_date'=>'date','end_date'=>'date'];
    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function schoolClass(): BelongsTo { return $this->belongsTo(SchoolClass::class,'class_id'); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function house(): BelongsTo { return $this->belongsTo(House::class); }
}
