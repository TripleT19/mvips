<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('assessment_objective_results', function (Blueprint $table) {
            $table->id();

            $table->foreignId('assessment_objective_id')
                ->constrained('assessment_objectives')
                ->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();

            $table->foreignId('term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            // exceeding | high | good | aspiring | basic | unclassified
            $table->string('rating', 20)->default('unclassified');
            $table->text('remarks')->nullable();

            $table->foreignId('assessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['assessment_objective_id', 'student_id'], 'aobj_result_unique');
            $table->index(['student_id', 'term_id', 'academic_year_id'], 'aobj_result_student');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_objective_results');
    }
};