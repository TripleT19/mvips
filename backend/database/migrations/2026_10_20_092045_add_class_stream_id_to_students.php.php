<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'current_class_stream_id')) {
                $table->foreignId('current_class_stream_id')
                    ->nullable()
                    ->after('current_class_id')
                    ->constrained('class_streams')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'current_class_stream_id')) {
                $table->dropConstrainedForeignId('current_class_stream_id');
            }
        });
    }
};