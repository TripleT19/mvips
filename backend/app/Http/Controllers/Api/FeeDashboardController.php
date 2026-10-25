<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeeDashboardController extends Controller
{
    public function index(Request $request)
    {
        $yearId = $request->input('academic_year_id')
            ?? AcademicYear::where('is_current', true)->value('id');
        $termId = $request->input('term_id')
            ?? AcademicTerm::where('is_current', true)->value('id');

        $invoiceQuery = FeeInvoice::query()
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->when($termId, fn ($q) => $q->where('term_id', $termId));

        $billed       = (float) (clone $invoiceQuery)->sum('total_amount');
        $collected    = (float) (clone $invoiceQuery)->sum('amount_paid');
        $outstanding  = max(0, $billed - $collected);
        $totalInv     = (clone $invoiceQuery)->count();
        $paidInv      = (clone $invoiceQuery)->where('status', 'paid')->count();
        $partialInv   = (clone $invoiceQuery)->where('status', 'partial')->count();
        $pendingInv   = (clone $invoiceQuery)->where('status', 'pending')->count();

        $recentPayments = FeePayment::with([
            'student:id,student_number,first_name,middle_name,surname',
            'bankAccount:id,name',
        ])
            ->when($yearId, fn ($q) => $q->whereHas('invoice', fn ($q2) => $q2->where('academic_year_id', $yearId)))
            ->when($termId, fn ($q) => $q->whereHas('invoice', fn ($q2) => $q2->where('term_id', $termId)))
            ->orderByDesc('paid_on')
            ->orderByDesc('id')
            ->limit(10)
            ->get();

        $topOutstanding = FeeInvoice::with([
            'student:id,student_number,first_name,middle_name,surname',
            'feeStructure:id,name',
        ])
            ->when($yearId, fn ($q) => $q->where('academic_year_id', $yearId))
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->whereIn('status', ['pending', 'partial'])
            ->orderByRaw('(total_amount - amount_paid) DESC')
            ->limit(10)
            ->get()
            ->map(fn (FeeInvoice $inv) => [
                'invoice_id'     => $inv->id,
                'student_name'   => trim($inv->student->first_name . ' ' . $inv->student->middle_name . ' ' . $inv->student->surname),
                'student_number' => $inv->student->student_number,
                'structure'      => $inv->feeStructure?->name,
                'total'          => (float) $inv->total_amount,
                'paid'           => (float) $inv->amount_paid,
                'balance'        => $inv->balance,
                'status'         => $inv->status,
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'billed'          => $billed,
                'collected'       => $collected,
                'outstanding'     => $outstanding,
                'collection_rate' => $billed > 0 ? round(($collected / $billed) * 100, 1) : 0,
                'invoices'        => [
                    'total'   => $totalInv,
                    'paid'    => $paidInv,
                    'partial' => $partialInv,
                    'pending' => $pendingInv,
                ],
                'recent_payments' => $recentPayments,
                'top_outstanding' => $topOutstanding,
            ],
        ]);
    }
}