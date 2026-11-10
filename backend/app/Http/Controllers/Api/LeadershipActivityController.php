<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeadershipActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class LeadershipActivityController extends Controller
{
    /**
     * Maximum number of words allowed in the story field.
     */
    private const MAX_STORY_WORDS = 100;

    /* =========================================================
       PUBLIC
    ========================================================= */

    public function publicIndex(Request $request)
    {
        $query = LeadershipActivity::query()->where('status', 'published');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('year')) {
            $query->whereYear('activity_date', (int) $request->input('year'));
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('story', 'like', "%{$search}%");
            });
        }

        $query->orderByDesc('featured')
            ->orderByDesc('activity_date')
            ->orderByDesc('id');

        $perPage = min(max((int) $request->input('per_page', 12), 1), 50);

        $activities = $query->paginate($perPage);

        $activities->getCollection()->transform(fn ($a) => $this->format($a));

        return response()->json([
            'success'    => true,
            'data'       => $activities,
            'categories' => $this->availableCategories(),
        ]);
    }

    public function publicShow(string $slug)
    {
        $activity = LeadershipActivity::where('slug', $slug)
            ->where('status', 'published')
            ->first();

        if (! $activity) {
            return response()->json([
                'success' => false,
                'message' => 'Activity not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $this->format($activity),
        ]);
    }

    /* =========================================================
       ADMIN
    ========================================================= */

    public function index(Request $request)
    {
        $query = LeadershipActivity::query();

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('story', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $query->orderByDesc('activity_date')->orderByDesc('id');

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        $activities = $query->paginate($perPage);

        $activities->getCollection()->transform(fn ($a) => $this->format($a));

        return response()->json([
            'success'    => true,
            'data'       => $activities,
            'categories' => $this->availableCategories(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'         => ['required', 'string', 'max:255'],
            'story'         => $this->storyRules(),
            'category'      => ['nullable', 'string', 'max:100'],
            'participants'  => ['nullable', 'string', 'max:255'],
            'activity_date' => ['required', 'date'],
            'featured'      => ['nullable', 'boolean'],
            'status'        => ['required', Rule::in(['draft', 'published'])],
            'image'         => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('leadership-activities', 'public');
        }

        $activity = LeadershipActivity::create([
            'title'         => trim($validated['title']),
            'slug'          => LeadershipActivity::generateUniqueSlug($validated['title']),
            'story'         => $validated['story'],
            'image_path'    => $imagePath,
            'category'      => $validated['category'] ?? null,
            'participants'  => $validated['participants'] ?? null,
            'activity_date' => $validated['activity_date'],
            'featured'      => $request->boolean('featured'),
            'status'        => $validated['status'],
            'created_by'    => $request->user()?->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Leadership activity created successfully.',
            'data'    => $this->format($activity),
        ], 201);
    }

    public function show(LeadershipActivity $leadershipActivity)
    {
        return response()->json([
            'success' => true,
            'data'    => $this->format($leadershipActivity),
        ]);
    }

    public function update(Request $request, LeadershipActivity $leadershipActivity)
    {
        $validated = $request->validate([
            'title'         => ['required', 'string', 'max:255'],
            'story'         => $this->storyRules(),
            'category'      => ['nullable', 'string', 'max:100'],
            'participants'  => ['nullable', 'string', 'max:255'],
            'activity_date' => ['required', 'date'],
            'featured'      => ['nullable', 'boolean'],
            'status'        => ['required', Rule::in(['draft', 'published'])],
            'image'         => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_image'  => ['nullable', 'boolean'],
        ]);

        $leadershipActivity->title         = trim($validated['title']);
        $leadershipActivity->story         = $validated['story'];
        $leadershipActivity->category      = $validated['category'] ?? null;
        $leadershipActivity->participants  = $validated['participants'] ?? null;
        $leadershipActivity->activity_date = $validated['activity_date'];
        $leadershipActivity->featured      = $request->boolean('featured');
        $leadershipActivity->status        = $validated['status'];

        // Regenerate slug if the title changed
        if (trim($leadershipActivity->getOriginal('title')) !== trim($validated['title'])) {
            $leadershipActivity->slug = LeadershipActivity::generateUniqueSlug(
                $validated['title'],
                $leadershipActivity->id
            );
        }

        // Remove image
        if ($request->boolean('remove_image') && $leadershipActivity->image_path) {
            Storage::disk('public')->delete($leadershipActivity->image_path);
            $leadershipActivity->image_path = null;
        }

        // Replace image
        if ($request->hasFile('image')) {
            if ($leadershipActivity->image_path) {
                Storage::disk('public')->delete($leadershipActivity->image_path);
            }
            $leadershipActivity->image_path = $request
                ->file('image')
                ->store('leadership-activities', 'public');
        }

        $leadershipActivity->save();

        return response()->json([
            'success' => true,
            'message' => 'Leadership activity updated successfully.',
            'data'    => $this->format($leadershipActivity->fresh()),
        ]);
    }

    public function destroy(LeadershipActivity $leadershipActivity)
    {
        if ($leadershipActivity->image_path) {
            Storage::disk('public')->delete($leadershipActivity->image_path);
        }

        $leadershipActivity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Leadership activity deleted successfully.',
        ]);
    }

    /* =========================================================
       HELPERS
    ========================================================= */

    /**
     * Story validation rules — 100-word ceiling enforced server-side.
     */
    private function storyRules(): array
    {
        return [
            'required',
            'string',
            function ($attribute, $value, $fail) {
                $words = preg_split('/\s+/u', trim(strip_tags((string) $value)), -1, PREG_SPLIT_NO_EMPTY);
                if (count($words) > self::MAX_STORY_WORDS) {
                    $fail('The story must not exceed ' . self::MAX_STORY_WORDS . ' words.');
                }
            },
        ];
    }

    private function availableCategories(): array
    {
        return LeadershipActivity::query()
            ->whereNotNull('category')
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray();
    }

    private function format(LeadershipActivity $a): array
    {
        return [
            'id'            => $a->id,
            'title'         => $a->title,
            'slug'          => $a->slug,
            'story'         => $a->story,
            'category'      => $a->category,
            'participants'  => $a->participants,
            'activity_date' => optional($a->activity_date)->toDateString(),
            'image_url'     => $a->image_url,
            'featured'      => (bool) $a->featured,
            'status'        => $a->status,
            'created_at'    => $a->created_at,
        ];
    }
}