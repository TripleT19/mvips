<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fee_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_invoice_id')->constrained('fee_invoices')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('school_bank_account_id')->nullable()
                ->constrained('school_bank_accounts')->nullOnDelete();

            $table->decimal('amount', 12, 2);
            $table->string('payment_method', 30)->default('cash');
            $table->string('reference')->nullable();
            $table->unsignedTinyInteger('installment_number')->default(1);
            $table->date('paid_on');
            $table->foreignId('received_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'paid_on']);
            $table->index('fee_invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_payments');
    }
};