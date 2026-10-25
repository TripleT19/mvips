<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassStream;
use App\Models\SchoolClass;
use App\Models\Stream;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SchoolClassController extends Controller
{
    public function index(Request $request)
    {
        $query = SchoolClass::with(['classStreams.stream:id,name,code,colour']);

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('code', 'like', "%{$s}%");
            });
        }
        if ($request->filled('status')) {
            $query->where('is_active', $request->input('status') === 'active');
        }

        $rows = $query
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows,
        ]);
    }

    public function store(Request $request)
    {
        $this->guard($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:30', 'unique:school_classes,code'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'stream_ids' => ['nullable', 'array'],
            'stream_ids.*' => ['integer', 'exists:streams,id'],
        ]);

        $class = DB::transaction(function () use ($validated) {
            $class = SchoolClass::create([
                'name' => trim($validated['name']),
                'code' => !empty($validated['code'])
                    ? strtoupper(trim($validated['code']))
                    : null,
                'sort_order' => $validated['sort_order'] ?? 0,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $this->syncStreams($class, $validated['stream_ids'] ?? []);

            return $class;
        });

        return response()->json([
            'success' => true,
            'message' => 'Class created successfully.',
            'data' => $class->load('classStreams.stream:id,name,code,colour'),
        ], 201);
    }

    public function update(Request $request, SchoolClass $schoolClass)
    {
        $this->guard($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('school_classes', 'code')->ignore($schoolClass->id),
            ],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'stream_ids' => ['nullable', 'array'],
            'stream_ids.*' => ['integer', 'exists:streams,id'],
        ]);

        DB::transaction(function () use ($schoolClass, $validated) {
            $schoolClass->update([
                'name' => trim($validated['name']),
                'code' => !empty($validated['code'])
                    ? strtoupper(trim($validated['code']))
                    : null,
                'sort_order' => $validated['sort_order'] ?? $schoolClass->sort_order,
                'is_active' => $validated['is_active'] ?? $schoolClass->is_active,
            ]);

            if (array_key_exists('stream_ids', $validated)) {
                $this->syncStreams($schoolClass, $validated['stream_ids'] ?? []);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Class updated successfully.',
            'data' => $schoolClass->fresh()->load('classStreams.stream:id,name,code,colour'),
        ]);
    }

    public function destroy(Request $request, SchoolClass $schoolClass)
    {
        $this->guard($request);

        if ($schoolClass->students()->exists()
            || $schoolClass->teacherAssignments()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This class is in use. Deactivate it instead of deleting.',
            ], 422);
        }

        $schoolClass->delete();

        return response()->json([
            'success' => true,
            'message' => 'Class deleted.',
        ]);
    }

    /**
     * Reconcile the class's sections with the requested stream list.
     *
     * - Ticks a new stream → creates a class_streams row
     * - Un-ticks a stream  → deactivates the row (blocked if teachers/students exist)
     * - Re-ticks           → reactivates
     */
    private function syncStreams(SchoolClass $class, array $streamIds): void
    {
        $streamIds = array_values(array_unique(array_map('intval', $streamIds)));

        $existing = ClassStream::where('school_class_id', $class->id)
            ->get()
            ->keyBy('stream_id');

        // Deactivate streams no longer selected
        foreach ($existing as $streamId => $row) {
            if (!in_array($streamId, $streamIds, true)) {
                // Guard: don't deactivate if it has active teacher/student references
                $hasRefs = $row->teacherAssignments()->where('is_active', true)->exists()
                    || $row->students()->exists();

                if ($hasRefs) {
                    continue; // leave it in place, warn via controller caller
                }

                $row->update(['is_active' => false]);
            }
        }

        // Create or reactivate selected streams
        if (!empty($streamIds)) {
            $streams = Stream::whereIn('id', $streamIds)->get()->keyBy('id');

            foreach ($streamIds as $streamId) {
                $stream = $streams->get($streamId);
                if (!$stream) continue;

                $row = $existing->get($streamId);

                if ($row) {
                    if (!$row->is_active) {
                        $row->update(['is_active' => true, 'name' => trim("{$class->name} {$stream->name}")]);
                    } else {
                        // keep name in sync if class was renamed
                        $newName = trim("{$class->name} {$stream->name}");
                        if ($row->name !== $newName) {
                            $row->update(['name' => $newName]);
                        }
                    }
                } else {
                    ClassStream::create([
                        'school_class_id' => $class->id,
                        'stream_id' => $streamId,
                        'name' => trim("{$class->name} {$stream->name}"),
                        'is_active' => true,
                    ]);
                }
            }
        }
    }

    private function guard(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['admin', 'administrator', 'headteacher'], true),
            403,
            'Only administrators and headteachers can manage classes.'
        );
    }
}