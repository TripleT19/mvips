<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fee_structures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();

            $table->string('name');
            $table->decimal('amount_per_term', 12, 2)->default(0);

            // Optional per-term overrides keyed by term_id: { "1": 55000, "2": 50000 }
            $table->json('term_amounts')->nullable();

            $table->unsignedInteger('version')->default(1);
            $table->boolean('is_active')->default(true);
            $table->date('effective_from')->nullable();

            $table->boolean('allows_installments')->default(true);
            $table->unsignedTinyInteger('max_installments')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(
                ['academic_year_id', 'school_class_id', 'version'],
                'fs_scope_version'
            );
            $table->index(
                ['academic_year_id', 'school_class_id', 'is_active'],
                'fs_active_lookup'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_structures');
    }
};