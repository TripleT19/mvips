<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assessment extends Model {
    use HasFactory;
    protected $fillable = ['admission_application_id','assessment_date','assessment_time','location','assessor_id','assessment_type','result','comments','recommendation'];
    protected $casts = ['assessment_date'=>'date'];
    public function application(): BelongsTo { return $this->belongsTo(AdmissionApplication::class,'admission_application_id'); }
    public function assessor(): BelongsTo { return $this->belongsTo(User::class,'assessor_id'); }
    public function results(): HasMany { return $this->hasMany(AssessmentResult::class); }
}
