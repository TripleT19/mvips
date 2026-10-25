<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model {
    use HasFactory;
    protected $fillable = ['name','start_date','end_date','is_current','is_active'];
    protected $casts = ['start_date'=>'date','end_date'=>'date','is_current'=>'boolean','is_active'=>'boolean'];
    public function applications(): HasMany { return $this->hasMany(AdmissionApplication::class); }
    public function teacherAssignments()
    {
        return $this->hasMany(TeacherAssignment::class);
    }

    public function classSubjects()
    {
        return $this->hasMany(ClassSubject::class);
    }
    public function terms()
    {
        return $this->hasMany(AcademicTerm::class);
    }
}
