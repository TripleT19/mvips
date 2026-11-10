<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\House;
use App\Models\HousePoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class HouseController extends Controller
{
    /* =========================================================
       PUBLIC
    ========================================================= */

    public function publicIndex(Request $request)
    {
        $yearId = $request->input('academic_year_id');
        if (! $yearId) {
            $current = AcademicYear::where('is_current', true)->first()
                ?? AcademicYear::orderByDesc('name')->first();
            $yearId = $current?->id;
        }

        $houses = House::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $pointsMap = HousePoint::where('academic_year_id', $yearId)
            ->pluck('points', 'house_id')
            ->toArray();

        $enriched = $houses->map(fn (House $h) => [
            'id'                 => $h->id,
            'name'               => $h->name,
            'code'               => $h->code,
            'colour'             => $h->colour,
            'image_url'          => $h->image_url,
            'featured_image_url' => $h->featured_image_url,
            'sort_order'         => $h->sort_order,
            'points'             => (int) ($pointsMap[$h->id] ?? 0),
        ])->toArray();

        // Rank by points desc, tie-break by sort_order
        usort($enriched, function ($a, $b) {
            if ($a['points'] !== $b['points']) return $b['points'] - $a['points'];
            return $a['sort_order'] - $b['sort_order'];
        });

        // Standard competition ranking (ties share a position)
        $prevPoints = null;
        $prevPos = 0;
        foreach ($enriched as $i => &$item) {
            if ($prevPoints !== null && $item['points'] === $prevPoints) {
                $item['position'] = $prevPos;
            } else {
                $item['position'] = $i + 1;
                $prevPos = $i + 1;
                $prevPoints = $item['points'];
            }
        }
        unset($item);

        $yearName = AcademicYear::where('id', $yearId)->value('name');

        return response()->json([
            'success'            => true,
            'data'               => $enriched,
            'academic_year_id'   => $yearId,
            'academic_year_name' => $yearName,
        ]);
    }

    /* =========================================================
       ADMIN
    ========================================================= */

    public function index(Request $request)
    {
        $yearId = $request->input('academic_year_id');
        if (! $yearId) {
            $current = AcademicYear::where('is_current', true)->first()
                ?? AcademicYear::orderByDesc('name')->first();
            $yearId = $current?->id;
        }

        $houses = House::orderBy('sort_order')->orderBy('name')->get();
        $pointsMap = HousePoint::where('academic_year_id', $yearId)
            ->pluck('points', 'house_id')
            ->toArray();

        $data = $houses->map(fn (House $h) => [
            'id'                 => $h->id,
            'name'               => $h->name,
            'code'               => $h->code,
            'colour'             => $h->colour,
            'image_url'          => $h->image_url,
            'featured_image_url' => $h->featured_image_url,
            'sort_order'         => $h->sort_order,
            'is_active'          => (bool) $h->is_active,
            'points'             => (int) ($pointsMap[$h->id] ?? 0),
        ]);

        return response()->json([
            'success'          => true,
            'data'             => $data,
            'academic_year_id' => $yearId,
            'years'            => AcademicYear::orderByDesc('name')
                ->get(['id', 'name', 'is_current']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:100'],
            'code'             => ['nullable', 'string', 'max:20', Rule::unique('houses', 'code')],
            'colour'           => ['nullable', 'string', 'max:20'],
            'sort_order'       => ['nullable', 'integer'],
            'is_active'        => ['nullable', 'boolean'],
            'image'            => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'featured_image'   => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('houses', 'public');
        }

        $featuredImagePath = null;
        if ($request->hasFile('featured_image')) {
            $featuredImagePath = $request
                ->file('featured_image')
                ->store('houses/featured', 'public');
        }

        $house = House::create([
            'name'                => trim($validated['name']),
            'code'                => $validated['code'] ?? null,
            'colour'              => $validated['colour'] ?? '#252B68',
            'image_path'          => $imagePath,
            'featured_image_path' => $featuredImagePath,
            'sort_order'          => $validated['sort_order'] ?? 0,
            'is_active'           => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'House created successfully.',
            'data'    => $this->format($house),
        ], 201);
    }

    public function update(Request $request, House $house)
    {
        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:100'],
            'code'                  => [
                'nullable', 'string', 'max:20',
                Rule::unique('houses', 'code')->ignore($house->id),
            ],
            'colour'                => ['nullable', 'string', 'max:20'],
            'sort_order'            => ['nullable', 'integer'],
            'is_active'             => ['nullable', 'boolean'],
            'image'                 => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'featured_image'        => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_image'          => ['nullable', 'boolean'],
            'remove_featured_image' => ['nullable', 'boolean'],
        ]);

        $house->name       = trim($validated['name']);
        $house->code       = $validated['code'] ?? $house->code;
        $house->colour     = $validated['colour'] ?? $house->colour;
        $house->sort_order = $validated['sort_order'] ?? $house->sort_order;
        $house->is_active  = $request->boolean('is_active', $house->is_active);

        /* ---- Logo/badge ---- */
        if ($request->boolean('remove_image') && $house->image_path) {
            Storage::disk('public')->delete($house->image_path);
            $house->image_path = null;
        }
        if ($request->hasFile('image')) {
            if ($house->image_path) {
                Storage::disk('public')->delete($house->image_path);
            }
            $house->image_path = $request->file('image')->store('houses', 'public');
        }

        /* ---- Champion featured image ---- */
        if ($request->boolean('remove_featured_image') && $house->featured_image_path) {
            Storage::disk('public')->delete($house->featured_image_path);
            $house->featured_image_path = null;
        }
        if ($request->hasFile('featured_image')) {
            if ($house->featured_image_path) {
                Storage::disk('public')->delete($house->featured_image_path);
            }
            $house->featured_image_path = $request
                ->file('featured_image')
                ->store('houses/featured', 'public');
        }

        $house->save();

        return response()->json([
            'success' => true,
            'message' => 'House updated successfully.',
            'data'    => $this->format($house->fresh()),
        ]);
    }

    public function destroy(House $house)
    {
        if ($house->image_path) {
            Storage::disk('public')->delete($house->image_path);
        }
        if ($house->featured_image_path) {
            Storage::disk('public')->delete($house->featured_image_path);
        }

        $house->delete();

        return response()->json([
            'success' => true,
            'message' => 'House deleted successfully.',
        ]);
    }

    public function bulkPoints(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id'  => ['required', 'integer', 'exists:academic_years,id'],
            'points'            => ['required', 'array', 'min:1'],
            'points.*.house_id' => ['required', 'integer', 'exists:houses,id'],
            'points.*.points'   => ['required', 'integer', 'min:0'],
        ]);

        foreach ($validated['points'] as $entry) {
            HousePoint::updateOrCreate(
                [
                    'house_id'         => $entry['house_id'],
                    'academic_year_id' => $validated['academic_year_id'],
                ],
                ['points' => $entry['points']]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'House points saved successfully.',
        ]);
    }

    private function format(House $h): array
    {
        return [
            'id'                 => $h->id,
            'name'               => $h->name,
            'code'               => $h->code,
            'colour'             => $h->colour,
            'image_url'          => $h->image_url,
            'featured_image_url' => $h->featured_image_url,
            'sort_order'         => $h->sort_order,
            'is_active'          => (bool) $h->is_active,
            'created_at'         => $h->created_at,
        ];
    }
}