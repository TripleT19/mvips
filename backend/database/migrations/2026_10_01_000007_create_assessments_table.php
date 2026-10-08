<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_application_id')->constrained('admission_applications')->cascadeOnDelete();
            $table->date('assessment_date')->nullable();
            $table->time('assessment_time')->nullable();
            $table->string('location')->nullable();
            $table->foreignId('assessor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('assessment_type')->nullable();
            $table->string('result', 30)->nullable();
            $table->text('comments')->nullable();
            $table->text('recommendation')->nullable();
            $table->timestamps();
            $table->index(['assessment_date', 'result']);
        });
    }
    public function down(): void { Schema::dropIfExists('assessments'); }
};
