<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('term_report_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('class_stream_id')->nullable()->constrained('class_streams')->nullOnDelete();
            $table->foreignId('term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            // draft | submitted | published | held
            $table->string('status', 20)->default('draft');

            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('published_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('hold_reason')->nullable();
            $table->decimal('fees_balance_at_publish', 12, 2)->nullable();

            $table->timestamps();

            $table->unique(['student_id', 'term_id', 'academic_year_id'], 'trs_scope');
            $table->index(['status', 'term_id', 'academic_year_id'], 'trs_status_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('term_report_submissions');
    }
};