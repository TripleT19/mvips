<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StoryController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | PUBLIC STORIES
    |--------------------------------------------------------------------------
    */

    /**
     * Display published stories for the public website.
     *
     * Supports:
     * - Search
     * - Category filtering
     * - Class/year filtering
     * - Featured filtering
     * - Pagination
     */
    public function publicIndex(Request $request)
    {
        $query = Story::query()
            ->with('category')
            ->where('status', 'published');

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = trim($request->input('search'));

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('class_name', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($categoryQuery) use ($search) {
                        $categoryQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('slug', 'like', "%{$search}%");
                    });
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Category filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('category')) {
            $category = $request->input('category');

            $query->whereHas('category', function ($categoryQuery) use ($category) {
                $categoryQuery
                    ->where('slug', $category)
                    ->orWhere('id', $category)
                    ->orWhere('name', $category);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Class / Year filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('class_name')) {
            $query->where(
                'class_name',
                $request->input('class_name')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Featured filter
        |--------------------------------------------------------------------------
        */

        if ($request->has('featured')) {
            $featured = filter_var(
                $request->input('featured'),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($featured !== null) {
                $query->where('featured', $featured);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Ordering
        |--------------------------------------------------------------------------
        */

        $query->orderByDesc('published_at')
            ->orderByDesc('created_at');

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        $perPage = min(
            max((int) $request->input('per_page', 12), 1),
            100
        );

        $stories = $query->paginate($perPage);

        /*
        |--------------------------------------------------------------------------
        | Format response
        |--------------------------------------------------------------------------
        */

        $stories->getCollection()->transform(
            fn (Story $story) => $this->formatStory($story)
        );

        return response()->json([
            'success' => true,
            'data' => $stories,
        ]);
    }

    /**
     * Display a single published story publicly.
     */
    public function publicShow(string $slug)
    {
        $story = Story::query()
            ->with('category')
            ->where('slug', $slug)
            ->where('status', 'published')
            ->first();

        if (!$story) {
            return response()->json([
                'success' => false,
                'message' => 'Story not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatStory($story),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | ADMIN STORIES
    |--------------------------------------------------------------------------
    */

    /**
     * Display stories in the admin portal.
     *
     * Administrators can see both published stories and drafts.
     */
    public function index(Request $request)
    {
        $query = Story::query()
            ->with('category');

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = trim($request->input('search'));

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('class_name', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($categoryQuery) use ($search) {
                        $categoryQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('slug', 'like', "%{$search}%");
                    });
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Status filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->input('status')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Category filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('category')) {
            $category = $request->input('category');

            $query->whereHas('category', function ($categoryQuery) use ($category) {
                $categoryQuery
                    ->where('slug', $category)
                    ->orWhere('id', $category)
                    ->orWhere('name', $category);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Featured filter
        |--------------------------------------------------------------------------
        */

        if ($request->has('featured')) {
            $featured = filter_var(
                $request->input('featured'),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($featured !== null) {
                $query->where('featured', $featured);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Class filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('class_name')) {
            $query->where(
                'class_name',
                $request->input('class_name')
            );
        }

        $query->orderByDesc('created_at');

        $perPage = min(
            max((int) $request->input('per_page', 10), 1),
            100
        );

        $stories = $query->paginate($perPage);

        $stories->getCollection()->transform(
            fn (Story $story) => $this->formatStory($story)
        );

        return response()->json([
            'success' => true,
            'data' => $stories,
        ]);
    }


    /**
     * Create a new story.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
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

            'excerpt' => [
                'nullable',
                'string',
            ],

            'content' => [
                'required',
                'string',
            ],

            'featured' => [
                'nullable',
                'boolean',
            ],

            'status' => [
                'nullable',
                'in:draft,published',
            ],

            'published_at' => [
                'nullable',
                'date',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Generate slug
        |--------------------------------------------------------------------------
        */

        $slug = $this->generateUniqueSlug(
            $validated['title']
        );

        /*
        |--------------------------------------------------------------------------
        | Determine status
        |--------------------------------------------------------------------------
        */

        $status = $validated['status'] ?? 'draft';

        /*
        |--------------------------------------------------------------------------
        | Published date
        |--------------------------------------------------------------------------
        |
        | If the story is being published and no date was supplied,
        | automatically use the current date/time.
        |
        */

        $publishedAt = null;

        if ($status === 'published') {
            $publishedAt =
                $validated['published_at'] ??
                now();
        }

        /*
        |--------------------------------------------------------------------------
        | Author
        |--------------------------------------------------------------------------
        |
        | The author is automatically taken from the authenticated
        | admin user's name.
        |
        */

        $author = $request->user()?->name;

        /*
        |--------------------------------------------------------------------------
        | Create story
        |--------------------------------------------------------------------------
        */

        $story = new Story();

        $story->title = trim($validated['title']);
        $story->slug = $slug;
        $story->category_id = $validated['category_id'];
        $story->class_name = $validated['class_name'] ?? null;
        $story->event_date = $validated['event_date'] ?? null;
        $story->excerpt = $validated['excerpt'] ?? null;
        $story->content = $validated['content'];
        $story->author = $author;
        $story->featured = $validated['featured'] ?? false;
        $story->status = $status;
        $story->published_at = $publishedAt;

        /*
        |--------------------------------------------------------------------------
        | Image upload
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('image')) {
            $story->image_path = $request
                ->file('image')
                ->store('stories', 'public');
        }

        $story->save();

        $story->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Story created successfully.',
            'data' => $this->formatStory($story),
        ], 201);
    }


    /**
     * Display a single story in the admin portal.
     */
    public function show(Story $story)
    {
        $story->load('category');

        return response()->json([
            'success' => true,
            'data' => $this->formatStory($story),
        ]);
    }


    /**
     * Update an existing story.
     */
    public function update(Request $request, Story $story)
    {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
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

            'excerpt' => [
                'nullable',
                'string',
            ],

            'content' => [
                'required',
                'string',
            ],

            'featured' => [
                'nullable',
                'boolean',
            ],

            'status' => [
                'nullable',
                'in:draft,published',
            ],

            'published_at' => [
                'nullable',
                'date',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],

            'remove_image' => [
                'nullable',
                'boolean',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Update basic information
        |--------------------------------------------------------------------------
        */

        $story->title = trim($validated['title']);
        $story->category_id = $validated['category_id'];
        $story->class_name = $validated['class_name'] ?? null;
        $story->event_date = $validated['event_date'] ?? null;
        $story->excerpt = $validated['excerpt'] ?? null;
        $story->content = $validated['content'];

        $story->featured =
            $validated['featured'] ?? false;

        $newStatus =
            $validated['status'] ??
            $story->status;

        /*
        |--------------------------------------------------------------------------
        | Slug
        |--------------------------------------------------------------------------
        |
        | Regenerate the slug if the title changes.
        |
        */

        if (
            trim($story->getOriginal('title')) !==
            trim($validated['title'])
        ) {
            $story->slug = $this->generateUniqueSlug(
                $validated['title'],
                $story->id
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Publishing
        |--------------------------------------------------------------------------
        */

        if ($newStatus === 'published') {
            if (!empty($validated['published_at'])) {
                $story->published_at =
                    $validated['published_at'];
            } elseif (!$story->published_at) {
                $story->published_at = now();
            }
        } else {
            /*
            | Keep the previous publication date if the
            | story is moved back to draft.
            */
        }

        $story->status = $newStatus;

        /*
        |--------------------------------------------------------------------------
        | Image removal
        |--------------------------------------------------------------------------
        */

        if (
            !empty($validated['remove_image']) &&
            $story->image_path
        ) {
            Storage::disk('public')->delete(
                $story->image_path
            );

            $story->image_path = null;
        }

        /*
        |--------------------------------------------------------------------------
        | New image
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('image')) {
            /*
            | Delete the old image first.
            */

            if ($story->image_path) {
                Storage::disk('public')->delete(
                    $story->image_path
                );
            }

            $story->image_path = $request
                ->file('image')
                ->store('stories', 'public');
        }

        /*
        |--------------------------------------------------------------------------
        | Author
        |--------------------------------------------------------------------------
        |
        | Do NOT replace the original author when an editor
        | updates the story.
        |
        | The person who created/published the story remains
        | the recorded author.
        |
        */

        if (!$story->author) {
            $story->author =
                $request->user()?->name;
        }

        $story->save();

        $story->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Story updated successfully.',
            'data' => $this->formatStory($story),
        ]);
    }


    /**
     * Delete a story.
     */
    public function destroy(Story $story)
    {
        /*
        |--------------------------------------------------------------------------
        | Delete associated image
        |--------------------------------------------------------------------------
        */

        if ($story->image_path) {
            Storage::disk('public')->delete(
                $story->image_path
            );
        }

        $story->delete();

        return response()->json([
            'success' => true,
            'message' => 'Story deleted successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | FEATURED STORIES
    |--------------------------------------------------------------------------
    */

    /**
     * Return published featured stories.
     */
    public function featured(Request $request)
    {
        $limit = min(
            max((int) $request->input('limit', 6), 1),
            20
        );

        $stories = Story::query()
            ->with('category')
            ->where('status', 'published')
            ->where('featured', true)
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $stories->map(
                fn (Story $story) =>
                    $this->formatStory($story)
            )->values(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique story slug.
     */
    private function generateUniqueSlug(
        string $title,
        ?int $ignoreId = null
    ): string {
        $baseSlug = Str::slug($title);

        if ($baseSlug === '') {
            $baseSlug = 'story';
        }

        $slug = $baseSlug;
        $counter = 2;

        while (
            Story::where('slug', $slug)
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


    /**
     * Format a story for API responses.
     *
     * This is especially important for the public News page.
     *
     * The author is explicitly included here.
     */
    private function formatStory(Story $story): array
    {
        return [
            'id' => $story->id,

            'title' => $story->title,

            'slug' => $story->slug,

            /*
            |--------------------------------------------------------------------------
            | Category
            |--------------------------------------------------------------------------
            */

            'category_id' => $story->category_id,

            'category' => $story->category
                ? [
                    'id' => $story->category->id,
                    'name' => $story->category->name,
                    'slug' => $story->category->slug,
                    'description' =>
                        $story->category->description,
                ]
                : null,

            /*
            |--------------------------------------------------------------------------
            | Story information
            |--------------------------------------------------------------------------
            */

            'class_name' => $story->class_name,

            'event_date' => $story->event_date,

            'excerpt' => $story->excerpt,

            'content' => $story->content,

            /*
            |--------------------------------------------------------------------------
            | AUTHOR
            |--------------------------------------------------------------------------
            |
            | This field is intentionally included in the
            | public API response.
            |
            */

            'author' => $story->author,

            /*
            |--------------------------------------------------------------------------
            | Image
            |--------------------------------------------------------------------------
            */

            'image_path' => $story->image_path,

            'image_url' => $this->getImageUrl(
                $story->image_path
            ),

            /*
            |--------------------------------------------------------------------------
            | Publishing
            |--------------------------------------------------------------------------
            */

            'featured' => (bool) $story->featured,

            'status' => $story->status,

            'published_at' => $story->published_at,

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            'created_at' => $story->created_at,

            'updated_at' => $story->updated_at,
        ];
    }


    /**
     * Generate the public image URL.
     */
    private function getImageUrl(
        ?string $imagePath
    ): ?string {
        if (!$imagePath) {
            return null;
        }

        return Storage::disk('public')->url(
            $imagePath
        );
    }
}

