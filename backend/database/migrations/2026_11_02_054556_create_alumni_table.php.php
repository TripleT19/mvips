<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('alumni', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->unsignedSmallInteger('year_left');
            $table->string('location');
            $table->string('current_role');
            $table->string('organization')->nullable();
            $table->text('bio')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->text('message_to_students')->nullable();
            $table->boolean('show_contact')->default(false);

            // approval workflow
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_notes')->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index('year_left');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alumni');
    }
};