<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // class_teacher | subject_teacher | assistant_teacher
            $table->string('role', 30);

            $table->foreignId('school_class_id')
                ->nullable()
                ->constrained('school_classes')
                ->nullOnDelete();

            $table->foreignId('subject_id')
                ->nullable()
                ->constrained('subjects')
                ->nullOnDelete();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(
                ['user_id', 'academic_year_id', 'is_active'],
                'ta_user_year_active_idx'
            );
            $table->index(
                ['school_class_id', 'role', 'is_active'],
                'ta_class_role_active_idx'
            );
            $table->index(
                ['school_class_id', 'subject_id', 'role', 'is_active'],
                'ta_class_subject_role_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_assignments');
    }
};