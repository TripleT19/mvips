<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('terms_conditions', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('version');
            $table->string('title')->default('Terms and Conditions of Entry');
            $table->json('terms');
            $table->boolean('is_current')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique('version');
            $table->index('is_current');
        });
    }
    public function down(): void { Schema::dropIfExists('terms_conditions'); }
};
