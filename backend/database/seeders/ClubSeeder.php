<?php

namespace Database\Seeders;

use App\Models\Club;
use Illuminate\Database\Seeder;

class ClubSeeder extends Seeder
{
    public function run(): void
    {
        $clubs = [
            ['name' => 'Football Club',           'description' => 'Soccer training and inter-school matches.', 'colour' => '#16a34a', 'sort_order' => 1],
            ['name' => 'Chess Club',              'description' => 'Strategic thinking and competitive chess.', 'colour' => '#334155', 'sort_order' => 2],
            ['name' => 'Debate Club',             'description' => 'Public speaking and argumentation.', 'colour' => '#7c3aed', 'sort_order' => 3],
            ['name' => 'Drama Club',              'description' => 'Theatre, acting and stagecraft.', 'colour' => '#dc2626', 'sort_order' => 4],
            ['name' => 'Science Club',            'description' => 'Hands-on experiments and science fairs.', 'colour' => '#0891b2', 'sort_order' => 5],
            ['name' => 'Coding Club',             'description' => 'Programming, robotics and game design.', 'colour' => '#2563eb', 'sort_order' => 6],
            ['name' => 'Book Club',               'description' => 'Reading groups and author studies.', 'colour' => '#ca8a04', 'sort_order' => 7],
            ['name' => 'Environmental Club',      'description' => 'Sustainability, gardening and conservation.', 'colour' => '#65a30d', 'sort_order' => 8],
            ['name' => 'Music Club',              'description' => 'Choir, band and instrument practice.', 'colour' => '#db2777', 'sort_order' => 9],
            ['name' => 'Art Club',                'description' => 'Painting, drawing and mixed media.', 'colour' => '#ea580c', 'sort_order' => 10],
        ];

        foreach ($clubs as $row) {
            Club::updateOrCreate(
                ['name' => $row['name']],
                $row + ['is_active' => true]
            );
        }
    }
}