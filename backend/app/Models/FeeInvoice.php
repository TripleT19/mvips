<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeInvoice extends Model
{
    protected $fillable = [
        'student_id', 'fee_structure_id', 'term_id', 'academic_year_id',
        'total_amount', 'amount_paid', 'due_date', 'status', 'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'amount_paid'  => 'decimal:2',
        'due_date'     => 'date',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function feeStructure(): BelongsTo { return $this->belongsTo(FeeStructure::class); }
    public function term(): BelongsTo { return $this->belongsTo(AcademicTerm::class, 'term_id'); }
    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function payments(): HasMany { return $this->hasMany(FeePayment::class); }

    public function getBalanceAttribute(): float
    {
        return max(0, (float) $this->total_amount - (float) $this->amount_paid);
    }

    public function recalculate(): void
    {
        $paid  = (float) $this->payments()->sum('amount');
        $total = (float) $this->total_amount;

        $status = 'pending';
        if ($paid >= $total && $total > 0) $status = 'paid';
        else if ($paid > 0)                $status = 'partial';

        $this->update(['amount_paid' => $paid, 'status' => $status]);
    }
}