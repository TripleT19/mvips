<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Alumnus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminAlumniController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'pending');

        $query = Alumnus::query()->with('approver:id,name,role');

        if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $query->where('status', $status);
        }

        $alumni = $query->orderByDesc('created_at')->get()->map(
            fn (Alumnus $a) => array_merge($a->toPublicArray(), [
                'status'           => $a->status,
                'email'            => $a->email,
                'phone'            => $a->phone,
                'show_contact'     => $a->show_contact,
                'approved_at'      => $a->approved_at,
                'approved_by'      => $a->approved_by,
                'approved_by_name' => $a->approver?->name,
                'approved_by_role' => $a->approver?->role,
                'admin_notes'      => $a->admin_notes,
                'created_at'       => $a->created_at,
            ])
        );

        return response()->json(['data' => $alumni]);
    }

    public function approve(Request $request, Alumnus $alumnus)
    {
        $alumnus->update([
            'status'      => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()?->id,
            'admin_notes' => null,
        ]);

        return response()->json([
            'message' => 'Alumnus approved and published.',
            'data'    => $alumnus->fresh()->load('approver:id,name,role')->toPublicArray(),
        ]);
    }

    public function reject(Request $request, Alumnus $alumnus)
    {
        $validated = $request->validate([
            'admin_notes' => 'nullable|string|max:500',
        ]);

        // Record WHO rejected and WHEN — same column pair as approve,
        // so the frontend can show "Reviewed by X on Y" for both.
        $alumnus->update([
            'status'      => 'rejected',
            'admin_notes' => $validated['admin_notes'] ?? null,
            'approved_at' => now(),
            'approved_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Alumnus rejected.',
            'data'    => $alumnus->fresh()->load('approver:id,name,role')->toPublicArray(),
        ]);
    }

    public function destroy(Alumnus $alumnus)
    {
        if ($alumnus->photo_path) {
            Storage::disk('public')->delete($alumnus->photo_path);
        }
        $alumnus->delete();

        return response()->json(['message' => 'Alumnus deleted.']);
    }
}