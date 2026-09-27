<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class GalleryController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | PUBLIC GALLERY
    |--------------------------------------------------------------------------
    */

    public function publicIndex(Request $request)
    {
        $query = Gallery::query()
            ->with('images')
            ->where('status', 'published');

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('class_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('class_name')) {
            $query->where('class_name', $request->input('class_name'));
        }

        if ($request->has('featured')) {
            $query->where(
                'featured',
                filter_var(
                    $request->input('featured'),
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        $query
            ->orderByDesc('event_date')
            ->orderByDesc('created_at');

        $galleries = $query->paginate(
            min($request->integer('per_page', 12), 50)
        );

        return response()->json([
            'success' => true,
            'data' => $galleries->through(
                fn ($gallery) => $this->formatGallery($gallery)
            ),
        ]);
    }

    public function showPublic(string $slug)
    {
        $gallery = Gallery::with('images')
            ->where('slug', $slug)
            ->where('status', 'published')
            ->first();

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Gallery not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatGallery($gallery),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | ADMIN GALLERY
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $query = Gallery::query()
            ->with('images');

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('class_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->input('status')
            );
        }

        if ($request->filled('class_name')) {
            $query->where(
                'class_name',
                $request->input('class_name')
            );
        }

        if ($request->has('featured')) {
            $query->where(
                'featured',
                filter_var(
                    $request->input('featured'),
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        $query->latest();

        $galleries = $query->paginate(
            min($request->integer('per_page', 12), 50)
        );

        return response()->json([
            'success' => true,
            'data' => $galleries->through(
                fn ($gallery) => $this->formatGallery($gallery)
            ),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE GALLERY
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'class_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'event_date' => [
                'nullable',
                'date',
            ],

            'images' => [
                'required',
                'array',
                'min:1',
            ],

            'images.*' => [
                'required',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],

            'featured' => [
                'nullable',
                'boolean',
            ],

            'status' => [
                'required',
                Rule::in([
                    'draft',
                    'published',
                ]),
            ],
        ]);

        $user = $request->user();

        $slug = $this->generateUniqueSlug(
            $validated['slug'] ?? $validated['title']
        );

        $gallery = Gallery::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'author' => $user?->name,
            'class_name' => $validated['class_name'] ?? null,
            'event_date' => $validated['event_date'] ?? null,
            'featured' => $request->boolean('featured'),
            'status' => $validated['status'],
        ]);

        $this->storeImages(
            $gallery,
            $request->file('images', [])
        );

        $gallery->load('images');

        return response()->json([
            'success' => true,
            'message' => 'Gallery created successfully.',
            'data' => $this->formatGallery($gallery),
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW ADMIN GALLERY
    |--------------------------------------------------------------------------
    */

    public function show(Gallery $gallery)
    {
        $gallery->load('images');

        return response()->json([
            'success' => true,
            'data' => $this->formatGallery($gallery),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE GALLERY
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, Gallery $gallery)
    {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'class_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'event_date' => [
                'nullable',
                'date',
            ],

            'images' => [
                'nullable',
                'array',
            ],

            'images.*' => [
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],

            'featured' => [
                'nullable',
                'boolean',
            ],

            'status' => [
                'required',
                Rule::in([
                    'draft',
                    'published',
                ]),
            ],
        ]);

        if (
            isset($validated['slug']) &&
            $validated['slug'] !== $gallery->slug
        ) {
            $slug = $this->generateUniqueSlug(
                $validated['slug'],
                $gallery->id
            );
        } else {
            $slug = $gallery->slug;
        }

        $gallery->update([
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'class_name' => $validated['class_name'] ?? null,
            'event_date' => $validated['event_date'] ?? null,
            'featured' => $request->boolean('featured'),
            'status' => $validated['status'],
        ]);

        /*
        |--------------------------------------------------------------------------
        | ADD NEW IMAGES
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('images')) {
            $gallery->load('images');

            $startingOrder = $gallery->images->count();

            $this->storeImages(
                $gallery,
                $request->file('images', []),
                $startingOrder
            );
        }

        $gallery->load('images');

        return response()->json([
            'success' => true,
            'message' => 'Gallery updated successfully.',
            'data' => $this->formatGallery($gallery),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE ENTIRE GALLERY
    |--------------------------------------------------------------------------
    */

    public function destroy(Gallery $gallery)
    {
        $gallery->load('images');

        foreach ($gallery->images as $image) {
            if ($image->image_path) {
                Storage::disk('public')->delete(
                    $image->image_path
                );
            }
        }

        $gallery->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gallery deleted successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE MULTIPLE IMAGES
    |--------------------------------------------------------------------------
    */

    private function storeImages(
        Gallery $gallery,
        array $files,
        int $startingOrder = 0
    ): void {
        foreach ($files as $index => $file) {

            if (!$file) {
                continue;
            }

            $path = $file->store(
                'gallery',
                'public'
            );

            $gallery->images()->create([
                'image_path' => $path,
                'sort_order' => $startingOrder + $index,
            ]);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UNIQUE SLUG
    |--------------------------------------------------------------------------
    */

    private function generateUniqueSlug(
        string $value,
        ?int $ignoreId = null
    ): string {
        $baseSlug = Str::slug($value);

        if (!$baseSlug) {
            $baseSlug = 'gallery';
        }

        $slug = $baseSlug;
        $counter = 2;

        while (
            Gallery::where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn ($query) =>
                        $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT RESPONSE
    |--------------------------------------------------------------------------
    */

    private function formatGallery(Gallery $gallery): array
    {
        return [
            'id' => $gallery->id,

            'title' => $gallery->title,

            'slug' => $gallery->slug,

            'description' => $gallery->description,

            'author' => $gallery->author,

            'class_name' => $gallery->class_name,

            'event_date' => $gallery->event_date,

            'featured' => (bool) $gallery->featured,

            'status' => $gallery->status,

            'image_count' => $gallery->images->count(),

            'cover_image' => $gallery->images->first()?->image_url,

            'images' => $gallery->images
                ->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'image_path' => $image->image_path,
                        'image_url' => $image->image_url,
                        'sort_order' => $image->sort_order,
                    ];
                })
                ->values()
                ->all(),

            'created_at' => $gallery->created_at,

            'updated_at' => $gallery->updated_at,
        ];
    }
}