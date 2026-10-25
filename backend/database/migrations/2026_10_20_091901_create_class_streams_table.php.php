<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_streams', function (Blueprint $table) {
            $table->id();

            $table->foreignId('school_class_id')
                ->constrained('school_classes')
                ->cascadeOnDelete();

            $table->foreignId('stream_id')
                ->constrained('streams')
                ->cascadeOnDelete();

            // Auto-generated display name (e.g. "Year 1 East")
            $table->string('name', 120);

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(
                ['school_class_id', 'stream_id'],
                'class_stream_unique'
            );
            $table->index(['school_class_id', 'is_active'], 'class_stream_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_streams');
    }
};