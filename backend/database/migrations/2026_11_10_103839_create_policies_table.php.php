<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policies', function (Blueprint $table) {
            $table->id();

            // Content
            $table->string('title');
            $table->string('category', 50)->default('general')->index();
            $table->text('description')->nullable();
            $table->string('version', 50)->nullable();
            $table->date('effective_date')->nullable();

            // File metadata
            $table->string('file_path')->nullable();          // storage path
            $table->string('file_name')->nullable();          // original filename
            $table->unsignedBigInteger('file_size')->nullable(); // bytes
            $table->string('file_type', 120)->nullable();     // mime type
            $table->string('file_disk', 50)->default('public');

            // Ordering + visibility
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedInteger('sort_order')->default(0)->index();

            // Author
            $table->foreignId('uploaded_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Composite indexes for the public list
            $table->index(['is_active', 'sort_order']);
            $table->index(['category', 'is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policies');
    }
};