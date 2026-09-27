<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Story extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'author',
        'class_name',
        'event_date',
        'published_date',
        'category_id',
        'image_path',
        'excerpt',
        'content',
        'featured',
        'status',
    ];

    protected $casts = [
        'event_date' => 'date',
        'published_date' => 'datetime',
        'featured' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(
            Category::class,
            'category_id'
        );
    }
}