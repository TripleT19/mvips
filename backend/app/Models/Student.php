<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Student extends Model
{
    use HasFactory;

    /**
     * `slug` is deliberately NOT in $fillable — it is generated once by
     * booted() and never overwritten through mass assignment. If a name
     * is corrected later, the URL keeps the original spelling so that
     * parent bookmarks continue to work.
     */
    protected $fillable = [
        'student_number',
        'admission_application_id',
        'first_name',
        'middle_name',
        'surname',
        'date_of_birth',
        'gender',
        'blood_group',
        'nationality',
        'first_language',
        'religion',
        'photo_path',
        'current_class_id',
        'current_class_stream_id',
        'house_id',
        'academic_year_id',
        'admission_date',
        'status',
    ];

    protected $casts = [
        'date_of_birth'  => 'date',
        'admission_date' => 'date',
    ];

    protected static function booted(): void
    {
        static::created(function (Student $student) {
            if (!empty($student->slug)) return;

            $base = Str::slug(trim(
                "{$student->first_name} {$student->middle_name} {$student->surname}"
            ));

            if ($base === '') {
                $base = 'student';
            }

            $student->forceFill(['slug' => "{$base}-{$student->id}"])->saveQuietly();
        });
    }

    /* ============================================================
     * RELATIONS
     * ============================================================ */

    public function application(): BelongsTo
    {
        return $this->belongsTo(AdmissionApplication::class, 'admission_application_id');
    }

    public function currentClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'current_class_id');
    }

    public function currentClassStream(): BelongsTo
    {
        return $this->belongsTo(ClassStream::class, 'current_class_stream_id');
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function classHistory(): HasMany
    {
        return $this->hasMany(StudentClassHistory::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    /**
     * Parent / guardian accounts linked to this student.
     * Pivot: student_guardian { relationship, is_primary }
     */
    public function guardians()
    {
        return $this->belongsToMany(User::class, 'student_guardian', 'student_id', 'user_id')
            ->withPivot(['relationship', 'is_primary'])
            ->withTimestamps();
    }
}