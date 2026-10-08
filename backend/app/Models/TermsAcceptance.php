<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TermsAcceptance extends Model {
    use HasFactory;
    protected $fillable = ['admission_application_id','terms_condition_id','parent_guardian_name','accepted','accepted_at'];
    protected $casts = ['accepted'=>'boolean','accepted_at'=>'datetime'];
    public function application(): BelongsTo { return $this->belongsTo(AdmissionApplication::class,'admission_application_id'); }
    public function termsCondition(): BelongsTo { return $this->belongsTo(TermsCondition::class); }
}
