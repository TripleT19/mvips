<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leadership_activities', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('story');
            $table->string('image_path')->nullable();
            $table->string('category')->nullable();
            $table->string('participants')->nullable();
            $table->date('activity_date');
            $table->boolean('featured')->default(false);
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'activity_date']);
            $table->index('featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leadership_activities');
    }
};