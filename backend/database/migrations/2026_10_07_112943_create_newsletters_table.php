<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('newsletters', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            // Term (Term 1 / Term 2 / Term 3) and calendar year
            $table->string('term')->nullable();
            $table->integer('year');

            // When the newsletter was published (used for sorting)
            $table->date('published_on')->nullable();

            // File details
            $table->string('file_path');
            $table->string('file_original_name');
            $table->unsignedBigInteger('file_size')->nullable();

            // Optional cover thumbnail
            $table->string('cover_image_path')->nullable();

            $table->boolean('featured')->default(false);
            $table->string('status')->default('published'); // draft | published

            $table->foreignId('uploaded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['year', 'term']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletters');
    }
};