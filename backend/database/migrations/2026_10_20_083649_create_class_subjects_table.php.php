<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_subjects', function (Blueprint $table) {
            $table->id();

            $table->foreignId('school_class_id')
                ->constrained('school_classes')
                ->cascadeOnDelete();

            $table->foreignId('subject_id')
                ->constrained('subjects')
                ->cascadeOnDelete();

            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->cascadeOnDelete();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(
                ['school_class_id', 'subject_id', 'academic_year_id'],
                'class_subject_year_unique'
            );

            $table->index(
                ['school_class_id', 'academic_year_id', 'is_active'],
                'class_subject_lookup_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_subjects');
    }
};