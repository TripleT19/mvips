<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('top_achievers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->cascadeOnDelete();

            $table->string('student_name');
            $table->string('student_photo_path')->nullable();
            $table->integer('position')->default(1);

            $table->decimal('english_score', 5, 2)->default(0);
            $table->decimal('maths_score', 5, 2)->default(0);
            $table->decimal('science_score', 5, 2)->default(0);
            $table->decimal('total_score', 6, 2)->default(0);
            $table->decimal('average_score', 5, 2)->default(0);

            $table->text('note')->nullable();
            $table->boolean('is_published')->default(true);
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['academic_year_id', 'is_published', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('top_achievers');
    }
};