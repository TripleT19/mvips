<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_weekly_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('class_stream_id')->constrained('class_streams')->cascadeOnDelete();
            $table->foreignId('term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            $table->string('test_type', 30); // times_tables | spelling
            $table->unsignedTinyInteger('week_number'); // 1..12

            $table->decimal('score', 6, 2)->nullable();
            $table->decimal('max_score', 6, 2)->default(12);
            $table->timestamps();

            $table->unique(
                ['student_id', 'test_type', 'week_number', 'term_id', 'academic_year_id'],
                'swt_scope'
            );
            $table->index(['class_stream_id', 'test_type', 'term_id', 'academic_year_id'], 'swt_class');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_weekly_tests');
    }
};