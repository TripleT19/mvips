<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('gallery_images')) {
            return;
        }

        Schema::create('gallery_images', function (Blueprint $table) {
            $table->id();

            $table->foreignId('gallery_id')
                ->constrained('galleries')
                ->cascadeOnDelete();

            $table->string('image_path');

            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            // GalleryController loads images ordered by sort_order
            // for a specific gallery on every request — this composite
            // index makes that query cheap.
            $table->index(['gallery_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_images');
    }
};