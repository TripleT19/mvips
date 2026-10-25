<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('teacher_assignments', 'club_id')) {
                $table->foreignId('club_id')
                    ->nullable()
                    ->after('subject_id')
                    ->constrained('clubs')
                    ->nullOnDelete();

                $table->index(
                    ['club_id', 'role', 'is_active'],
                    'ta_club_role_active_idx'
                );
            }
        });
    }

    public function down(): void
    {
        Schema::table('teacher_assignments', function (Blueprint $table) {
            if (Schema::hasColumn('teacher_assignments', 'club_id')) {
                $table->dropIndex('ta_club_role_active_idx');
                $table->dropConstrainedForeignId('club_id');
            }
        });
    }
};