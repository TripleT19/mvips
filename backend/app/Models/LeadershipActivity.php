<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LeadershipActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'story',
        'image_path',
        'category',
        'participants',
        'activity_date',
        'featured',
        'status',
        'created_by',
    ];

    protected $casts = [
        'activity_date' => 'date',
        'featured'      => 'boolean',
    ];

    protected $appends = ['image_url'];

    protected static function booted(): void
    {
        static::saving(function (self $activity) {
            if (empty($activity->slug)) {
                $activity->slug = self::generateUniqueSlug($activity->title);
            }
        });
    }

    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        if ($base === '') $base = 'activity';

        $slug = $base;
        $i = 1;

        while (
            self::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base . '-' . $i;
            $i++;
        }

        return $slug;
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) return null;
        return Storage::disk('public')->url($this->image_path);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}