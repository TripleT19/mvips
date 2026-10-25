<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeStructure;
use App\Models\FeeStructureItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeeStructureController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeStructure::with([
            'academicYear:id,name',
            'schoolClass:id,name',
            'items',
        ]);

        if ($request->filled('academic_year_id')) $query->where('academic_year_id', $request->input('academic_year_id'));
        if ($request->filled('school_class_id'))  $query->where('school_class_id', $request->input('school_class_id'));
        if ($request->filled('active_only'))      $query->where('is_active', true);

        return response()->json([
            'success' => true,
            'data'    => $query->orderByDesc('academic_year_id')
                ->orderBy('school_class_id')
                ->orderByDesc('version')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id'    => ['required', 'integer', 'exists:academic_years,id'],
            'school_class_id'     => ['required', 'integer', 'exists:school_classes,id'],
            'name'                => ['nullable', 'string', 'max:180'],
            'amount_per_term'     => ['required', 'numeric', 'min:0'],
            'term_amounts'        => ['nullable', 'array'],
            'term_amounts.*'      => ['nullable', 'numeric', 'min:0'],
            'allows_installments' => ['nullable', 'boolean'],
            'max_installments'    => ['nullable', 'integer', 'min:1', 'max:12'],
            'effective_from'      => ['nullable', 'date'],
            'notes'               => ['nullable', 'string', 'max:1000'],
            'items'               => ['required', 'array', 'min:1'],
            'items.*.name'        => ['required', 'string', 'max:120'],
            'items.*.amount'      => ['required', 'numeric', 'min:0'],
        ]);

        // Reject if an active structure already exists for this year+class
        $existing = FeeStructure::where('academic_year_id', $validated['academic_year_id'])
            ->where('school_class_id', $validated['school_class_id'])
            ->where('is_active', true)
            ->exists();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'An active fee structure already exists for this class. Use "Change fee" to revise it.',
            ], 422);
        }

        $structure = DB::transaction(function () use ($validated) {
            $structure = FeeStructure::create([
                'academic_year_id'    => $validated['academic_year_id'],
                'school_class_id'     => $validated['school_class_id'],
                'name'                => $validated['name'] ?? 'Fees',
                'amount_per_term'     => $validated['amount_per_term'],
                'term_amounts'        => $validated['term_amounts'] ?? null,
                'version'             => 1,
                'is_active'           => true,
                'effective_from'      => $validated['effective_from'] ?? null,
                'allows_installments' => $validated['allows_installments'] ?? true,
                'max_installments'    => $validated['max_installments'] ?? null,
                'notes'               => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $i => $item) {
                FeeStructureItem::create([
                    'fee_structure_id' => $structure->id,
                    'name'             => $item['name'],
                    'amount'           => $item['amount'],
                    'sort_order'       => $i,
                ]);
            }

            return $structure;
        });

        return response()->json([
            'success' => true,
            'data'    => $structure->load(['items', 'academicYear:id,name', 'schoolClass:id,name']),
        ], 201);
    }

    public function show(FeeStructure $feeStructure)
    {
        return response()->json([
            'success' => true,
            'data'    => $feeStructure->load(['items', 'academicYear:id,name', 'schoolClass:id,name']),
        ]);
    }

    /**
     * Update creates a NEW VERSION when the amount or items change.
     * Old version is kept (is_active=false) so historical invoices
     * still reference the amount that was in force when they were issued.
     */
    public function update(Request $request, FeeStructure $feeStructure)
    {
        $validated = $request->validate([
            'name'                => ['nullable', 'string', 'max:180'],
            'amount_per_term'     => ['required', 'numeric', 'min:0'],
            'term_amounts'        => ['nullable', 'array'],
            'term_amounts.*'      => ['nullable', 'numeric', 'min:0'],
            'allows_installments' => ['nullable', 'boolean'],
            'max_installments'    => ['nullable', 'integer', 'min:1', 'max:12'],
            'effective_from'      => ['nullable', 'date'],
            'notes'               => ['nullable', 'string', 'max:1000'],
            'items'               => ['required', 'array', 'min:1'],
            'items.*.name'        => ['required', 'string', 'max:120'],
            'items.*.amount'      => ['required', 'numeric', 'min:0'],
        ]);

        $newStructure = DB::transaction(function () use ($feeStructure, $validated) {
            // Retire current version
            $feeStructure->update(['is_active' => false]);

            $nextVersion = (int) FeeStructure::where('academic_year_id', $feeStructure->academic_year_id)
                ->where('school_class_id', $feeStructure->school_class_id)
                ->max('version') + 1;

            $next = FeeStructure::create([
                'academic_year_id'    => $feeStructure->academic_year_id,
                'school_class_id'     => $feeStructure->school_class_id,
                'name'                => $validated['name'] ?? $feeStructure->name,
                'amount_per_term'     => $validated['amount_per_term'],
                'term_amounts'        => $validated['term_amounts'] ?? null,
                'version'             => $nextVersion,
                'is_active'           => true,
                'effective_from'      => $validated['effective_from'] ?? null,
                'allows_installments' => $validated['allows_installments'] ?? $feeStructure->allows_installments,
                'max_installments'    => $validated['max_installments'] ?? $feeStructure->max_installments,
                'notes'               => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $i => $item) {
                FeeStructureItem::create([
                    'fee_structure_id' => $next->id,
                    'name'             => $item['name'],
                    'amount'           => $item['amount'],
                    'sort_order'       => $i,
                ]);
            }

            return $next;
        });

        return response()->json([
            'success' => true,
            'message' => 'Fee updated. A new version has been created — past invoices are unchanged.',
            'data'    => $newStructure->load(['items', 'academicYear:id,name', 'schoolClass:id,name']),
        ]);
    }

    public function destroy(FeeStructure $feeStructure)
    {
        if ($feeStructure->invoices()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This structure has invoices and cannot be deleted. Deactivate it instead.',
            ], 422);
        }

        $feeStructure->update(['is_active' => false]);
        return response()->json(['success' => true, 'message' => 'Fee structure deactivated.']);
    }
}