<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gallery_items', function (Blueprint $table) {
            $table->id();

            $table->string('title')->nullable();
            $table->text('caption')->nullable();

            $table->string('image_path');

            $table->string('album')->nullable();
            $table->string('category')->nullable();
            $table->string('class_name')->nullable();

            $table->date('event_date')->nullable();

            $table->boolean('featured')->default(false);

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('album');
            $table->index('category');
            $table->index('class_name');
            $table->index('featured');
            $table->index('event_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_items');
    }
};