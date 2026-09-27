<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();

            $table->string('title');

            $table->string('slug')
                ->unique();

            $table->text('description')
                ->nullable();

            $table->string('location')
                ->nullable();

            $table->string('class_name')
                ->nullable();

            $table->date('event_date');

            $table->time('start_time')
                ->nullable();

            $table->time('end_time')
                ->nullable();

            $table->string('image_path')
                ->nullable();

            $table->string('author')
                ->nullable();

            $table->boolean('featured')
                ->default(false);

            $table->enum('status', [
                'draft',
                'published',
            ])->default('published');

            $table->timestamps();

            $table->index('event_date');
            $table->index('status');
            $table->index('featured');
            $table->index('class_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};

