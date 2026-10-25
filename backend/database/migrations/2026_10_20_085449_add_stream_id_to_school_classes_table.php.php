<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            if (!Schema::hasColumn('school_classes', 'stream_id')) {
                $table->foreignId('stream_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('streams')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            if (Schema::hasColumn('school_classes', 'stream_id')) {
                $table->dropConstrainedForeignId('stream_id');
            }
        });
    }
};