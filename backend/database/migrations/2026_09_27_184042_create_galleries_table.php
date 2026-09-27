<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('galleries', function (Blueprint $table) {
            $table->id();

            $table->string('title');

            $table->string('slug')
                ->unique();

            $table->text('description')
                ->nullable();

            $table->string('author')
                ->nullable();

            $table->string('class_name')
                ->nullable();

            $table->date('event_date')
                ->nullable();

            $table->boolean('featured')
                ->default(false);

            $table->enum('status', [
                'draft',
                'published',
            ])->default('published');

            $table->timestamps();

            $table->index('status');
            $table->index('event_date');
            $table->index('featured');
            $table->index('class_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('galleries');
    }
};