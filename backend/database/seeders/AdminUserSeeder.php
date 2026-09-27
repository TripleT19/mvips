<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            [
                'email' => 'timothyc@mountviewmw.com',
            ],
            [
                'name' => 'Mount View Administrator',
                'password' => 'MVIPS001',
                'role' => 'administrator',
                'is_active' => true,
            ]
        );
    }
}