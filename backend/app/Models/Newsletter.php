<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Newsletter extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'term',
        'year',
        'published_on',
        'file_path',
        'file_original_name',
        'file_size',
        'cover_image_path',
        'featured',
        'status',
        'uploaded_by',
    ];

    protected $casts = [
        'featured' => 'boolean',
        'published_on' => 'date',
        'year' => 'integer',
        'file_size' => 'integer',
    ];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) return null;
        return Storage::disk('public')->url($this->file_path);
    }

    public function getCoverImageUrlAttribute(): ?string
    {
        if (!$this->cover_image_path) return null;
        return Storage::disk('public')->url($this->cover_image_path);
    }

    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'newsletter';
        $slug = $base;
        $n = 2;

        while (
            self::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base . '-' . $n++;
        }

        return $slug;
    }
}