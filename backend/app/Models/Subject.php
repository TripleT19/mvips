<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'subject_group',
        'max_marks',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'max_marks' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function classSubjects(): HasMany
    {
        return $this->hasMany(ClassSubject::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TeacherAssignment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCore($query)
    {
        return $query->where('subject_group', 'core');
    }

    public function scopeSpecialist($query)
    {
        return $query->where('subject_group', 'specialist');
    }


}