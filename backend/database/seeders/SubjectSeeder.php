<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Cambridge Primary curriculum framework.
     *
     *   • Core subjects        → formally assessed (Cambridge Primary Checkpoint)
     *   • Specialist subjects  → school-assessed, rounded off in the report card
     *
     * Specialist additions (Swimming, Dance) are school-specific extras.
     */
    public function run(): void
    {
        $subjects = [
            /*
            |----------------------------------------------------------
            | CORE SUBJECTS — Cambridge Primary Checkpoint
            |----------------------------------------------------------
            | English, Mathematics and Science are the three formal
            | assessment subjects at Cambridge Primary. The school
            | reports them out of 100 marks each.
            */

            [
                'name'          => 'English',
                'code'          => 'ENG',
                'subject_group' => 'core',
                'max_marks'     => 100,
                'sort_order'    => 1,
            ],
            [
                'name'          => 'Mathematics',
                'code'          => 'MATH',
                'subject_group' => 'core',
                'max_marks'     => 100,
                'sort_order'    => 2,
            ],
            [
                'name'          => 'Science',
                'code'          => 'SCI',
                'subject_group' => 'core',
                'max_marks'     => 100,
                'sort_order'    => 3,
            ],

            /*
            |----------------------------------------------------------
            | SPECIALIST SUBJECTS
            |----------------------------------------------------------
            | All are part of the Cambridge Primary framework or the
            | school's own curriculum. Reported out of 50 marks each.
            */

            // Cambridge framework subjects
            [
                'name'          => 'Global Perspectives',
                'code'          => 'GP',
                'subject_group' => 'specialist',
                'max_marks'     => 50,
                'sort_order'    => 4,
            ],
            [
                'name'          => 'Art & Design',
                'code'          => 'ART',
                'subject_group' => 'specialist',
                'max_marks'     => 50,
                'sort_order'    => 5,
            ],
            [
                'name'          => 'Computing',
                'code'          => 'COMP',
                'subject_group' => 'specialist',
                'max_marks'     => 50,
                'sort_order'    => 6,
            ],
            [
                'name'          => 'Digital Literacy',
                'code'          => 'DL',
                'subject_group' => 'specialist',
                'max_marks'     => 50,
                'sort_order'    => 7,
            ],
            [
                'name'          => 'Music',
                'code'          => 'MUS',
                'subject_group' => 'specialist',
                'max_marks'     => 50,
                'sort_order'    => 8,
            ],
            [
                'name'          => 'Physical Education',
                'code'          => 'PE',
                'subject_group' => 'specialist',
                'max_marks'     => 50,
                'sort_order'    => 9,
            ],
            [
                'name'          => 'Wellbeing',
                'code'          => 'WELL',
                'subject_group' => 'specialist',
                'max_marks'     => 50,
                'sort_order'    => 10,
            ],

            // School-specific additions (visible on the Term 2 report card)
            [
                'name'          => 'Swimming',
                'code'          => 'SWIM',
                'subject_group' => 'specialist',
                'max_marks'     => 50,
                'sort_order'    => 11,
            ],
            [
                'name'          => 'Dance',
                'code'          => 'DANCE',
                'subject_group' => 'specialist',
                'max_marks'     => 50,
                'sort_order'    => 12,
            ],
        ];

        foreach ($subjects as $subject) {
            Subject::updateOrCreate(
                ['code' => $subject['code']],
                $subject + ['is_active' => true]
            );
        }
    }
}