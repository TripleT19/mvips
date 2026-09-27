<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\GalleryImageController;
use App\Http\Controllers\Api\CategoryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Mount View International Primary School & Early Years Centre
| API routes for the public website and administration portal.
|
*/


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Admin Login
|--------------------------------------------------------------------------
|
| POST /api/admin/login
|
*/
Route::post('/admin/login', function (Request $request) {

    $validated = $request->validate([
        'email' => [
            'required',
            'email',
        ],

        'password' => [
            'required',
            'string',
        ],

        'remember' => [
            'nullable',
            'boolean',
        ],
    ]);

    $user = \App\Models\User::where(
        'email',
        $validated['email']
    )->first();

    if (
        !$user ||
        !Hash::check(
            $validated['password'],
            $user->password
        )
    ) {
        return response()->json([
            'success' => false,
            'message' => 'The email or password is incorrect.',
        ], 401);
    }

    if (!$user->is_active) {
        return response()->json([
            'success' => false,
            'message' => 'Your account is inactive. Please contact the administrator.',
        ], 403);
    }

    if (
        !in_array(
            $user->role,
            [
                'administrator',
                'admin',
            ],
            true
        )
    ) {
        return response()->json([
            'success' => false,
            'message' => 'You do not have administrator access.',
        ], 403);
    }

    /*
    |--------------------------------------------------------------------------
    | Remove previous tokens
    |--------------------------------------------------------------------------
    |
    | This keeps the account secure by making the newly issued token
    | the active API token.
    |
    */
    $user->tokens()->delete();

    $token = $user->createToken(
        'mount-view-admin'
    )->plainTextToken;

    return response()->json([
        'success' => true,

        'message' => 'Login successful.',

        'token' => $token,

        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
        ],
    ]);
});


/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Current User
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/user
    |
    */

    Route::get('/admin/user', function (Request $request) {

        $user = $request->user();

        return response()->json([
            'success' => true,

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
            ],
        ]);
    });


    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/logout
    |
    */

    Route::post('/admin/logout', function (Request $request) {

        $token = $request->user()->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    });
});


/*
|--------------------------------------------------------------------------
| PUBLIC STORIES
|--------------------------------------------------------------------------
|
| These routes are available to visitors without authentication.
|
*/


/*
|--------------------------------------------------------------------------
| Public Story List
|--------------------------------------------------------------------------
|
| GET /api/stories
|
*/

Route::get(
    '/stories',
    [StoryController::class, 'publicIndex']
);


/*
|--------------------------------------------------------------------------
| Public Story
|--------------------------------------------------------------------------
|
| GET /api/stories/{slug}
|
*/

Route::get(
    '/stories/{slug}',
    [StoryController::class, 'showPublic']
);


/*
|--------------------------------------------------------------------------
| PUBLIC EVENTS
|--------------------------------------------------------------------------
|
| GET /api/events
| GET /api/events/{slug}
|
| The EventController handles:
| - published status
| - expired events
| - today's events
| - event time
|
*/


Route::get(
    '/events',
    [EventController::class, 'publicIndex']
);


Route::get(
    '/events/{slug}',
    [EventController::class, 'showPublic']
);


/*
|--------------------------------------------------------------------------
| PUBLIC GALLERY
|--------------------------------------------------------------------------
|
| GET /api/gallery
| GET /api/gallery/{slug}
|
*/


Route::get(
    '/gallery',
    [GalleryController::class, 'publicIndex']
);


Route::get(
    '/gallery/{slug}',
    [GalleryController::class, 'showPublic']
);


/*
|--------------------------------------------------------------------------
| ADMIN API
|--------------------------------------------------------------------------
|
| Everything below requires:
|
| 1. Sanctum authentication
| 2. Administrator/admin middleware
|
*/


Route::middleware([
    'auth:sanctum',
    'admin',
])->group(function () {


    /*
    |--------------------------------------------------------------------------
    | STORY CATEGORIES
    |--------------------------------------------------------------------------
    |
    | GET  /api/admin/categories
    | POST /api/admin/categories
    |
    */


    Route::get(
        '/admin/categories',
        [CategoryController::class, 'index']
    );


    Route::post(
        '/admin/categories',
        [CategoryController::class, 'store']
    );


    /*
    |--------------------------------------------------------------------------
    | STORIES
    |--------------------------------------------------------------------------
    |
    | GET    /api/admin/stories
    | POST   /api/admin/stories
    | GET    /api/admin/stories/{story}
    | POST   /api/admin/stories/{story}
    | DELETE /api/admin/stories/{story}
    |
    */


    Route::get(
        '/admin/stories',
        [StoryController::class, 'index']
    );


    Route::post(
        '/admin/stories',
        [StoryController::class, 'store']
    );


    Route::get(
        '/admin/stories/{story}',
        [StoryController::class, 'show']
    );


    Route::post(
        '/admin/stories/{story}',
        [StoryController::class, 'update']
    );


    Route::delete(
        '/admin/stories/{story}',
        [StoryController::class, 'destroy']
    );


    /*
    |--------------------------------------------------------------------------
    | EVENTS
    |--------------------------------------------------------------------------
    |
    | Public events use:
    | /api/events
    |
    | Admin events use:
    | /api/admin/events
    |
    */


    Route::get(
        '/admin/events',
        [EventController::class, 'index']
    );


    Route::post(
        '/admin/events',
        [EventController::class, 'store']
    );


    Route::get(
        '/admin/events/{event}',
        [EventController::class, 'show']
    );


    Route::post(
        '/admin/events/{event}',
        [EventController::class, 'update']
    );


    Route::delete(
        '/admin/events/{event}',
        [EventController::class, 'destroy']
    );


    /*
    |--------------------------------------------------------------------------
    | GALLERY
    |--------------------------------------------------------------------------
    |
    | Gallery albums with multiple images.
    |
    */


    Route::get(
        '/admin/gallery',
        [GalleryController::class, 'index']
    );


    Route::post(
        '/admin/gallery',
        [GalleryController::class, 'store']
    );


    Route::get(
        '/admin/gallery/{gallery}',
        [GalleryController::class, 'show']
    );


    Route::post(
        '/admin/gallery/{gallery}',
        [GalleryController::class, 'update']
    );


    Route::delete(
        '/admin/gallery/{gallery}',
        [GalleryController::class, 'destroy']
    );


    /*
    |--------------------------------------------------------------------------
    | GALLERY IMAGES
    |--------------------------------------------------------------------------
    |
    | Delete individual image
    | Reorder gallery images
    |
    */


    Route::delete(
        '/admin/gallery-images/{galleryImage}',
        [GalleryImageController::class, 'destroy']
    );


    Route::post(
        '/admin/gallery-images/reorder',
        [GalleryImageController::class, 'reorder']
    );


    /*
    |--------------------------------------------------------------------------
    | ADMIN MEDIA
    |--------------------------------------------------------------------------
    |
    | Placeholder area for future media-library endpoints.
    |
    | The current website can continue using story, event and gallery
    | image uploads directly.
    |
    */


    /*
    |--------------------------------------------------------------------------
    | ADMIN PROFILE
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/profile
    |
    */


    Route::get('/admin/profile', function (Request $request) {

        $user = $request->user();

        return response()->json([
            'success' => true,

            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    });


    /*
    |--------------------------------------------------------------------------
    | ADMIN DASHBOARD
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/dashboard
    |
    | Basic statistics for the admin dashboard.
    |
    */


    Route::get('/admin/dashboard', function () {

        $stories = \App\Models\Story::query();

        $events = \App\Models\Event::query();

        $galleries = \App\Models\Gallery::query();

        return response()->json([
            'success' => true,

            'data' => [

                'stories' => [
                    'total' => (clone $stories)->count(),

                    'published' => (clone $stories)
                        ->where('status', 'published')
                        ->count(),

                    'drafts' => (clone $stories)
                        ->where('status', 'draft')
                        ->count(),
                ],

                'events' => [
                    'total' => (clone $events)->count(),

                    'published' => (clone $events)
                        ->where('status', 'published')
                        ->count(),

                    'upcoming' => (clone $events)
                        ->where('status', 'published')
                        ->whereDate(
                            'event_date',
                            '>=',
                            now()->toDateString()
                        )
                        ->count(),
                ],

                'gallery' => [
                    'total' => (clone $galleries)->count(),

                    'published' => (clone $galleries)
                        ->where('status', 'published')
                        ->count(),
                ],
            ],
        ]);
    });
});