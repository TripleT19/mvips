<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AcademicYearController extends Controller
{
    public function index()
    {
        $years = AcademicYear::orderByDesc('is_current')
            ->orderByDesc('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $years,
        ]);
    }

    public function store(Request $request)
    {
        $this->guard($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:academic_years,name'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $year = DB::transaction(function () use ($validated) {
            $isCurrent = (bool) ($validated['is_current'] ?? false);

            if ($isCurrent) {
                AcademicYear::where('is_current', true)
                    ->update(['is_current' => false]);
            }

            return AcademicYear::create([
                'name' => trim($validated['name']),
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'is_current' => $isCurrent,
                'is_active' => $validated['is_active'] ?? true,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Academic year created successfully.',
            'data' => $year,
        ], 201);
    }

    public function show(AcademicYear $academicYear)
    {
        return response()->json([
            'success' => true,
            'data' => $academicYear->load('terms'),
        ]);
    }

    public function update(Request $request, AcademicYear $academicYear)
    {
        $this->guard($request);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('academic_years', 'name')->ignore($academicYear->id),
            ],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        DB::transaction(function () use ($academicYear, $validated) {
            $isCurrent = (bool) ($validated['is_current'] ?? $academicYear->is_current);

            if ($isCurrent && !$academicYear->is_current) {
                AcademicYear::where('is_current', true)
                    ->where('id', '!=', $academicYear->id)
                    ->update(['is_current' => false]);
            }

            $academicYear->update([
                'name' => trim($validated['name']),
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'is_current' => $isCurrent,
                'is_active' => $validated['is_active'] ?? $academicYear->is_active,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Academic year updated successfully.',
            'data' => $academicYear->fresh(),
        ]);
    }

    public function destroy(Request $request, AcademicYear $academicYear)
    {
        $this->guard($request);

        if ($academicYear->applications()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This year is linked to admission applications and cannot be deleted. Deactivate it instead.',
            ], 422);
        }

        $academicYear->delete();

        return response()->json([
            'success' => true,
            'message' => 'Academic year deleted successfully.',
        ]);
    }

    private function guard(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['admin', 'administrator', 'headteacher'], true),
            403,
            'Only administrators and headteachers can manage academic years.'
        );
    }
}