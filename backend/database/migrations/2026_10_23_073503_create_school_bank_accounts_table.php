<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('school_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');                          // "Main Fees Account"
            $table->string('bank_name');                     // "Standard Bank"
            $table->string('account_number');
            $table->string('branch')->nullable();
            $table->string('swift_code')->nullable();
            $table->string('currency', 8)->default('MWK');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['bank_name', 'account_number'], 'sba_unique');
            $table->index(['is_active', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_bank_accounts');
    }
};