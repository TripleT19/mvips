<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class House extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'colour',
        'image_path',
        'featured_image_path',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['image_url', 'featured_image_url'];

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function points(): HasMany
    {
        return $this->hasMany(HousePoint::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) return null;
        return Storage::disk('public')->url($this->image_path);
    }

    public function getFeaturedImageUrlAttribute(): ?string
    {
        if (! $this->featured_image_path) return null;
        return Storage::disk('public')->url($this->featured_image_path);
    }
}