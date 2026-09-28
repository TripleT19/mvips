<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Gallery;
use App\Models\Story;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Administrator dashboard.
     */
    public function index(): JsonResponse
    {
        /*
        |--------------------------------------------------------------------------
        | Story statistics
        |--------------------------------------------------------------------------
        */

        $totalStories = Story::count();

        $publishedStories = Story::where(
            'status',
            'published'
        )->count();

        $draftStories = Story::where(
            'status',
            'draft'
        )->count();

        /*
        |--------------------------------------------------------------------------
        | Event statistics
        |--------------------------------------------------------------------------
        */

        $totalEvents = Event::count();

        $today = now()->toDateString();
        $currentTime = now()->format('H:i:s');

        $upcomingEvents = Event::query()
            ->where('status', 'published')
            ->where(function ($query) use (
                $today,
                $currentTime
            ) {
                /*
                 * Future dates
                 */
                $query->whereDate(
                    'event_date',
                    '>',
                    $today
                )

                /*
                 * Today's events
                 */
                ->orWhere(function ($query) use (
                    $today,
                    $currentTime
                ) {
                    $query
                        ->whereDate(
                            'event_date',
                            $today
                        )
                        ->where(function ($query) use (
                            $currentTime
                        ) {
                            /*
                             * No end time = still active today
                             */
                            $query
                                ->whereNull(
                                    'end_time'
                                )

                                /*
                                 * Event hasn't ended
                                 */
                                ->orWhere(
                                    'end_time',
                                    '>',
                                    $currentTime
                                );
                        });
                });
            })
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Gallery statistics
        |--------------------------------------------------------------------------
        */

        $galleryAlbums = Gallery::count();

        /*
        |--------------------------------------------------------------------------
        | Users
        |--------------------------------------------------------------------------
        */

        $totalUsers = User::count();

        /*
        |--------------------------------------------------------------------------
        | Recent stories
        |--------------------------------------------------------------------------
        */

        $recentStories = Story::query()
            ->with('category')
            ->latest()
            ->limit(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Upcoming events
        |--------------------------------------------------------------------------
        */

        $events = Event::query()
            ->where('status', 'published')
            ->where(function ($query) use (
                $today,
                $currentTime
            ) {
                $query->whereDate(
                    'event_date',
                    '>',
                    $today
                )
                ->orWhere(function ($query) use (
                    $today,
                    $currentTime
                ) {
                    $query
                        ->whereDate(
                            'event_date',
                            $today
                        )
                        ->where(function ($query) use (
                            $currentTime
                        ) {
                            $query
                                ->whereNull(
                                    'end_time'
                                )
                                ->orWhere(
                                    'end_time',
                                    '>',
                                    $currentTime
                                );
                        });
                });
            })
            ->orderBy('event_date')
            ->orderBy('start_time')
            ->limit(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,

            'data' => [
                'stats' => [
                    'stories' => $totalStories,

                    'published_stories' =>
                        $publishedStories,

                    'draft_stories' =>
                        $draftStories,

                    'events' => $totalEvents,

                    'upcoming_events' =>
                        $upcomingEvents,

                    'galleries' =>
                        $galleryAlbums,

                    'gallery_albums' =>
                        $galleryAlbums,

                    'users' =>
                        $totalUsers,
                ],

                'recent_stories' =>
                    $recentStories,

                'upcoming_events' =>
                    $events,
            ],
        ]);
    }
}