<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            StreamSeeder::class,
            AdminUserSeeder::class,
            SchoolClassSeeder::class,
            SubjectSeeder::class,
            ClubSeeder::class,
        ]);
    }
}