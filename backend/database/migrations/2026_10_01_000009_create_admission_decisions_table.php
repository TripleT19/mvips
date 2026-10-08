<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('admission_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_application_id')->constrained('admission_applications')->cascadeOnDelete();
            $table->string('decision', 30);
            $table->dateTime('decision_date');
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->foreignId('house_id')->nullable()->constrained('houses')->nullOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
            $table->text('comments')->nullable();
            $table->text('principal_comments')->nullable();
            $table->timestamps();
            $table->index(['decision', 'decision_date']);
        });
    }
    public function down(): void { Schema::dropIfExists('admission_decisions'); }
};
