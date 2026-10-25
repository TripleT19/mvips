<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeePayment extends Model
{
    protected $fillable = [
        'fee_invoice_id', 'student_id', 'school_bank_account_id',
        'amount', 'payment_method', 'reference',
        'installment_number', 'paid_on', 'received_by', 'notes',
    ];

    protected $casts = [
        'amount'   => 'decimal:2',
        'paid_on'  => 'date',
    ];

    public function invoice(): BelongsTo { return $this->belongsTo(FeeInvoice::class, 'fee_invoice_id'); }
    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function bankAccount(): BelongsTo { return $this->belongsTo(SchoolBankAccount::class, 'school_bank_account_id'); }
    public function receivedBy(): BelongsTo { return $this->belongsTo(User::class, 'received_by'); }
}