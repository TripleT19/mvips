<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alumnus;
use App\Models\User;                                  // ← NEW
use App\Notifications\AlumniSubmittedNotification;    // ← NEW
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;                    // ← NEW

class AlumniController extends Controller
{
    /* ---------- public index — unchanged ---------- */
    public function index()
    {
        $alumni = Alumnus::where('status', 'approved')
            ->orderByDesc('year_left')
            ->orderByDesc('approved_at')
            ->get()
            ->map(fn (Alumnus $a) => $a->toPublicArray());

        return response()->json(['data' => $alumni]);
    }

    /* ---------- store — dispatch notifications ---------- */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name'            => 'required|string|max:255',
            'email'                => 'nullable|email|max:255',
            'phone'                => 'nullable|string|max:50',
            'year_left'            => 'required|integer|min:1975|max:' . date('Y'),
            'location'             => 'required|string|max:255',
            'current_role'         => 'required|string|max:255',
            'organization'         => 'nullable|string|max:255',
            'bio'                  => 'nullable|string|max:2000',
            'photo'                => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
            'linkedin_url'         => 'nullable|url|max:255',
            'message_to_students'  => 'nullable|string|max:2000',
            'show_contact'         => 'sometimes|boolean',
            'consent'              => 'required|accepted',
        ]);

        $photoPath = $request->hasFile('photo')
            ? $request->file('photo')->store('alumni', 'public')
            : null;

        $alumnus = Alumnus::create([
            'full_name'            => $validated['full_name'],
            'email'                => $validated['email'] ?? null,
            'phone'                => $validated['phone'] ?? null,
            'year_left'            => $validated['year_left'],
            'location'             => $validated['location'],
            'current_role'         => $validated['current_role'],
            'organization'         => $validated['organization'] ?? null,
            'bio'                  => $validated['bio'] ?? null,
            'photo_path'           => $photoPath,
            'linkedin_url'         => $validated['linkedin_url'] ?? null,
            'message_to_students'  => $validated['message_to_students'] ?? null,
            'show_contact'         => $request->boolean('show_contact'),
            'status'               => 'pending',
        ]);

        /* ============================================================
           Notify every admin / headteacher who can approve alumni.
           Same role list as the AlumniApproverMiddleware gate.
           ============================================================ */
        $recipients = User::query()
            ->where('is_active', true)
            ->whereIn('role', [
                'admin', 'administrator', 'super_admin', 'superadmin',
                'headteacher', 'head_teacher', 'principal', 'head',
                'deputy_head', 'vice_principal',
            ])
            ->get();

        foreach ($recipients as $recipient) {
            try {
                $recipient->notify(new AlumniSubmittedNotification($alumnus));
            } catch (\Throwable $e) {
                Log::error('Alumni notification failed.', [
                    'user_id'   => $recipient->id,
                    'alumni_id' => $alumnus->id,
                    'error'     => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Your details were received. Our team will review and publish them shortly.',
            'data'    => ['id' => $alumnus->id],
        ], 201);
    }
}