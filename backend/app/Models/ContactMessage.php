<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'enquiry_type',
        'child_name',
        'class_name',
        'message',
        'reply_body',
        'status',
        'handled_by',
        'replied_by',
        'read_at',
        'replied_at',
        'ip_address',
    ];

    protected $casts = [
        'read_at'    => 'datetime',
        'replied_at' => 'datetime',
    ];

    public function handler()
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    public function replayer()
    {
        return $this->belongsTo(User::class, 'replied_by');
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeNew($query)
    {
        return $query->where('status', 'new');
    }

    public function getEnquiryTypeLabelAttribute(): string
    {
        return ucfirst(str_replace('-', ' ', $this->enquiry_type));
    }
}