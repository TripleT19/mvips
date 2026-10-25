<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Only seed if the table is empty — never touch existing houses
        if (DB::table('houses')->count() > 0) {
            return;
        }

        $defaults = [
            ['name' => 'Eagles House',  'code' => 'EAG', 'colour' => '#252B68'],
            ['name' => 'Lake House',    'code' => 'LAK', 'colour' => '#0891b2'],
            ['name' => 'Baobab',        'code' => 'BAO', 'colour' => '#16a34a'],
            ['name' => 'Sunbird House', 'code' => 'SUN', 'colour' => '#F58220'],
        ];

        foreach ($defaults as $house) {
            DB::table('houses')->insert(array_merge($house, [
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    public function down(): void
    {
        // Never remove houses — students may reference them
    }
};