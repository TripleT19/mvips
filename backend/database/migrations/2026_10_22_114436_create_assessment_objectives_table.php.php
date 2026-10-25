<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('assessment_objectives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('strand_id')->constrained('strands')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();

            // ⚠️  Points explicitly to academic_terms (NOT terms)
            $table->foreignId('term_id')->constrained('academic_terms')->cascadeOnDelete();

            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['subject_id', 'school_class_id', 'term_id', 'academic_year_id'], 'aobj_scope');
            $table->index(['strand_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_objectives');
    }
};