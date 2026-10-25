<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolBankAccount;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SchoolBankAccountController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data'    => SchoolBankAccount::orderByDesc('is_default')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:120'],
            'bank_name'      => ['required', 'string', 'max:120'],
            'account_number' => ['required', 'string', 'max:60'],
            'branch'         => ['nullable', 'string', 'max:120'],
            'swift_code'     => ['nullable', 'string', 'max:30'],
            'currency'       => ['nullable', 'string', 'max:8'],
            'is_default'     => ['nullable', 'boolean'],
        ]);

        $account = SchoolBankAccount::create([
            ...$validated,
            'currency'   => $validated['currency'] ?? 'MWK',
            'is_default' => $validated['is_default'] ?? false,
            'is_active'  => true,
        ]);

        return response()->json(['success' => true, 'data' => $account], 201);
    }

    public function update(Request $request, SchoolBankAccount $schoolBankAccount)
    {
        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:120'],
            'bank_name'      => ['required', 'string', 'max:120'],
            'account_number' => ['required', 'string', 'max:60'],
            'branch'         => ['nullable', 'string', 'max:120'],
            'swift_code'     => ['nullable', 'string', 'max:30'],
            'currency'       => ['nullable', 'string', 'max:8'],
            'is_default'     => ['nullable', 'boolean'],
            'is_active'      => ['nullable', 'boolean'],
        ]);

        $schoolBankAccount->update($validated);

        return response()->json(['success' => true, 'data' => $schoolBankAccount->fresh()]);
    }

    public function setDefault(SchoolBankAccount $schoolBankAccount)
    {
        $schoolBankAccount->update(['is_default' => true, 'is_active' => true]);
        return response()->json(['success' => true]);
    }

    public function destroy(SchoolBankAccount $schoolBankAccount)
    {
        $schoolBankAccount->update(['is_active' => false, 'is_default' => false]);
        return response()->json(['success' => true, 'message' => 'Account deactivated.']);
    }
}