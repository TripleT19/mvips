<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('teacher_assignments', 'class_stream_id')) {
                $table->foreignId('class_stream_id')
                    ->nullable()
                    ->after('school_class_id')
                    ->constrained('class_streams')
                    ->nullOnDelete();

                $table->index(
                    ['class_stream_id', 'role', 'is_active'],
                    'ta_stream_role_active_idx'
                );
            }
        });
    }

    public function down(): void
    {
        Schema::table('teacher_assignments', function (Blueprint $table) {
            if (Schema::hasColumn('teacher_assignments', 'class_stream_id')) {
                $table->dropIndex('ta_stream_role_active_idx');
                $table->dropConstrainedForeignId('class_stream_id');
            }
        });
    }
};