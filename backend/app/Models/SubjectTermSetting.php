<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubjectTermSetting extends Model
{
    protected $fillable = [
        'subject_id', 'school_class_id', 'term_id', 'academic_year_id',
        'total_marks', 'is_specialist',
    ];

    protected $casts = [
        'is_specialist' => 'boolean',
    ];

    /* ============================================================
     * FACTORY
     * ============================================================ */

    /**
     * Get (or lazily create) the settings row for a subject in a
     * given class + term + academic year.
     *
     * The default `total_marks` is seeded from `subjects.max_marks`
     * so a newly-created structure respects whatever the admin set
     * on the subject record. Falls back to 100 if the subject has
     * no `max_marks` (older data).
     */
    public static function forScope(
        int $subjectId,
        int $classId,
        int $termId,
        int $yearId
    ): self {
        $row = static::where('subject_id', $subjectId)
            ->where('school_class_id', $classId)
            ->where('term_id', $termId)
            ->where('academic_year_id', $yearId)
            ->first();

        if ($row) {
            return $row;
        }

        $subject = Subject::find($subjectId);

        $defaultMarks = $subject
            ? (int) ($subject->max_marks ?? 100)
            : 100;

        $isSpecialist = $subject
            ? ($subject->subject_group ?? 'core') === 'specialist'
            : false;

        return static::create([
            'subject_id'       => $subjectId,
            'school_class_id'  => $classId,
            'term_id'          => $termId,
            'academic_year_id' => $yearId,
            'total_marks'      => $defaultMarks,
            'is_specialist'    => $isSpecialist,
        ]);
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    /**
     * The total marks currently in force — always prefers the live
     * `subjects.max_marks` if present, so editing a subject's marks
     * is reflected immediately even when a stale settings row exists.
     */
    public function effectiveTotalMarks(?Subject $subject = null): int
    {
        $subject = $subject ?? $this->relationLoaded('subject')
            ? $this->subject
            : Subject::find($this->subject_id);

        if ($subject && $subject->max_marks !== null) {
            return (int) $subject->max_marks;
        }

        return (int) $this->total_marks;
    }

    /* ============================================================
     * RELATIONSHIPS
     * ============================================================ */

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function term()
    {
        return $this->belongsTo(AcademicTerm::class, 'term_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}