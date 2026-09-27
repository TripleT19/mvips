<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EventController extends Controller
{
    /**
     * Public events.
     *
     * Only published events that have not expired
     * are returned.
     */
    public function publicIndex(Request $request)
    {
        $now = now();

        $query = Event::query()
            ->where('status', 'published')
            ->where(function ($query) use ($now) {

                /*
                 * Future dates are always active.
                 */
                $query->whereDate(
                    'event_date',
                    '>',
                    $now->toDateString()
                )

                /*
                 * Today's events:
                 *
                 * If there is no end time, keep the event
                 * visible for the whole day.
                 *
                 * If there is an end time, only keep it
                 * visible until that time.
                 */
                ->orWhere(function ($query) use ($now) {
                    $query->whereDate(
                        'event_date',
                        $now->toDateString()
                    )
                    ->where(function ($query) use ($now) {
                        $query->whereNull('end_time')
                            ->orWhere(
                                'end_time',
                                '>',
                                $now->format('H:i:s')
                            );
                    });
                });
            });

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where(
                    'title',
                    'like',
                    "%{$search}%"
                )
                    ->orWhere(
                        'description',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'location',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'class_name',
                        'like',
                        "%{$search}%"
                    );
            });
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

        $query
            ->orderBy('event_date')
            ->orderBy('start_time');

        $events = $query->paginate(
            min(
                $request->integer('per_page', 12),
                50
            )
        );

        return response()->json([
            'success' => true,
            'data' => $events->through(
                fn ($event) => $this->formatEvent($event)
            ),
        ]);
    }

    /**
     * Public single event.
     */
    public function showPublic(string $slug)
    {
        $now = now();

        $event = Event::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where(function ($query) use ($now) {
                $query->whereDate(
                    'event_date',
                    '>',
                    $now->toDateString()
                )
                    ->orWhere(function ($query) use ($now) {
                        $query->whereDate(
                            'event_date',
                            $now->toDateString()
                        )
                            ->where(function ($query) use ($now) {
                                $query->whereNull('end_time')
                                    ->orWhere(
                                        'end_time',
                                        '>',
                                        $now->format('H:i:s')
                                    );
                            });
                    });
            })
            ->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatEvent($event),
        ]);
    }

    /**
     * Admin events list.
     *
     * Includes expired events so administrators
     * can still see and manage them.
     */
    public function index(Request $request)
    {
        $query = Event::query();

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where(
                    'title',
                    'like',
                    "%{$search}%"
                )
                    ->orWhere(
                        'description',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'location',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'class_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'author',
                        'like',
                        "%{$search}%"
                    );
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

        if ($request->input('sort') === 'oldest') {
            $query
                ->orderBy('event_date')
                ->orderBy('start_time');
        } else {
            $query
                ->orderByDesc('event_date')
                ->orderByDesc('start_time');
        }

        $events = $query->paginate(
            min(
                $request->integer('per_page', 20),
                50
            )
        );

        return response()->json([
            'success' => true,
            'data' => $events->through(
                fn ($event) => $this->formatEvent($event)
            ),
        ]);
    }

    /**
     * Create event.
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

            'location' => [
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
                'required',
                'date',
            ],

            'start_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'end_time' => [
                'nullable',
                'date_format:H:i',
                'after_or_equal:start_time',
            ],

            'image' => [
                'nullable',
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

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request
                ->file('image')
                ->store(
                    'events',
                    'public'
                );
        }

        $event = Event::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'location' => $validated['location'] ?? null,
            'class_name' => $validated['class_name'] ?? null,
            'event_date' => $validated['event_date'],
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'image_path' => $imagePath,
            'author' => $user?->name,
            'featured' => $request->boolean('featured'),
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event created successfully.',
            'data' => $this->formatEvent($event),
        ], 201);
    }

    /**
     * Admin single event.
     */
    public function show(Event $event)
    {
        return response()->json([
            'success' => true,
            'data' => $this->formatEvent($event),
        ]);
    }

    /**
     * Update event.
     */
    public function update(
        Request $request,
        Event $event
    ) {
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

            'location' => [
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
                'required',
                'date',
            ],

            'start_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'end_time' => [
                'nullable',
                'date_format:H:i',
                'after_or_equal:start_time',
            ],

            'image' => [
                'nullable',
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

        $slug = $event->slug;

        if (
            isset($validated['slug']) &&
            $validated['slug'] &&
            $validated['slug'] !== $event->slug
        ) {
            $slug = $this->generateUniqueSlug(
                $validated['slug'],
                $event->id
            );
        }

        $imagePath = $event->image_path;

        if ($request->hasFile('image')) {
            if ($event->image_path) {
                Storage::disk('public')->delete(
                    $event->image_path
                );
            }

            $imagePath = $request
                ->file('image')
                ->store(
                    'events',
                    'public'
                );
        }

        $event->update([
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'location' => $validated['location'] ?? null,
            'class_name' => $validated['class_name'] ?? null,
            'event_date' => $validated['event_date'],
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'image_path' => $imagePath,
            'featured' => $request->boolean('featured'),
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event updated successfully.',
            'data' => $this->formatEvent(
                $event->fresh()
            ),
        ]);
    }

    /**
     * Delete event.
     */
    public function destroy(Event $event)
    {
        if ($event->image_path) {
            Storage::disk('public')->delete(
                $event->image_path
            );
        }

        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Event deleted successfully.',
        ]);
    }

    /**
     * Generate unique slug.
     */
    private function generateUniqueSlug(
        string $value,
        ?int $ignoreId = null
    ): string {
        $baseSlug = Str::slug($value);

        if (!$baseSlug) {
            $baseSlug = 'event';
        }

        $slug = $baseSlug;
        $counter = 2;

        while (
            Event::where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn ($query) =>
                        $query->where(
                            'id',
                            '!=',
                            $ignoreId
                        )
                )
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Format event response.
     */
    private function formatEvent(Event $event): array
    {
        return [
            'id' => $event->id,
            'title' => $event->title,
            'slug' => $event->slug,
            'description' => $event->description,
            'location' => $event->location,
            'class_name' => $event->class_name,
            'event_date' => $event->event_date,
            'start_time' => $event->start_time,
            'end_time' => $event->end_time,
            'image_path' => $event->image_path,
            'image_url' => $event->image_url,
            'author' => $event->author,
            'featured' => (bool) $event->featured,
            'status' => $event->status,
            'created_at' => $event->created_at,
            'updated_at' => $event->updated_at,
        ];
    }
}