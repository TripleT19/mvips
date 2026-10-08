<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model {
    use HasFactory;
    protected $fillable = ['user_id','action','auditable_type','auditable_id','application_number','metadata','ip_address','user_agent'];
    protected $casts = ['metadata'=>'array'];
}
