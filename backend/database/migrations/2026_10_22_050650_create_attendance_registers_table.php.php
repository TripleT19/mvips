<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_registers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('class_stream_id')
                ->constrained('class_streams')
                ->cascadeOnDelete();

            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->cascadeOnDelete();

            $table->date('date');

            $table->foreignId('marked_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('marked_at')->nullable();

            $table->string('status', 20)->default('submitted');

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(
                ['class_stream_id', 'date'],
                'attendance_register_unique'
            );

            $table->index(['academic_year_id', 'date'], 'attendance_register_year_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_registers');
    }
};