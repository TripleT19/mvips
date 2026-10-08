<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_number', 40)->unique();
            $table->foreignId('admission_application_id')->nullable()->unique()->constrained('admission_applications')->nullOnDelete();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('surname');
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 30)->nullable();
            $table->string('blood_group', 20)->nullable();
            $table->string('nationality')->nullable();
            $table->string('first_language')->nullable();
            $table->string('religion')->nullable();
            $table->string('photo_path')->nullable();
            $table->foreignId('current_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->foreignId('house_id')->nullable()->constrained('houses')->nullOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
            $table->date('admission_date')->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
            $table->index(['status', 'academic_year_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('students'); }
};
