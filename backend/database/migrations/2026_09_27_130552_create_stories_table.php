<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stories', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->string('slug')->unique();

            $table->string('author')->nullable();
            $table->string('class_name')->nullable();

            $table->date('event_date')->nullable();
            $table->dateTime('published_date')->nullable();

            $table->foreignId('category_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('image_path')->nullable();

            $table->text('excerpt')->nullable();

            $table->longText('content')->nullable();

            $table->boolean('featured')->default(false);

            $table->enum('status', [
                'draft',
                'published',
            ])->default('draft');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stories');
    }
};