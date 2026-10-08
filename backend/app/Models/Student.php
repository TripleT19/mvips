<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model {
    use HasFactory;
    protected $fillable = ['student_number','admission_application_id','first_name','middle_name','surname','date_of_birth','gender','blood_group','nationality','first_language','religion','photo_path','current_class_id','house_id','academic_year_id','admission_date','status'];
    protected $casts = ['date_of_birth'=>'date','admission_date'=>'date'];
    public function application(): BelongsTo { return $this->belongsTo(AdmissionApplication::class,'admission_application_id'); }
    public function currentClass(): BelongsTo { return $this->belongsTo(SchoolClass::class,'current_class_id'); }
    public function house(): BelongsTo { return $this->belongsTo(House::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function classHistory(): HasMany { return $this->hasMany(StudentClassHistory::class); }
}
