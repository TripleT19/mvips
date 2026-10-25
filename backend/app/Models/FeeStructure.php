<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeStructure extends Model
{
    protected $fillable = [
        'academic_year_id', 'school_class_id', 'name',
        'amount_per_term', 'term_amounts',
        'version', 'is_active', 'effective_from',
        'allows_installments', 'max_installments', 'notes',
    ];

    protected $casts = [
        'amount_per_term'     => 'decimal:2',
        'term_amounts'        => 'array',
        'is_active'           => 'boolean',
        'allows_installments' => 'boolean',
        'effective_from'      => 'date',
    ];

    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function schoolClass(): BelongsTo { return $this->belongsTo(SchoolClass::class); }
    public function items(): HasMany { return $this->hasMany(FeeStructureItem::class)->orderBy('sort_order'); }
    public function invoices(): HasMany { return $this->hasMany(FeeInvoice::class); }

    /** The amount to bill for a given term — falls back to amount_per_term. */
    public function amountForTerm(int $termId): float
    {
        $map = $this->term_amounts ?? [];
        $value = $map[$termId] ?? $map[(string) $termId] ?? null;
        return (float) ($value ?? $this->amount_per_term);
    }

    public function recalculateTotal(): void
    {
        $total = (float) $this->items()->sum('amount');
        $this->update(['amount_per_term' => $total]);
    }

    /** The single active structure for a class in a given year, or null. */
    public static function currentFor(int $yearId, int $classId): ?self
    {
        return static::where('academic_year_id', $yearId)
            ->where('school_class_id', $classId)
            ->where('is_active', true)
            ->orderByDesc('version')
            ->first();
    }
}