<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PolicyController extends Controller
{
    /* ============================================================
     |  PUBLIC API
     ============================================================ */

    /**
     * GET /api/policies
     */
    public function publicIndex(Request $request): JsonResponse
    {
        $query = Policy::query()->active()->ordered();

        if ($request->filled('category')) {
            $query->where('category', (string) $request->string('category'));
        }

        if ($request->filled('search')) {
            $q = (string) $request->string('search');
            $query->where(function ($w) use ($q) {
                $w->where('title', 'like', "%{$q}%")
                  ->orWhere('description', 'like', "%{$q}%")
                  ->orWhere('version', 'like', "%{$q}%");
            });
        }

        return response()->json([
            'data'       => $query->get()->map(fn ($p) => $this->serializePublic($p)),
            'categories' => Policy::categories(),
        ]);
    }

    /**
     * GET /api/policies/{policy}
     */
    public function publicShow(Policy $policy): JsonResponse
    {
        abort_unless($policy->is_active, 404);

        return response()->json([
            'data' => $this->serializePublic($policy),
        ]);
    }

    /**
     * GET /api/policies/{policy}/download
     */
    public function publicDownload(Policy $policy)
    {
        abort_unless($policy->is_active, 404);
        abort_unless($policy->file_path, 404);

        $disk = $policy->file_disk ?: 'public';

        if (! Storage::disk($disk)->exists($policy->file_path)) {
            abort(404);
        }

        $downloadName = $policy->file_name ?: basename($policy->file_path);

        return Storage::disk($disk)->download($policy->file_path, $downloadName);
    }

    /* ============================================================
     |  ADMIN API
     ============================================================ */

    /**
     * GET /api/admin/policies
     */
    public function index(Request $request): JsonResponse
    {
        $query = Policy::query()->with('uploadedBy:id,name');

        if ($request->filled('category')) {
            $query->where('category', (string) $request->string('category'));
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $q = (string) $request->string('search');
            $query->where(function ($w) use ($q) {
                $w->where('title', 'like', "%{$q}%")
                  ->orWhere('description', 'like', "%{$q}%")
                  ->orWhere('version', 'like', "%{$q}%");
            });
        }

        return response()->json([
            'data'       => $query->ordered()->get()->map(fn ($p) => $this->serialize($p)),
            'categories' => Policy::categories(),
        ]);
    }

    /**
     * POST /api/admin/policies  (multipart/form-data)
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedPayload($request, requireFile: true);

        $policy = new Policy($data);
        $policy->uploaded_by = $request->user()?->id;

        if ($request->hasFile('file')) {
            $this->attachFile($policy, $request->file('file'));
        }

        $policy->save();

        return response()->json([
            'message' => 'Policy uploaded.',
            'data'    => $this->serialize($policy->fresh('uploadedBy')),
        ], 201);
    }

    /**
     * PUT / PATCH /api/admin/policies/{policy}  (multipart/form-data)
     */
    public function update(Request $request, Policy $policy): JsonResponse
    {
        $data = $this->validatedPayload($request, requireFile: false, policy: $policy);

        $policy->fill($data);

        if ($request->hasFile('file')) {
            $this->deleteFile($policy);
            $this->attachFile($policy, $request->file('file'));
        } elseif ($request->boolean('remove_file')) {
            $this->deleteFile($policy);
        }

        $policy->save();

        return response()->json([
            'message' => 'Policy updated.',
            'data'    => $this->serialize($policy->fresh('uploadedBy')),
        ]);
    }

    /**
     * DELETE /api/admin/policies/{policy}
     */
    public function destroy(Policy $policy): JsonResponse
    {
        $this->deleteFile($policy);
        $policy->delete();  // soft delete

        return response()->json(['message' => 'Policy deleted.']);
    }

    /* ============================================================
     |  INTERNALS
     ============================================================ */

    private function validatedPayload(
        Request $request,
        bool $requireFile,
        ?Policy $policy = null
    ): array {
        $categories = array_keys(Policy::categories());

        $data = $request->validate([
            'title'          => ['required', 'string', 'max:255'],
            'category'       => ['required', 'string', Rule::in($categories)],
            'description'    => ['nullable', 'string', 'max:2000'],
            'version'        => ['nullable', 'string', 'max:50'],
            'effective_date' => ['nullable', 'date'],
            'sort_order'     => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active'      => ['nullable', 'boolean'],
            'file'           => [
                $requireFile ? 'required' : 'nullable',
                'file',
                'max:20480',          // 20 MB (in KB)
                'mimes:pdf,doc,docx,png,jpg,jpeg,webp',
            ],
            'remove_file'    => ['nullable', 'boolean'],
        ]);

        return [
            'title'          => $data['title'],
            'category'       => $data['category'],
            'description'    => $data['description'] ?? null,
            'version'        => $data['version'] ?? null,
            'effective_date' => $data['effective_date'] ?? null,
            'sort_order'     => isset($data['sort_order']) ? (int) $data['sort_order'] : 0,
            'is_active'      => $request->has('is_active')
                                    ? $request->boolean('is_active')
                                    : ($policy?->is_active ?? true),
        ];
    }

    private function attachFile(Policy $policy, $file): void
    {
        $disk      = 'public';
        $directory = 'policies';

        $originalName = $file->getClientOriginalName();
        $extension    = strtolower($file->getClientOriginalExtension() ?: 'pdf');
        $baseName     = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) ?: 'policy';
        $safeName     = $baseName . '-' . Str::lower(Str::random(8)) . '.' . $extension;

        $path = $file->storeAs($directory, $safeName, $disk);

        $policy->file_path = $path;
        $policy->file_name = $originalName;
        $policy->file_size = $file->getSize();
        $policy->file_type = $file->getMimeType();
        $policy->file_disk = $disk;
    }

    private function deleteFile(Policy $policy): void
    {
        if ($policy->file_path) {
            $disk = $policy->file_disk ?: 'public';
            if (Storage::disk($disk)->exists($policy->file_path)) {
                Storage::disk($disk)->delete($policy->file_path);
            }
        }

        $policy->file_path = null;
        $policy->file_name = null;
        $policy->file_size = null;
        $policy->file_type = null;
    }

    private function serialize(Policy $policy): array
    {
        return [
            'id'             => $policy->id,
            'title'          => $policy->title,
            'category'       => $policy->category,
            'description'    => $policy->description,
            'file_url'       => $policy->file_url,
            'file_name'      => $policy->file_name,
            'file_size'      => $policy->file_size,
            'file_type'      => $policy->file_type,
            'version'        => $policy->version,
            'effective_date' => optional($policy->effective_date)->toDateString(),
            'is_active'      => (bool) $policy->is_active,
            'sort_order'     => (int) $policy->sort_order,
            'uploaded_by'    => $policy->uploadedBy?->name,
            'created_at'     => $policy->created_at?->toIso8601String(),
            'updated_at'     => $policy->updated_at?->toIso8601String(),
        ];
    }

    private function serializePublic(Policy $policy): array
    {
        // Public payload — don't leak uploader name or internal disk
        return [
            'id'             => $policy->id,
            'title'          => $policy->title,
            'category'       => $policy->category,
            'description'    => $policy->description,
            'file_url'       => $policy->file_url,
            'file_name'      => $policy->file_name,
            'file_size'      => $policy->file_size,
            'file_type'      => $policy->file_type,
            'version'        => $policy->version,
            'effective_date' => optional($policy->effective_date)->toDateString(),
            'updated_at'     => $policy->updated_at?->toIso8601String(),
        ];
    }
}