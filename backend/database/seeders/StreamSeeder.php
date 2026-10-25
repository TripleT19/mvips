<?php

namespace Database\Seeders;

use App\Models\Stream;
use Illuminate\Database\Seeder;

class StreamSeeder extends Seeder
{
    public function run(): void
    {
        $streams = [
            ['name' => 'East',  'code' => 'E', 'colour' => '#252B68', 'sort_order' => 1],
            ['name' => 'West',  'code' => 'W', 'colour' => '#F58220', 'sort_order' => 2],
            ['name' => 'North', 'code' => 'N', 'colour' => '#16a34a', 'sort_order' => 3],
            ['name' => 'South', 'code' => 'S', 'colour' => '#7c3aed', 'sort_order' => 4],
        ];

        foreach ($streams as $row) {
            Stream::updateOrCreate(
                ['code' => $row['code']],
                $row + ['is_active' => true]
            );
        }
    }
}