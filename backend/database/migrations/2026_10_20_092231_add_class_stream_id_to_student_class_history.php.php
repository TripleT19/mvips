<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_class_history', function (Blueprint $table) {
            if (!Schema::hasColumn('student_class_history', 'class_stream_id')) {
                $table->foreignId('class_stream_id')
                    ->nullable()
                    ->after('class_id')
                    ->constrained('class_streams')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('student_class_history', function (Blueprint $table) {
            if (Schema::hasColumn('student_class_history', 'class_stream_id')) {
                $table->dropConstrainedForeignId('class_stream_id');
            }
        });
    }
};