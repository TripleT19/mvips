<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Strand extends Model
{
    protected $fillable = ['subject_id', 'name', 'order', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }

    public function objectives(): HasMany
    {
        return $this->hasMany(AssessmentObjective::class)->orderBy('order');
    }
}