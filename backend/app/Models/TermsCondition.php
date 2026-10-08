<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TermsCondition extends Model {
    use HasFactory;
    protected $fillable = ['version','title','terms','is_current','published_at','created_by'];
    protected $casts = ['terms'=>'array','is_current'=>'boolean','published_at'=>'datetime'];
}
