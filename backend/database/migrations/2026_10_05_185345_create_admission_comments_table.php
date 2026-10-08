<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_application_id')
                ->constrained('admission_applications')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('role_snapshot')->nullable();
            $table->text('body');
            $table->timestamps();

            $table->index(['admission_application_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_comments');
    }
};