<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\Event;
use App\Models\Gallery;
use App\Models\Story;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Administrator dashboard.
     *
     * Returns every figure and recent list the admin home page needs
     * in a single request:
     *   • website stats   — stories, events, gallery albums, users
     *   • admission stats — counts by pipeline stage (drafts excluded)
     *   • recent stories
     *   • upcoming events
     *   • recent users
     *   • recent applications
     */
    public function index(): JsonResponse
    {
        /* -----------------------------------------------------------------
         | Story statistics
         | ----------------------------------------------------------------- */

        $totalStories = Story::count();
        $publishedStories = Story::where('status', 'published')->count();
        $draftStories = Story::where('status', 'draft')->count();

        /* -----------------------------------------------------------------
         | Event statistics
         | ----------------------------------------------------------------- */

        $totalEvents = Event::count();

        $today = now()->toDateString();
        $currentTime = now()->format('H:i:s');

        $upcomingEventsQuery = Event::query()
            ->where('status', 'published')
            ->where(function ($query) use ($today, $currentTime) {
                $query
                    ->whereDate('event_date', '>', $today)
                    ->orWhere(function ($query) use ($today, $currentTime) {
                        $query
                            ->whereDate('event_date', $today)
                            ->where(function ($query) use ($currentTime) {
                                $query
                                    ->whereNull('end_time')
                                    ->orWhere('end_time', '>', $currentTime);
                            });
                    });
            });

        $upcomingEventsCount = (clone $upcomingEventsQuery)->count();

        /* -----------------------------------------------------------------
         | Gallery statistics
         | ----------------------------------------------------------------- */

        $galleryAlbums = Gallery::count();

        /* -----------------------------------------------------------------
         | User statistics
         | ----------------------------------------------------------------- */

        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();

        /* -----------------------------------------------------------------
         | Admission statistics
         |
         | Drafts are intentionally excluded from every figure below, so
         | the admin dashboard only reflects applications that have been
         | submitted or progressed further through the workflow.
         | ----------------------------------------------------------------- */

        $admissionBase = AdmissionApplication::query()
            ->whereNotIn('status', ['draft']);

        $admissionStats = [
            'total'                 => (clone $admissionBase)->count(),
            'submitted'             => (clone $admissionBase)->where('status', 'submitted')->count(),
            'document_verification' => (clone $admissionBase)->where('status', 'document_verification')->count(),
            'assessments_scheduled' => (clone $admissionBase)->where('status', 'assessment_scheduled')->count(),
            'assessments_completed' => (clone $admissionBase)->where('status', 'assessment_completed')->count(),
            'awaiting_approval'     => (clone $admissionBase)->where('status', 'principal_review')->count(),
            'approved'              => (clone $admissionBase)->where('status', 'approved')->count(),
            'denied'                => (clone $admissionBase)->where('status', 'denied')->count(),
            'waitlisted'            => (clone $admissionBase)->where('status', 'waitlisted')->count(),
            'enrolled'              => (clone $admissionBase)->where('status', 'enrolled')->count(),
        ];

        /* -----------------------------------------------------------------
         | Recent stories
         | ----------------------------------------------------------------- */

        $recentStories = Story::query()
            ->with('category:id,name,slug')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($story) {
                return [
                    'id' => $story->id,
                    'title' => $story->title,
                    'slug' => $story->slug,
                    'author' => $story->author,
                    'status' => $story->status,
                    'featured' => (bool) $story->featured,
                    'image_url' => $story->image_path
                        ? \Illuminate\Support\Facades\Storage::disk('public')->url($story->image_path)
                        : null,
                    'category' => $story->category
                        ? [
                            'id' => $story->category->id,
                            'name' => $story->category->name,
                            'slug' => $story->category->slug,
                        ]
                        : null,
                    'created_at' => $story->created_at,
                ];
            });

        /* -----------------------------------------------------------------
         | Upcoming events
         | ----------------------------------------------------------------- */

        $upcomingEvents = (clone $upcomingEventsQuery)
            ->orderBy('event_date')
            ->orderBy('start_time')
            ->limit(5)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'slug' => $event->slug,
                    'event_date' => $event->event_date,
                    'start_time' => $event->start_time,
                    'end_time' => $event->end_time,
                    'location' => $event->location,
                    'class_name' => $event->class_name,
                    'status' => $event->status,
                    'featured' => (bool) $event->featured,
                ];
            });

        /* -----------------------------------------------------------------
         | Recent users
         | ----------------------------------------------------------------- */

        $recentUsers = User::query()
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => (bool) $user->is_active,
                    'created_at' => $user->created_at,
                ];
            });

        /* -----------------------------------------------------------------
         | Recent applications
         | ----------------------------------------------------------------- */

        $recentApplications = AdmissionApplication::query()
            ->whereNotIn('status', ['draft'])
            ->with([
                'academicYear:id,name',
                'classApplied:id,name',
            ])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($application) {
                return [
                    'id' => $application->id,
                    'application_number' => $application->application_number,
                    'legal_first_name' => $application->legal_first_name,
                    'middle_name' => $application->middle_name,
                    'legal_surname' => $application->legal_surname,
                    'status' => $application->status,
                    'source' => $application->source,
                    'submitted' => (bool) $application->submitted,
                    'submitted_at' => $application->submitted_at,
                    'created_at' => $application->created_at,
                    'academic_year' => $application->academicYear
                        ? [
                            'id' => $application->academicYear->id,
                            'name' => $application->academicYear->name,
                        ]
                        : null,
                    'class_applied' => $application->classApplied
                        ? [
                            'id' => $application->classApplied->id,
                            'name' => $application->classApplied->name,
                        ]
                        : null,
                ];
            });

        /* -----------------------------------------------------------------
         | Response
         | ----------------------------------------------------------------- */

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    // Website content
                    'stories'           => $totalStories,
                    'published_stories' => $publishedStories,
                    'draft_stories'     => $draftStories,
                    'events'            => $totalEvents,
                    'upcoming_events'   => $upcomingEventsCount,
                    'galleries'         => $galleryAlbums,
                    'gallery_albums'    => $galleryAlbums,

                    // Users
                    'users'             => $totalUsers,
                    'active_users'      => $activeUsers,
                ],

                'admissions'            => $admissionStats,
                'recent_stories'        => $recentStories,
                'upcoming_events'       => $upcomingEvents,
                'recent_users'          => $recentUsers,
                'recent_applications'   => $recentApplications,
            ],
        ]);
    }
}