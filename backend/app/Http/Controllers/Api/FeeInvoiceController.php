<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeInvoice;
use App\Models\FeeStructure;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeeInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeInvoice::with([
            'student:id,student_number,first_name,middle_name,surname',
            'feeStructure:id,name,school_class_id',
            'feeStructure.schoolClass:id,name',
            'term:id,name',
        ]);

        if ($request->filled('term_id'))          $query->where('term_id', $request->input('term_id'));
        if ($request->filled('academic_year_id')) $query->where('academic_year_id', $request->input('academic_year_id'));
        if ($request->filled('status'))           $query->where('status', $request->input('status'));
        if ($request->filled('fee_structure_id')) $query->where('fee_structure_id', $request->input('fee_structure_id'));

        if ($request->filled('school_class_id')) {
            $classId = (int) $request->input('school_class_id');
            $query->whereHas('student', function ($q) use ($classId) {
                $q->whereHas('currentClassStream', fn ($q2) => $q2->where('school_class_id', $classId))
                  ->orWhere(function ($q2) use ($classId) {
                      $q2->whereNull('current_class_stream_id')
                         ->where('current_class_id', $classId);
                  });
            });
        }

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->whereHas('student', function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                  ->orWhere('surname', 'like', "%{$s}%")
                  ->orWhere('student_number', 'like', "%{$s}%");
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderByDesc('id')->get(),
        ]);
    }

    /**
     * Generate per-term invoices for every active student in a class,
     * using the class's current active fee structure.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'term_id'          => ['required', 'integer', 'exists:academic_terms,id'],
            'school_class_id'  => ['nullable', 'integer', 'exists:school_classes,id'],
            'due_date'         => ['nullable', 'date'],
        ]);

        $yearId     = (int) $validated['academic_year_id'];
        $termId     = (int) $validated['term_id'];
        $classId    = isset($validated['school_class_id']) ? (int) $validated['school_class_id'] : null;
        $dueDate    = $validated['due_date'] ?? null;

        $structures = FeeStructure::where('academic_year_id', $yearId)
            ->where('is_active', true)
            ->when($classId, fn ($q) => $q->where('school_class_id', $classId))
            ->get()
            ->keyBy('school_class_id');

        if ($structures->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No active fee structures exist for this year. Create a fee structure first.',
            ], 422);
        }

        $created = 0;
        $skipped = 0;

        DB::transaction(function () use ($structures, $yearId, $termId, $dueDate, &$created, &$skipped) {
            foreach ($structures as $structureClassId => $structure) {
                $students = Student::where('status', 'active')
                    ->where(function ($q) use ($structureClassId) {
                        $q->whereHas('currentClassStream', fn ($q2) => $q2->where('school_class_id', $structureClassId))
                          ->orWhere(function ($q2) use ($structureClassId) {
                              $q2->whereNull('current_class_stream_id')
                                 ->where('current_class_id', $structureClassId);
                          });
                    })
                    ->get();

                $amount = $structure->amountForTerm($termId);

                foreach ($students as $student) {
                    $exists = FeeInvoice::where('student_id', $student->id)
                        ->where('term_id', $termId)
                        ->where('academic_year_id', $yearId)
                        ->exists();

                    if ($exists) {
                        $skipped++;
                        continue;
                    }

                    FeeInvoice::create([
                        'student_id'       => $student->id,
                        'fee_structure_id' => $structure->id,
                        'term_id'          => $termId,
                        'academic_year_id' => $yearId,
                        'total_amount'     => $amount,
                        'amount_paid'      => 0,
                        'due_date'         => $dueDate,
                        'status'           => 'pending',
                    ]);
                    $created++;
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Generated {$created} invoice(s). Skipped {$skipped} existing.",
            'data'    => ['created' => $created, 'skipped' => $skipped],
        ]);
    }

    public function show(FeeInvoice $feeInvoice)
    {
        $feeInvoice->load([
            'student:id,student_number,first_name,middle_name,surname,photo_path',
            'feeStructure.items',
            'term:id,name',
            'payments.bankAccount:id,name,bank_name',
            'payments.receivedBy:id,name',
        ]);

        return response()->json(['success' => true, 'data' => $feeInvoice]);
    }

    public function destroy(FeeInvoice $feeInvoice)
    {
        if ($feeInvoice->payments()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This invoice has payments and cannot be deleted. Reverse the payments first.',
            ], 422);
        }

        $feeInvoice->delete();
        return response()->json(['success' => true]);
    }

    public function studentInvoices(Request $request, Student $student)
    {
        $query = FeeInvoice::with(['feeStructure.items', 'term:id,name', 'payments'])
            ->where('student_id', $student->id);

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->input('academic_year_id'));
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderByDesc('id')->get(),
        ]);
    }
}