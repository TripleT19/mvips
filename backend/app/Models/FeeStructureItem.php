<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeStructureItem extends Model
{
    protected $fillable = ['fee_structure_id', 'name', 'amount', 'sort_order'];
    protected $casts = ['amount' => 'decimal:2'];
}