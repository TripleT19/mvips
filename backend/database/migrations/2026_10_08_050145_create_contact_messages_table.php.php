<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();

            $table->string('full_name');
            $table->string('email');
            $table->string('phone')->nullable();

            // admissions | school-information | curriculum | school-life | general
            $table->string('enquiry_type')->default('general');

            $table->string('child_name')->nullable();
            $table->string('class_name')->nullable();

            $table->text('message');

            // new | read | replied | archived
            $table->string('status')->default('new');

            // Optional: who handled it
            $table->foreignId('handled_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('read_at')->nullable();
            $table->timestamp('replied_at')->nullable();

            $table->string('ip_address', 45)->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index('enquiry_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};