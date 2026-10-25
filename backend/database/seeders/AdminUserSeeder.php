<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'name' => 'Mount View Administrator',
                'email' => 'admin@mountviewmw.com',
                'role' => 'administrator',
            ],
            [
                'name' => 'Head of Department',
                'email' => 'hod@mountviewmw.com',
                'role' => 'hod',
            ],
            [
                'name' => 'Lead Teacher',
                'email' => 'leadteacher@mountviewmw.com',
                'role' => 'lead_teacher',
            ],
            [
                'name' => 'Class Teacher',
                'email' => 'classteacher@mountviewmw.com',
                'role' => 'class_teacher',
            ],
            [
                'name' => 'Teaching Assistant',
                'email' => 'assistant@mountviewmw.com',
                'role' => 'teaching_assistant',
            ],
            [
                'name' => 'Admissions Officer',
                'email' => 'admissions@mountviewmw.com',
                'role' => 'admissions_officer',
            ],
            [
                'name' => 'Content Editor',
                'email' => 'editor@mountviewmw.com',
                'role' => 'editor',
            ],
            [
                'name' => 'Staff Member',
                'email' => 'staff@mountviewmw.com',
                'role' => 'staff',
            ],
            [
                'name' => 'Bursar',
                'email' => 'bursar@mountviewmw.com',
                'role' => 'bursar',
            ],
            [
                'name' => 'Headteacher',
                'email' => 'headteacher@mountviewmw.com',
                'role' => 'headteacher',
            ],

            // Specialist Teachers
            [
                'name' => 'ICT Teacher',
                'email' => 'ictteacher@mountviewmw.com',
                'role' => 'specialist_teacher',
            ],
            [
                'name' => 'Swimming Teacher',
                'email' => 'swimmingteacher@mountviewmw.com',
                'role' => 'specialist_teacher',
            ],
            [
                'name' => 'Music Teacher',
                'email' => 'musicteacher@mountviewmw.com',
                'role' => 'specialist_teacher',
            ],
            [
                'name' => 'Arts Teacher',
                'email' => 'artsteacher@mountviewmw.com',
                'role' => 'specialist_teacher',
            ],
            [
                'name' => 'Dance Teacher',
                'email' => 'danceteacher@mountviewmw.com',
                'role' => 'specialist_teacher',
            ],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make('mvips'),
                    'role' => $account['role'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info(
            count($accounts) . ' test accounts seeded successfully.'
        );
    }
}
