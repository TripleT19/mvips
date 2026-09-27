<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'author',
        'class_name',
        'event_date',
        'featured',
        'status',
    ];

    protected $casts = [
        'event_date' => 'date',
        'featured' => 'boolean',
    ];

    public function images()
    {
        return $this->hasMany(GalleryImage::class)
            ->orderBy('sort_order');
    }
}