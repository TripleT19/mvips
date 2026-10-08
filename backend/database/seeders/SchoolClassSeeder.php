<?php

namespace Database\Seeders;

use App\Models\SchoolClass;
use Illuminate\Database\Seeder;

class SchoolClassSeeder extends Seeder
{
    public function run(): void
    {
        $classes = [
            [
                'name' => 'Year 1',
                'code' => 'Y1',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Year 2',
                'code' => 'Y2',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Year 3',
                'code' => 'Y3',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Year 4',
                'code' => 'Y4',
                'sort_order' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'Year 5',
                'code' => 'Y5',
                'sort_order' => 5,
                'is_active' => true,
            ],
            [
                'name' => 'Year 6',
                'code' => 'Y6',
                'sort_order' => 6,
                'is_active' => true,
            ],
        ];

        foreach ($classes as $class) {
            SchoolClass::updateOrCreate(
                ['code' => $class['code']],
                $class
            );
        }
    }
}