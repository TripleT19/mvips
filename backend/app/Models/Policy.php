<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Policy extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'category',
        'description',
        'version',
        'effective_date',
        'file_path',
        'file_name',
        'file_size',
        'file_type',
        'file_disk',
        'is_active',
        'sort_order',
        'uploaded_by',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'effective_date' => 'date',
        'file_size'      => 'integer',
        'sort_order'     => 'integer',
    ];

    protected $appends = ['file_url'];

    /* ------------------------------------------------------------------
     |  Relationships
     ------------------------------------------------------------------ */

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /* ------------------------------------------------------------------
     |  Accessors
     ------------------------------------------------------------------ */

    /**
     * Absolute public URL for the file, safe for the Next.js frontend
     * to link/download directly.
     */
    public function getFileUrlAttribute(): ?string
    {
        if (! $this->file_path) {
            return null;
        }

        if (Str::startsWith($this->file_path, ['http://', 'https://'])) {
            return $this->file_path;
        }

        $disk = $this->file_disk ?: 'public';
        $url  = Storage::disk($disk)->url($this->file_path);

        // If the disk returns a relative path (e.g. /storage/...),
        // prepend APP_URL so the browser hits the backend, not the frontend.
        if (Str::startsWith($url, '/')) {
            $url = rtrim(config('app.url'), '/') . $url;
        }

        return $url;
    }

    /* ------------------------------------------------------------------
     |  Scopes
     ------------------------------------------------------------------ */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderByDesc('created_at');
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /* ------------------------------------------------------------------
     |  Categories
     ------------------------------------------------------------------ */

    /**
     * Canonical category list. Keep in sync with the Next.js admin UI.
     */
    public static function categories(): array
    {
        return [
            'academic'      => 'Academic',
            'behaviour'     => 'Behaviour & Discipline',
            'safeguarding'  => 'Safeguarding & Child Protection',
            'health_safety' => 'Health & Safety',
            'admissions'    => 'Admissions',
            'finance'       => 'Finance',
            'it_data'       => 'IT & Data Protection',
            'general'       => 'General',
        ];
    }
}