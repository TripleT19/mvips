<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('application_parents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_application_id')->constrained('admission_applications')->cascadeOnDelete();
            $table->string('full_name');
            $table->string('relationship')->nullable();
            $table->string('phone_number')->nullable();
            $table->string('email')->nullable();
            $table->string('occupation')->nullable();
            $table->string('employer')->nullable();
            $table->text('physical_address')->nullable();
            $table->string('postal_address')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('preferred_communication')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->index(['admission_application_id', 'is_primary']);
        });
    }
    public function down(): void { Schema::dropIfExists('application_parents'); }
};
