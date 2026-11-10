<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class TopAchiever extends Model
{
    protected $table = 'top_achievers';

    protected $fillable = [
        'academic_year_id',
        'student_name',
        'student_photo_path',
        'position',
        'subject',
        'english_score',
        'maths_score',
        'science_score',
        'total_score',
        'average_score',
        'note',
        'is_published',
        'created_by',
    ];

    protected $casts = [
        'position'       => 'integer',
        'english_score'  => 'float',
        'maths_score'    => 'float',
        'science_score'  => 'float',
        'total_score'    => 'float',
        'average_score'  => 'float',
        'is_published'   => 'boolean',
    ];

    protected $appends = ['student_photo_url'];

    /** Valid subject keys for subject-level rows. */
    public const SUBJECTS = ['english', 'maths', 'science'];

    protected static function booted(): void
    {
        static::saving(function (self $achiever) {
            if ($achiever->subject === null) {
                // Class level — sum of all three
                $total = (float) $achiever->english_score
                    + (float) $achiever->maths_score
                    + (float) $achiever->science_score;
                $achiever->total_score   = round($total, 2);
                $achiever->average_score = round($total / 3, 2);
            } else {
                // Subject level — only the relevant subject matters
                $score = match ($achiever->subject) {
                    'english' => (float) $achiever->english_score,
                    'maths'   => (float) $achiever->maths_score,
                    'science' => (float) $achiever->science_score,
                    default   => 0,
                };
                $achiever->total_score   = round($score, 2);
                $achiever->average_score = round($score, 2);
            }
        });
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function getStudentPhotoUrlAttribute(): ?string
    {
        if (! $this->student_photo_path) return null;
        return Storage::disk('public')->url($this->student_photo_path);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeClassLevel($query)
    {
        return $query->whereNull('subject');
    }

    public function scopeForSubject($query, string $subject)
    {
        return $query->where('subject', $subject);
    }
}