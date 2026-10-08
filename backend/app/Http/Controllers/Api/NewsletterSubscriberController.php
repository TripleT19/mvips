<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;

class NewsletterSubscriberController extends Controller
{
    /**
     * Public — subscribe an email address.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name'  => ['nullable', 'string', 'max:120'],
        ]);

        $email = strtolower(trim($validated['email']));

        $existing = NewsletterSubscriber::where('email', $email)->first();

        if ($existing) {
            // Reactivate previously unsubscribed addresses
            if (!$existing->is_active) {
                $existing->update([
                    'is_active' => true,
                    'unsubscribed_at' => null,
                    'subscribed_at' => now(),
                    'name' => $validated['name'] ?? $existing->name,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Welcome back! You are subscribed again.',
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'You are already on our list. Thanks!',
            ]);
        }

        NewsletterSubscriber::create([
            'email' => $email,
            'name' => $validated['name'] ?? null,
            'is_active' => true,
            'signup_ip' => $request->ip(),
            'subscribed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'You are now subscribed. Watch your inbox for our next edition!',
        ], 201);
    }

    /**
     * Public — unsubscribe via token (no login required).
     */
    public function unsubscribe(string $token)
    {
        $subscriber = NewsletterSubscriber::where('unsubscribe_token', $token)->first();

        if (!$subscriber) {
            return response()->json([
                'success' => false,
                'message' => 'This unsubscribe link is not valid.',
            ], 404);
        }

        if ($subscriber->is_active) {
            $subscriber->update([
                'is_active' => false,
                'unsubscribed_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'You have been unsubscribed. We are sorry to see you go.',
        ]);
    }

    /**
     * Admin — list subscribers.
     */
    public function index(Request $request)
    {
        $query = NewsletterSubscriber::query();

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('email', 'like', "%{$s}%")
                    ->orWhere('name', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->input('status') === 'active');
        }

        $subscribers = $query->latest()->paginate(
            min(max((int) $request->input('per_page', 25), 1), 100)
        );

        return response()->json([
            'success' => true,
            'data' => $subscribers,
        ]);
    }

    /**
     * Admin — remove a subscriber.
     */
    public function destroy(NewsletterSubscriber $subscriber)
    {
        $subscriber->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subscriber removed.',
        ]);
    }
}