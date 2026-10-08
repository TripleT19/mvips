<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactMessageReceived;
use App\Mail\ContactReplyMail;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Throwable;

class ContactMessageController extends Controller
{
    /* =========================================================
       PUBLIC
    ========================================================= */

    /**
     * Receive a contact form submission from the public website.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'max:255'],
            'phone'     => ['nullable', 'string', 'max:50'],

            'enquiry_type' => [
                'required',
                Rule::in([
                    'admissions',
                    'school-information',
                    'curriculum',
                    'school-life',
                    'general',
                ]),
            ],

            'child_name' => ['nullable', 'string', 'max:255'],
            'class_name' => ['nullable', 'string', 'max:255'],
            'message'    => ['required', 'string', 'min:5', 'max:5000'],
        ]);

        // Save first so nothing is lost if mail fails.
        $contact = ContactMessage::create([
            'full_name'    => trim($validated['full_name']),
            'email'        => strtolower(trim($validated['email'])),
            'phone'        => isset($validated['phone']) ? trim($validated['phone']) : null,
            'enquiry_type' => $validated['enquiry_type'],
            'child_name'   => isset($validated['child_name']) ? trim($validated['child_name']) : null,
            'class_name'   => isset($validated['class_name']) ? trim($validated['class_name']) : null,
            'message'      => $validated['message'],
            'status'       => 'new',
            'ip_address'   => $request->ip(),
        ]);

        // Best-effort notification to the school office.
        try {
            $officeEmail = config('mail.contact_address', 'info@mountviewmw.com');

            Mail::to($officeEmail)
                ->send(new ContactMessageReceived($contact));
        } catch (Throwable $e) {
            Log::error('Contact message notification email failed', [
                'contact_id' => $contact->id,
                'email'      => $contact->email,
                'error'      => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Thank you for contacting us. Our team will get back to you shortly.',
            'data'    => [
                'id' => $contact->id,
            ],
        ], 201);
    }

    /* =========================================================
       ADMIN
    ========================================================= */

    /**
     * List all contact messages (paginated, searchable, filterable).
     */
    public function index(Request $request)
    {
        $query = ContactMessage::query()
            ->with([
                'replayer:id,name',
                'handler:id,name',
            ]);

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('full_name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('message', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('enquiry_type')) {
            $query->where('enquiry_type', $request->input('enquiry_type'));
        }

        $perPage = min(max((int) $request->input('per_page', 25), 1), 100);

        $messages = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $messages,
        ]);
    }

    /**
     * Show a single message. Auto-marks as read on first open.
     */
    public function show(ContactMessage $contactMessage)
    {
        if (!$contactMessage->read_at) {
            $contactMessage->update([
                'read_at' => now(),
                'status'  => $contactMessage->status === 'new'
                    ? 'read'
                    : $contactMessage->status,
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => $contactMessage->fresh(['replayer', 'handler']),
        ]);
    }

    /**
     * Update the status of a message (new / read / replied / archived).
     */
    public function update(Request $request, ContactMessage $contactMessage)
    {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in(['new', 'read', 'replied', 'archived']),
            ],
        ]);

        $contactMessage->update([
            'status'     => $validated['status'],
            'replied_at' => $validated['status'] === 'replied' && !$contactMessage->replied_at
                ? now()
                : $contactMessage->replied_at,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message updated.',
            'data'    => $contactMessage->fresh(['replayer', 'handler']),
        ]);
    }

    /**
     * Send a reply to the person who submitted the enquiry.
     * Emails the parent and marks the message as replied.
     */
    public function reply(Request $request, ContactMessage $contactMessage)
    {
        $validated = $request->validate([
            'reply_body' => ['required', 'string', 'min:2', 'max:10000'],
        ]);

        $replyBody = trim($validated['reply_body']);
        $admin = $request->user();

        /*
        |------------------------------------------------------------------
        | Send the email first. If it fails, we don't mark the message as
        | replied, so the admin can retry cleanly.
        |------------------------------------------------------------------
        */
        try {
            Mail::to($contactMessage->email)
                ->send(new ContactReplyMail($contactMessage, $replyBody, $admin));
        } catch (Throwable $e) {
            Log::error('Contact reply email failed', [
                'contact_id' => $contactMessage->id,
                'email'      => $contactMessage->email,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'The reply could not be sent. Please check the mail configuration and try again.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }

        /*
        |------------------------------------------------------------------
        | Only mark as replied after a successful send.
        |------------------------------------------------------------------
        */
        $contactMessage->update([
            'reply_body' => $replyBody,
            'replied_by' => $admin?->id,
            'replied_at' => now(),
            'status'     => 'replied',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reply sent to ' . $contactMessage->email,
            'data'    => $contactMessage->fresh(['replayer', 'handler']),
        ]);
    }

    /**
     * Delete a message permanently.
     */
    public function destroy(ContactMessage $contactMessage)
    {
        $contactMessage->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted.',
        ]);
    }
}