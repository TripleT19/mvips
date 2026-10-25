<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolBankAccount extends Model
{
    protected $fillable = [
        'name', 'bank_name', 'account_number', 'branch',
        'swift_code', 'currency', 'is_default', 'is_active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active'  => 'boolean',
    ];

    public static function booted(): void
    {
        static::saving(function (self $account) {
            if ($account->is_default) {
                static::where('id', '!=', $account->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }
        });
    }
}