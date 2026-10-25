<?php

namespace App\Support;

class TeacherRoles
{
    /** Class-level roles — own a section, edit all subjects. */
    public const CLASS_LEVEL = [
        'lead_teacher',
        'class_teacher',
        'assistant_teacher',
    ];

    /** Generic classroom roles. */
    public const GENERAL = [
        'teacher',
        'teaching_assistant',
        'ta',
        'stream_lead',
        'club_lead',
    ];

    /** Specialist / subject-scoped teachers. */
    public const SPECIALIST = [
        'specialist',
        'specialist_teacher',
        'special_teacher',
        'spec_teacher',
        'subject_teacher',
        'music_teacher',
        'art_teacher',
        'pe_teacher',
        'sports_teacher',
        'ict_teacher',
        'computing_teacher',
        'computer_teacher',
        'swimming_teacher',
        'dance_teacher',
        'drama_teacher',
        'language_teacher',
        'languages_teacher',
        'foreign_language_teacher',
        'reading_teacher',
        'library_teacher',
        'librarian',
        'science_teacher',
        'maths_teacher',
        'math_teacher',
        'english_teacher',
        'history_teacher',
        'geography_teacher',
    ];

    /** Everyone who can hold a TeacherAssignment. */
    public const ALL = [
        'lead_teacher',
        'class_teacher',
        'assistant_teacher',
        'teacher',
        'teaching_assistant',
        'ta',
        'stream_lead',
        'club_lead',
        'specialist',
        'specialist_teacher',
        'special_teacher',
        'spec_teacher',
        'subject_teacher',
        'music_teacher',
        'art_teacher',
        'pe_teacher',
        'sports_teacher',
        'ict_teacher',
        'computing_teacher',
        'computer_teacher',
        'swimming_teacher',
        'dance_teacher',
        'drama_teacher',
        'language_teacher',
        'languages_teacher',
        'foreign_language_teacher',
        'reading_teacher',
        'library_teacher',
        'librarian',
        'science_teacher',
        'maths_teacher',
        'math_teacher',
        'english_teacher',
        'history_teacher',
        'geography_teacher',
    ];

    /** "Specialist Teacher" / "specialist-teacher" → "specialist_teacher" */
    public static function normalise(?string $role): ?string
    {
        if (!$role) return null;
        $role = strtolower(trim($role));
        $role = preg_replace('/[\s\-\.]+/', '_', $role);
        $role = preg_replace('/_+/', '_', $role);
        return trim($role, '_');
    }

    public static function isTeacher(?string $role): bool
    {
        $role = self::normalise($role);
        return $role !== null && in_array($role, self::ALL, true);
    }

    public static function isSpecialist(?string $role): bool
    {
        $role = self::normalise($role);
        return $role !== null && in_array($role, self::SPECIALIST, true);
    }

    public static function isClassLevel(?string $role): bool
    {
        $role = self::normalise($role);
        return $role !== null && in_array($role, self::CLASS_LEVEL, true);
    }
}