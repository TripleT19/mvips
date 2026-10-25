<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassStream extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_class_id',
        'stream_id',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function teacherAssignments(): HasMany
    {
        return $this->hasMany(TeacherAssignment::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'current_class_stream_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function attendanceRegisters(): HasMany
    {
        return $this->hasMany(AttendanceRegister::class)->orderByDesc('date');
    }
}