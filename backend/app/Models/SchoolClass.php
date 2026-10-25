<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'school_classes';

    protected $fillable = ['name', 'code', 'sort_order', 'is_active'];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function applications(): HasMany
    {
        return $this->hasMany(AdmissionApplication::class, 'class_applied_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'current_class_id');
    }

    public function classStreams(): HasMany
    {
        return $this->hasMany(ClassStream::class, 'school_class_id')
            ->orderBy('name');
    }

    public function activeClassStreams(): HasMany
    {
        return $this->classStreams()->where('is_active', true);
    }

    /** Streams directly attached to this class. */
    public function streams(): BelongsToMany
    {
        return $this->belongsToMany(
            Stream::class,
            'class_streams',
            'school_class_id',
            'stream_id'
        )->withPivot('id', 'name', 'is_active')->withTimestamps();
    }

    public function teacherAssignments(): HasMany
    {
        return $this->hasMany(TeacherAssignment::class, 'school_class_id');
    }
}