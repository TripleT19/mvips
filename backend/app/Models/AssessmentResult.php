<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentResult extends Model {
    use HasFactory;
    protected $fillable = ['assessment_id','area','score','maximum_score','comments'];
    protected $casts = ['score'=>'decimal:2','maximum_score'=>'decimal:2'];
    public function assessment(): BelongsTo { return $this->belongsTo(Assessment::class); }
}
