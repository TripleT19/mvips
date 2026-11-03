<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alumnus extends Model
{
    use HasFactory;

    protected $table = 'alumni';

    protected $fillable = [
        'full_name', 'email', 'phone', 'year_left', 'location',
        'current_role', 'organization', 'bio', 'photo_path',
        'linkedin_url', 'message_to_students', 'show_contact',
        'status', 'approved_at', 'approved_by', 'admin_notes',
    ];

    protected $casts = [
        'show_contact' => 'boolean',
        'year_left'    => 'integer',
        'approved_at'  => 'datetime',
    ];

    protected $hidden = [
        'photo_path', 'approved_by', 'admin_notes',
    ];

    /**
     * The staff member who approved OR rejected this submission.
     * Reused for both actions — the frontend labels it accordingly.
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path
            ? asset('storage/' . $this->photo_path)
            : null;
    }

    public function toPublicArray(): array
    {
        return [
            'id'                    => $this->id,
            'full_name'             => $this->full_name,
            'year_left'             => $this->year_left,
            'location'              => $this->location,
            'current_role'          => $this->current_role,
            'organization'          => $this->organization,
            'bio'                   => $this->bio,
            'photo_url'             => $this->photo_url,
            'linkedin_url'          => $this->linkedin_url,
            'message_to_students'   => $this->message_to_students,
            'email'                 => $this->show_contact ? $this->email : null,
            'phone'                 => $this->show_contact ? $this->phone : null,
            'created_at'            => $this->created_at,
        ];
    }
}