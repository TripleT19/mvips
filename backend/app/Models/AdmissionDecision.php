<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdmissionDecision extends Model {
    use HasFactory;
    protected $fillable = ['admission_application_id','decision','decision_date','decided_by','approved_class_id','house_id','academic_year_id','comments','principal_comments'];
    protected $casts = ['decision_date'=>'datetime'];
    public function application(): BelongsTo { return $this->belongsTo(AdmissionApplication::class,'admission_application_id'); }
    public function decidedBy(): BelongsTo { return $this->belongsTo(User::class,'decided_by'); }
    public function approvedClass(): BelongsTo { return $this->belongsTo(SchoolClass::class,'approved_class_id'); }
    public function house(): BelongsTo { return $this->belongsTo(House::class); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
}
