<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'admission_application_id',
        'document_type',
        'original_name',
        'file_path',
        'mime_type',
        'file_size',
        'physical_received',
        'physical_received_at',
        'verification_status',
        'verified_by',
        'verified_at',
        'verification_notes',
    ];

    protected $casts = [
        'physical_received' => 'boolean',
        'physical_received_at' => 'datetime',
        'verified_at' => 'datetime',
        'file_size' => 'integer',
    ];

    protected $hidden = [
        'file_path',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(
            AdmissionApplication::class,
            'admission_application_id'
        );
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'verified_by'
        );
    }
}
