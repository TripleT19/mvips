<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_term_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('class_stream_id')->nullable()->constrained('class_streams')->nullOnDelete();
            $table->foreignId('term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            $table->json('traits')->nullable();
            $table->text('class_teacher_observation')->nullable();
            $table->text('skill_enhancement_club')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'term_id', 'academic_year_id'], 'str_scope');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_term_reports');
    }
};