<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendNewsletterToSubscribers;
use App\Models\Newsletter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NewsletterController extends Controller
{
    /* =========================================================
       PUBLIC
    ========================================================= */

    /**
     * List published newsletters (newest first).
     *
     * Query params:
     *  - year=2025
     *  - term=Term 1
     *  - search=...
     *  - per_page=20
     */
    public function publicIndex(Request $request)
    {
        $query = Newsletter::query()->where('status', 'published');

        if ($request->filled('year')) {
            $query->where('year', (int) $request->input('year'));
        }

        if ($request->filled('term')) {
            $query->where('term', $request->input('term'));
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $query->orderByDesc('published_on')
            ->orderByDesc('year')
            ->orderByDesc('id');

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        $newsletters = $query->paginate($perPage);

        $newsletters->getCollection()->transform(
            fn (Newsletter $n) => $this->format($n)
        );

        return response()->json([
            'success' => true,
            'data' => $newsletters,
            'years' => $this->availableYears(),
            'terms' => $this->availableTerms(),
        ]);
    }

    /**
     * Single newsletter by slug.
     */
    public function publicShow(string $slug)
    {
        $newsletter = Newsletter::where('slug', $slug)
            ->where('status', 'published')
            ->first();

        if (!$newsletter) {
            return response()->json([
                'success' => false,
                'message' => 'Newsletter not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->format($newsletter),
        ]);
    }

    /**
     * Stream a download of the newsletter PDF.
     */
    public function download(string $slug): StreamedResponse
    {
        $newsletter = Newsletter::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $disk = Storage::disk('public');

        if (!$newsletter->file_path || !$disk->exists($newsletter->file_path)) {
            abort(404, 'Newsletter file not found.');
        }

        $filename = $newsletter->file_original_name
            ?: basename($newsletter->file_path);

        return $disk->download($newsletter->file_path, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /* =========================================================
       ADMIN
    ========================================================= */

    /**
     * Admin list.
     */
    public function index(Request $request)
    {
        $query = Newsletter::query();

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('year')) {
            $query->where('year', (int) $request->input('year'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $query->orderByDesc('published_on')->orderByDesc('id');

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        $newsletters = $query->paginate($perPage);

        $newsletters->getCollection()->transform(
            fn (Newsletter $n) => $this->format($n)
        );

        return response()->json([
            'success' => true,
            'data' => $newsletters,
            'years' => $this->availableYears(),
        ]);
    }

    /**
     * Create a new newsletter.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'term' => ['nullable', 'string', 'max:50'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'published_on' => ['nullable', 'date'],
            'featured' => ['nullable', 'boolean'],
            'status' => ['required', Rule::in(['draft', 'published'])],

            'file' => [
                'required',
                'file',
                'mimes:pdf',
                'max:20480', // 20 MB
            ],

            'cover' => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],
        ]);

        $file = $request->file('file');
        $filePath = $file->store('newsletters', 'public');

        $coverPath = null;
        if ($request->hasFile('cover')) {
            $coverPath = $request
                ->file('cover')
                ->store('newsletters/covers', 'public');
        }

        $newsletter = Newsletter::create([
            'title' => trim($validated['title']),
            'slug' => Newsletter::generateUniqueSlug($validated['title']),
            'description' => $validated['description'] ?? null,
            'term' => $validated['term'] ?? null,
            'year' => (int) $validated['year'],
            'published_on' => $validated['published_on'] ?? now()->toDateString(),
            'file_path' => $filePath,
            'file_original_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'cover_image_path' => $coverPath,
            'featured' => $request->boolean('featured'),
            'status' => $validated['status'],
            'uploaded_by' => $request->user()?->id,
        ]);

        // Notify subscribers when published at creation time
        if ($newsletter->status === 'published') {
            SendNewsletterToSubscribers::dispatch($newsletter->id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Newsletter uploaded successfully.',
            'data' => $this->format($newsletter),
        ], 201);
    }

    /**
     * Admin single newsletter.
     */
    public function show(Newsletter $newsletter)
    {
        return response()->json([
            'success' => true,
            'data' => $this->format($newsletter),
        ]);
    }

    /**
     * Update a newsletter.
     */
    public function update(Request $request, Newsletter $newsletter)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'term' => ['nullable', 'string', 'max:50'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'published_on' => ['nullable', 'date'],
            'featured' => ['nullable', 'boolean'],
            'status' => ['required', Rule::in(['draft', 'published'])],

            'file' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'cover' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],

            'remove_cover' => ['nullable', 'boolean'],
        ]);

        // Capture the previous status BEFORE any changes
        $wasPublished = $newsletter->getOriginal('status') === 'published';

        $newsletter->title = trim($validated['title']);
        $newsletter->description = $validated['description'] ?? null;
        $newsletter->term = $validated['term'] ?? null;
        $newsletter->year = (int) $validated['year'];
        $newsletter->published_on = $validated['published_on'] ?? $newsletter->published_on;
        $newsletter->featured = $request->boolean('featured');
        $newsletter->status = $validated['status'];

        // Regenerate the slug if the title changed
        if (trim($newsletter->getOriginal('title')) !== trim($validated['title'])) {
            $newsletter->slug = Newsletter::generateUniqueSlug(
                $validated['title'],
                $newsletter->id
            );
        }

        // Remove cover
        if ($request->boolean('remove_cover') && $newsletter->cover_image_path) {
            Storage::disk('public')->delete($newsletter->cover_image_path);
            $newsletter->cover_image_path = null;
        }

        // Replace cover
        if ($request->hasFile('cover')) {
            if ($newsletter->cover_image_path) {
                Storage::disk('public')->delete($newsletter->cover_image_path);
            }
            $newsletter->cover_image_path = $request
                ->file('cover')
                ->store('newsletters/covers', 'public');
        }

        // Replace PDF
        if ($request->hasFile('file')) {
            if ($newsletter->file_path) {
                Storage::disk('public')->delete($newsletter->file_path);
            }

            $file = $request->file('file');
            $newsletter->file_path = $file->store('newsletters', 'public');
            $newsletter->file_original_name = $file->getClientOriginalName();
            $newsletter->file_size = $file->getSize();
        }

        $newsletter->save();

        // Notify subscribers when transitioning from draft → published
        if (!$wasPublished && $newsletter->status === 'published') {
            SendNewsletterToSubscribers::dispatch($newsletter->id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Newsletter updated successfully.',
            'data' => $this->format($newsletter->fresh()),
        ]);
    }

    /**
     * Delete a newsletter.
     */
    public function destroy(Newsletter $newsletter)
    {
        if ($newsletter->file_path) {
            Storage::disk('public')->delete($newsletter->file_path);
        }

        if ($newsletter->cover_image_path) {
            Storage::disk('public')->delete($newsletter->cover_image_path);
        }

        $newsletter->delete();

        return response()->json([
            'success' => true,
            'message' => 'Newsletter deleted successfully.',
        ]);
    }

    /* =========================================================
       HELPERS
    ========================================================= */

    private function availableYears(): array
    {
        return Newsletter::where('status', 'published')
            ->select('year')
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->toArray();
    }

    private function availableTerms(): array
    {
        return Newsletter::where('status', 'published')
            ->whereNotNull('term')
            ->select('term')
            ->distinct()
            ->orderBy('term')
            ->pluck('term')
            ->toArray();
    }

    private function format(Newsletter $n): array
    {
        return [
            'id' => $n->id,
            'title' => $n->title,
            'slug' => $n->slug,
            'description' => $n->description,
            'term' => $n->term,
            'year' => $n->year,
            'published_on' => $n->published_on,
            'file_url' => $n->file_url,
            'file_original_name' => $n->file_original_name,
            'file_size' => $n->file_size,
            'cover_image_url' => $n->cover_image_url,
            'featured' => (bool) $n->featured,
            'status' => $n->status,
            'created_at' => $n->created_at,
        ];
    }
}