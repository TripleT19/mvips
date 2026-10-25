<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeePaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = FeePayment::with([
            'student:id,student_number,first_name,middle_name,surname',
            'invoice:id,total_amount,amount_paid,status,fee_structure_id',
            'invoice.feeStructure:id,name',
            'bankAccount:id,name,bank_name',
            'receivedBy:id,name',
        ]);

        if ($request->filled('from')) $query->whereDate('paid_on', '>=', $request->input('from'));
        if ($request->filled('to'))   $query->whereDate('paid_on', '<=', $request->input('to'));
        if ($request->filled('method')) $query->where('payment_method', $request->input('method'));
        if ($request->filled('invoice_id')) $query->where('fee_invoice_id', $request->input('invoice_id'));

        return response()->json([
            'success' => true,
            'data'    => $query->orderByDesc('paid_on')->orderByDesc('id')->get(),
        ]);
    }

    public function store(Request $request, FeeInvoice $feeInvoice)
    {
        $validated = $request->validate([
            'amount'                   => ['required', 'numeric', 'min:0.01'],
            'payment_method'           => ['required', 'in:cash,bank_transfer,mobile_money,cheque'],
            'reference'                => ['nullable', 'string', 'max:120'],
            'school_bank_account_id'   => ['nullable', 'integer', 'exists:school_bank_accounts,id'],
            'paid_on'                  => ['required', 'date'],
            'notes'                    => ['nullable', 'string', 'max:1000'],
        ]);

        $feeInvoice->refresh();

        if ($feeInvoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This invoice is already fully paid.',
            ], 422);
        }

        $structure = $feeInvoice->feeStructure;
        $existingCount = $feeInvoice->payments()->count();

        // Installment rules
        if (!$structure->allows_installments && $existingCount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'This fee structure does not allow installments.',
            ], 422);
        }

        if ($structure->max_installments && $existingCount >= $structure->max_installments) {
            return response()->json([
                'success' => false,
                'message' => "Maximum {$structure->max_installments} installment(s) already reached.",
            ], 422);
        }

        // Amount check
        $amount = (float) $validated['amount'];
        $balance = $feeInvoice->balance;

        if ($amount > $balance + 0.001) {
            return response()->json([
                'success' => false,
                'message' => 'Payment exceeds the outstanding balance of ' . number_format($balance, 2) . '.',
            ], 422);
        }

        $payment = DB::transaction(function () use ($feeInvoice, $validated, $existingCount, $request) {
            $payment = FeePayment::create([
                'fee_invoice_id'         => $feeInvoice->id,
                'student_id'             => $feeInvoice->student_id,
                'school_bank_account_id' => $validated['school_bank_account_id'] ?? null,
                'amount'                 => $validated['amount'],
                'payment_method'         => $validated['payment_method'],
                'reference'              => $validated['reference'] ?? null,
                'installment_number'     => $existingCount + 1,
                'paid_on'                => $validated['paid_on'],
                'received_by'            => $request->user()->id,
                'notes'                  => $validated['notes'] ?? null,
            ]);

            $feeInvoice->recalculate();

            return $payment;
        });

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded.',
            'data'    => $payment->load(['bankAccount:id,name,bank_name', 'receivedBy:id,name']),
        ], 201);
    }

    public function destroy(FeePayment $feePayment)
    {
        $invoice = $feePayment->invoice;

        DB::transaction(function () use ($feePayment, $invoice) {
            $feePayment->delete();
            $invoice->recalculate();
        });

        return response()->json(['success' => true, 'message' => 'Payment reversed.']);
    }

    public function receipt(FeePayment $feePayment)
    {
        $feePayment->load([
            'student:id,student_number,first_name,middle_name,surname',
            'invoice.feeStructure.items',
            'invoice.term:id,name',
            'bankAccount:id,name,bank_name,account_number',
            'receivedBy:id,name',
        ]);

        return response()->json(['success' => true, 'data' => $feePayment]);
    }
}