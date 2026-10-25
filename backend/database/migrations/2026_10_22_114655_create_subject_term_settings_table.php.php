<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subject_term_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            $table->unsignedInteger('total_marks')->default(100);
            $table->boolean('is_specialist')->default(false);
            $table->timestamps();

            $table->unique(
                ['subject_id', 'school_class_id', 'term_id', 'academic_year_id'],
                'sts_scope'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subject_term_settings');
    }
};