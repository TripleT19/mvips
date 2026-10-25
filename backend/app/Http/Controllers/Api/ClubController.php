<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClubController extends Controller
{
    public function index(Request $request)
    {
        $query = Club::query();

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->input('status') === 'active');
        }

        $clubs = $query
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $clubs,
        ]);
    }

    public function store(Request $request)
    {
        $this->guard($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:clubs,name'],
            'description' => ['nullable', 'string'],
            'colour' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $club = Club::create([
            'name' => trim($validated['name']),
            'description' => $validated['description'] ?? null,
            'colour' => $validated['colour'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Club created successfully.',
            'data' => $club,
        ], 201);
    }

    public function update(Request $request, Club $club)
    {
        $this->guard($request);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('clubs', 'name')->ignore($club->id),
            ],
            'description' => ['nullable', 'string'],
            'colour' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $club->update([
            'name' => trim($validated['name']),
            'description' => $validated['description'] ?? $club->description,
            'colour' => $validated['colour'] ?? $club->colour,
            'sort_order' => $validated['sort_order'] ?? $club->sort_order,
            'is_active' => $validated['is_active'] ?? $club->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Club updated successfully.',
            'data' => $club->fresh(),
        ]);
    }

    public function destroy(Request $request, Club $club)
    {
        $this->guard($request);

        if ($club->assignments()->where('is_active', true)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This club has active teacher assignments. Remove them first or deactivate the club.',
            ], 422);
        }

        $club->delete();

        return response()->json([
            'success' => true,
            'message' => 'Club deleted successfully.',
        ]);
    }

    private function guard(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['admin', 'administrator', 'headteacher'], true),
            403,
            'Only administrators and headteachers can manage clubs.'
        );
    }
}