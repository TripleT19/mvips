<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoryController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | ADMIN: LIST STORIES
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $query = Story::with('category')
            ->latest('created_at');

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
                    ->orWhere('class_name', 'like', "%{$search}%");
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Status Filter
        |--------------------------------------------------------------------------
        */

        if (
            $request->filled('status') &&
            in_array(
                $request->input('status'),
                ['draft', 'published'],
                true
            )
        ) {
            $query->where(
                'status',
                $request->input('status')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Category Filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('category_id')) {
            $query->where(
                'category_id',
                $request->input('category_id')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        $stories = $query->paginate(10);

        return response()->json([
            'success' => true,

            'data' => $stories
                ->getCollection()
                ->map(fn ($story) =>
                    $this->formatStory($story)
                )
                ->values(),

            'pagination' => [
                'current_page' => $stories->currentPage(),
                'last_page' => $stories->lastPage(),
                'per_page' => $stories->perPage(),
                'total' => $stories->total(),
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PUBLIC: LIST PUBLISHED STORIES
    |--------------------------------------------------------------------------
    */

    public function publicIndex(Request $request)
    {
        $query = Story::with('category')
            ->where('status', 'published')
            ->whereNotNull('published_date')
            ->where(
                'published_date',
                '<=',
                now()
            )
            ->latest('published_date');

        /*
        |--------------------------------------------------------------------------
        | Optional Public Category Filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('category')) {
            $query->whereHas(
                'category',
                function ($q) use ($request) {
                    $q->where(
                        'slug',
                        $request->input('category')
                    );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Optional Public Search
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = trim(
                $request->input('search')
            );

            $query->where(function ($q) use ($search) {
                $q->where(
                    'title',
                    'like',
                    "%{$search}%"
                )
                    ->orWhere(
                        'excerpt',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'content',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        $stories = $query->paginate(12);

        return response()->json([
            'success' => true,

            'data' => $stories
                ->getCollection()
                ->map(fn ($story) =>
                    $this->formatStory($story)
                )
                ->values(),

            'pagination' => [
                'current_page' => $stories->currentPage(),
                'last_page' => $stories->lastPage(),
                'per_page' => $stories->perPage(),
                'total' => $stories->total(),
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PUBLIC: SHOW STORY BY SLUG
    |--------------------------------------------------------------------------
    */

    public function showPublic(string $slug)
    {
        $story = Story::with('category')
            ->where('slug', $slug)
            ->where('status', 'published')
            ->whereNotNull('published_date')
            ->where(
                'published_date',
                '<=',
                now()
            )
            ->first();

        if (!$story) {
            return response()->json([
                'success' => false,
                'message' => 'Story not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'story' => $this->formatStory($story),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | ADMIN: CREATE STORY
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Authenticated User
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        | The author is NEVER accepted from the frontend.
        | It is taken directly from the authenticated database user.
        |
        */

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

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

            'class_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'event_date' => [
                'nullable',
                'date',
            ],

            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
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
                'required',
                Rule::in([
                    'draft',
                    'published',
                ]),
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
        | Generate Unique Slug
        |--------------------------------------------------------------------------
        */

        $slug = $this->generateUniqueSlug(
            $validated['slug']
                ?? $validated['title']
        );

        /*
        |--------------------------------------------------------------------------
        | Upload Image
        |--------------------------------------------------------------------------
        */

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request
                ->file('image')
                ->store(
                    'stories',
                    'public'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Published Date
        |--------------------------------------------------------------------------
        */

        $publishedDate = null;

        if ($validated['status'] === 'published') {
            $publishedDate = now();
        }

        /*
        |--------------------------------------------------------------------------
        | Create Story
        |--------------------------------------------------------------------------
        */

        $story = Story::create([
            'title' => $validated['title'],

            'slug' => $slug,

            /*
            |--------------------------------------------------------------------------
            | AUTHOR COMES FROM DATABASE
            |--------------------------------------------------------------------------
            */

            'author' => $user->name,

            'class_name' =>
                $validated['class_name'] ?? null,

            'event_date' =>
                $validated['event_date'] ?? null,

            'category_id' =>
                $validated['category_id'],

            'image_path' =>
                $imagePath,

            'excerpt' =>
                $validated['excerpt'] ?? null,

            'content' =>
                $validated['content'],

            'featured' =>
                $request->boolean('featured'),

            'status' =>
                $validated['status'],

            'published_date' =>
                $publishedDate,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Load Category
        |--------------------------------------------------------------------------
        */

        $story->load('category');

        return response()->json([
            'success' => true,

            'message' =>
                'Story created successfully.',

            'story' =>
                $this->formatStory($story),
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | ADMIN: SHOW STORY
    |--------------------------------------------------------------------------
    */

    public function show(Story $story)
    {
        $story->load('category');

        return response()->json([
            'success' => true,

            'story' =>
                $this->formatStory($story),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | ADMIN: UPDATE STORY
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        Story $story
    ) {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

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

            'class_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'event_date' => [
                'nullable',
                'date',
            ],

            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
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
                'required',
                Rule::in([
                    'draft',
                    'published',
                ]),
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
        | Slug
        |--------------------------------------------------------------------------
        */

        $slugSource =
            $validated['slug']
            ?? $validated['title'];

        $slug = $this->generateUniqueSlug(
            $slugSource,
            $story->id
        );

        /*
        |--------------------------------------------------------------------------
        | Existing Published Date
        |--------------------------------------------------------------------------
        */

        $publishedDate =
            $story->published_date;

        /*
        |--------------------------------------------------------------------------
        | Draft -> Published
        |--------------------------------------------------------------------------
        */

        if (
            $validated['status'] === 'published' &&
            !$story->published_date
        ) {
            $publishedDate = now();
        }

        /*
        |--------------------------------------------------------------------------
        | Published -> Draft
        |--------------------------------------------------------------------------
        */

        if (
            $validated['status'] === 'draft'
        ) {
            $publishedDate = null;
        }

        /*
        |--------------------------------------------------------------------------
        | Image
        |--------------------------------------------------------------------------
        */

        $imagePath =
            $story->image_path;

        if ($request->hasFile('image')) {

            /*
            |--------------------------------------------------------------------------
            | Delete Previous Image
            |--------------------------------------------------------------------------
            */

            if (
                $story->image_path &&
                Storage::disk('public')
                    ->exists(
                        $story->image_path
                    )
            ) {
                Storage::disk('public')
                    ->delete(
                        $story->image_path
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | Store New Image
            |--------------------------------------------------------------------------
            */

            $imagePath = $request
                ->file('image')
                ->store(
                    'stories',
                    'public'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Update Story
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        | The original author is intentionally NOT changed.
        |
        */

        $story->update([
            'title' =>
                $validated['title'],

            'slug' =>
                $slug,

            /*
            |--------------------------------------------------------------------------
            | DO NOT CHANGE AUTHOR
            |--------------------------------------------------------------------------
            |
            | The original creator remains the author even when another
            | administrator edits the story.
            |
            */

            'class_name' =>
                $validated['class_name'] ?? null,

            'event_date' =>
                $validated['event_date'] ?? null,

            'category_id' =>
                $validated['category_id'],

            'image_path' =>
                $imagePath,

            'excerpt' =>
                $validated['excerpt'] ?? null,

            'content' =>
                $validated['content'],

            'featured' =>
                $request->boolean('featured'),

            'status' =>
                $validated['status'],

            'published_date' =>
                $publishedDate,
        ]);

        $story->load('category');

        return response()->json([
            'success' => true,

            'message' =>
                'Story updated successfully.',

            'story' =>
                $this->formatStory($story),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | ADMIN: DELETE STORY
    |--------------------------------------------------------------------------
    */

    public function destroy(Story $story)
    {
        /*
        |--------------------------------------------------------------------------
        | Delete Story Image
        |--------------------------------------------------------------------------
        */

        if (
            $story->image_path &&
            Storage::disk('public')
                ->exists(
                    $story->image_path
                )
        ) {
            Storage::disk('public')
                ->delete(
                    $story->image_path
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Delete Story
        |--------------------------------------------------------------------------
        */

        $story->delete();

        return response()->json([
            'success' => true,

            'message' =>
                'Story deleted successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | GENERATE UNIQUE SLUG
    |--------------------------------------------------------------------------
    */

    private function generateUniqueSlug(
        string $value,
        ?int $ignoreId = null
    ): string {
        $slug = Str::slug($value);

        /*
        |--------------------------------------------------------------------------
        | Fallback
        |--------------------------------------------------------------------------
        */

        if (!$slug) {
            $slug = 'story';
        }

        $originalSlug = $slug;

        $counter = 1;

        while (true) {

            $query = Story::where(
                'slug',
                $slug
            );

            if ($ignoreId) {
                $query->where(
                    'id',
                    '!=',
                    $ignoreId
                );
            }

            if (!$query->exists()) {
                break;
            }

            $counter++;

            $slug =
                $originalSlug .
                '-' .
                $counter;
        }

        return $slug;
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT STORY
    |--------------------------------------------------------------------------
    */

    private function formatStory(
        Story $story
    ): array {
        return [
            'id' =>
                $story->id,

            'title' =>
                $story->title,

            'slug' =>
                $story->slug,

            /*
            |--------------------------------------------------------------------------
            | Original Creator
            |--------------------------------------------------------------------------
            */

            'author' =>
                $story->author,

            'class_name' =>
                $story->class_name,

            'event_date' =>
                $story->event_date,

            'published_date' =>
                $story->published_date,

            'category_id' =>
                $story->category_id,

            'category' =>
                $story->category
                    ? [
                        'id' =>
                            $story->category->id,

                        'name' =>
                            $story->category->name,

                        'slug' =>
                            $story->category->slug,
                    ]
                    : null,

            'image_path' =>
                $story->image_path,

            'image_url' =>
                $story->image_path
                    ? Storage::disk('public')
                        ->url(
                            $story->image_path
                        )
                    : null,

            'excerpt' =>
                $story->excerpt,

            'content' =>
                $story->content,

            'featured' =>
                (bool) $story->featured,

            'status' =>
                $story->status,

            'created_at' =>
                $story->created_at,

            'updated_at' =>
                $story->updated_at,
        ];
    }
}