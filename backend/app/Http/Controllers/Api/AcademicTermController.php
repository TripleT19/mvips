<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AcademicTermController extends Controller
{
    public function index(Request $request)
    {
        $query = AcademicTerm::with('academicYear:id,name');

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->input('academic_year_id'));
        }

        $terms = $query
            ->orderByDesc('is_current')
            ->orderBy('academic_year_id')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $terms,
        ]);
    }

    public function store(Request $request)
    {
        $this->guard($request);

        $validated = $request->validate([
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('academic_terms', 'name')
                    ->where('academic_year_id', $request->input('academic_year_id')),
            ],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $term = DB::transaction(function () use ($validated) {
            $isCurrent = (bool) ($validated['is_current'] ?? false);

            if ($isCurrent) {
                // Only one current term globally
                AcademicTerm::where('is_current', true)
                    ->update(['is_current' => false]);

                // And its parent year becomes current
                AcademicYear::where('is_current', true)
                    ->where('id', '!=', $validated['academic_year_id'])
                    ->update(['is_current' => false]);

                AcademicYear::where('id', $validated['academic_year_id'])
                    ->update(['is_current' => true]);
            }

            return AcademicTerm::create([
                'academic_year_id' => $validated['academic_year_id'],
                'name' => trim($validated['name']),
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'is_current' => $isCurrent,
                'is_published' => $validated['is_published'] ?? false,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Academic term created successfully.',
            'data' => $term->load('academicYear:id,name'),
        ], 201);
    }

    public function update(Request $request, AcademicTerm $academicTerm)
    {
        $this->guard($request);

        $validated = $request->validate([
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('academic_terms', 'name')
                    ->where('academic_year_id', $request->input('academic_year_id'))
                    ->ignore($academicTerm->id),
            ],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        DB::transaction(function () use ($academicTerm, $validated) {
            $isCurrent = (bool) ($validated['is_current'] ?? $academicTerm->is_current);

            if ($isCurrent && !$academicTerm->is_current) {
                AcademicTerm::where('is_current', true)
                    ->where('id', '!=', $academicTerm->id)
                    ->update(['is_current' => false]);

                AcademicYear::where('is_current', true)
                    ->where('id', '!=', $validated['academic_year_id'])
                    ->update(['is_current' => false]);

                AcademicYear::where('id', $validated['academic_year_id'])
                    ->update(['is_current' => true]);
            }

            $academicTerm->update([
                'academic_year_id' => $validated['academic_year_id'],
                'name' => trim($validated['name']),
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'is_current' => $isCurrent,
                'is_published' => $validated['is_published'] ?? $academicTerm->is_published,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Academic term updated successfully.',
            'data' => $academicTerm->fresh()->load('academicYear:id,name'),
        ]);
    }

    public function destroy(Request $request, AcademicTerm $academicTerm)
    {
        $this->guard($request);

        $academicTerm->delete();

        return response()->json([
            'success' => true,
            'message' => 'Academic term deleted successfully.',
        ]);
    }

    private function guard(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['admin', 'administrator', 'headteacher'], true),
            403,
            'Only administrators and headteachers can manage academic terms.'
        );
    }
}