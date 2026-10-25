<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_terms', function (Blueprint $table) {
            $table->id();

            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->cascadeOnDelete();

            $table->string('name', 50);            // Term 1, Term 2, Term 3
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->boolean('is_current')->default(false);
            $table->boolean('is_published')->default(false);

            $table->timestamps();

            $table->unique(['academic_year_id', 'name']);
            $table->index('is_current');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_terms');
    }
};