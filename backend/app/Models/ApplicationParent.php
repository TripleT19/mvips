<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationParent extends Model {
    use HasFactory;
    protected $fillable = ['admission_application_id','full_name','relationship','phone_number','email','occupation','employer','physical_address','postal_address','emergency_contact','preferred_communication','is_primary', 'position_title',
    'work_address',
    'work_phone',
    'employer_pays_fees',
    'employer_payment_percentage',];
    protected $casts = ['is_primary'=>'boolean', 'employer_pays_fees' => 'boolean',
    'employer_payment_percentage' => 'integer',];
    public function application(): BelongsTo { return $this->belongsTo(AdmissionApplication::class,'admission_application_id'); }
}
