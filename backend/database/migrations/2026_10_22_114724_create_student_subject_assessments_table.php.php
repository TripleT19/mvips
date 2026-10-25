<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_subject_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('class_stream_id')->constrained('class_streams')->cascadeOnDelete();
            $table->foreignId('term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            $table->string('effort_shown', 20)->nullable();
            $table->text('teacher_observation')->nullable();
            $table->decimal('scored_marks', 6, 2)->nullable();

            $table->foreignId('assessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(
                ['student_id', 'subject_id', 'term_id', 'academic_year_id'],
                'ssa_scope'
            );
            $table->index(['class_stream_id', 'term_id', 'academic_year_id'], 'ssa_class');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_subject_assessments');
    }
};