<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('attendance_register_id')
                ->constrained('attendance_registers')
                ->cascadeOnDelete();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            // present | absent | late | excused | sick
            $table->string('status', 20)->default('present');

            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->unique(
                ['attendance_register_id', 'student_id'],
                'attendance_record_unique'
            );

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};