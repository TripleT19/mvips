<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'School Events',
                'description' => 'News and stories about school events and activities.',
            ],
            [
                'name' => 'Academics',
                'description' => 'Learning, teaching and academic achievements.',
            ],
            [
                'name' => 'School Life',
                'description' => 'Everyday life and experiences at Mount View.',
            ],
            [
                'name' => 'Sports',
                'description' => 'Sports, competitions and physical activities.',
            ],
            [
                'name' => 'STEAM',
                'description' => 'Science, Technology, Engineering, Arts and Mathematics.',
            ],
            [
                'name' => 'Creative Arts',
                'description' => 'Creative arts, music, drama and artistic activities.',
            ],
            [
                'name' => 'Community',
                'description' => 'Community activities and engagement.',
            ],
            [
                'name' => 'School Trips',
                'description' => 'Educational trips, excursions, field visits and student experiences outside the classroom.',
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                [
                    'name' => $category['name'],
                ],
                [
                    'slug' => Str::slug($category['name']),
                    'description' => $category['description'],
                ]
            );
        }
    }
}