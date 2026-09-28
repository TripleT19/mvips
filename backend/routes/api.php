<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AdminProfileController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\GalleryImageController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Mount View International Primary School & Early Years Centre
|
| Public website:
|   /api/stories
|   /api/events
|   /api/gallery
|
| Administration:
|   /api/admin/*
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| ADMIN LOGIN
|--------------------------------------------------------------------------
|
| POST /api/admin/login
|
| Allowed CMS roles:
| - administrator
| - editor
| - staff
|
|--------------------------------------------------------------------------
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

    /*
    |--------------------------------------------------------------------------
    | Find user
    |--------------------------------------------------------------------------
    */

    $user = \App\Models\User::where(
        'email',
        strtolower(trim($validated['email']))
    )->first();

    /*
    |--------------------------------------------------------------------------
    | Invalid credentials
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Inactive account
    |--------------------------------------------------------------------------
    */

    if (!$user->is_active) {
        return response()->json([
            'success' => false,
            'message' => 'Your account is inactive. Please contact the administrator.',
        ], 403);
    }

    /*
    |--------------------------------------------------------------------------
    | CMS ACCESS
    |--------------------------------------------------------------------------
    */

    $allowedRoles = [
        'administrator',
        'editor',
        'staff',
    ];

    if (!in_array($user->role, $allowedRoles, true)) {
        return response()->json([
            'success' => false,
            'message' => 'You do not have access to the administration portal.',
        ], 403);
    }

    /*
    |--------------------------------------------------------------------------
    | Remove previous tokens
    |--------------------------------------------------------------------------
    */

    $user->tokens()->delete();

    $token = $user->createToken(
        'mount-view-admin'
    )->plainTextToken;

    /*
    |--------------------------------------------------------------------------
    | Successful login
    |--------------------------------------------------------------------------
    */

    return response()->json([
        'success' => true,
        'message' => 'Login successful.',
        'token' => $token,

        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => (bool) $user->is_active,
        ],
    ]);
});


/*
|--------------------------------------------------------------------------
| AUTHENTICATED USER ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | CURRENT USER
    |--------------------------------------------------------------------------
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
                'is_active' => (bool) $user->is_active,
                'created_at' => $user->created_at,
            ],
        ]);
    });


    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
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
*/

Route::get(
    '/stories',
    [StoryController::class, 'publicIndex']
);

Route::get(
    '/stories/{slug}',
    [StoryController::class, 'showPublic']
);


/*
|--------------------------------------------------------------------------
| PUBLIC EVENTS
|--------------------------------------------------------------------------
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
| ADMIN PORTAL
|--------------------------------------------------------------------------
|
| Available to:
|
| - administrator
| - editor
| - staff
|
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    'admin',
])->group(function () {


    /*
    |--------------------------------------------------------------------------
    | STORY CATEGORIES
    |--------------------------------------------------------------------------
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
    | ADMIN STORIES
    |--------------------------------------------------------------------------
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

    /*
    |--------------------------------------------------------------------------
    | STORY UPDATE
    |--------------------------------------------------------------------------
    |
    | POST is included because story updates may contain image uploads.
    |
    | The frontend can use:
    |
    | POST + _method=PUT
    |
    | or:
    |
    | PUT
    |
    | or:
    |
    | PATCH
    |
    */

    Route::match(
        ['post', 'put', 'patch'],
        '/admin/stories/{story}',
        [StoryController::class, 'update']
    );

    Route::delete(
        '/admin/stories/{story}',
        [StoryController::class, 'destroy']
    );


    /*
    |--------------------------------------------------------------------------
    | ADMIN EVENTS
    |--------------------------------------------------------------------------
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

    /*
    |--------------------------------------------------------------------------
    | EVENT UPDATE
    |--------------------------------------------------------------------------
    |
    | POST is supported for multipart image uploads.
    |
    */

    Route::match(
        ['post', 'put', 'patch'],
        '/admin/events/{event}',
        [EventController::class, 'update']
    );

    Route::delete(
        '/admin/events/{event}',
        [EventController::class, 'destroy']
    );


    /*
    |--------------------------------------------------------------------------
    | ADMIN GALLERY
    |--------------------------------------------------------------------------
    |
    | Gallery albums support multiple images.
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

    /*
    |--------------------------------------------------------------------------
    | GALLERY UPDATE
    |--------------------------------------------------------------------------
    |
    | POST is supported because gallery updates may contain
    | multiple image uploads.
    |
    */

    Route::match(
        ['post', 'put', 'patch'],
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
    | ADMIN PROFILE
    |--------------------------------------------------------------------------
    |
    | All CMS users can manage their own profile.
    |
    | Email is changed only by an administrator.
    |
    */

    Route::get(
        '/admin/profile',
        [AdminProfileController::class, 'show']
    );

    Route::put(
        '/admin/profile',
        [AdminProfileController::class, 'update']
    );

    Route::post(
        '/admin/profile/password',
        [AdminProfileController::class, 'changePassword']
    );


    /*
    |--------------------------------------------------------------------------
    | ADMIN DASHBOARD
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/admin/dashboard',
        [DashboardController::class, 'index']
    );
});


/*
|--------------------------------------------------------------------------
| ADMINISTRATOR-ONLY ROUTES
|--------------------------------------------------------------------------
|
| Only users with:
|
| role = administrator
|
| can manage user accounts.
|
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    'administrator',
])->group(function () {


    /*
    |--------------------------------------------------------------------------
    | USER MANAGEMENT
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/admin/users',
        [AdminUserController::class, 'index']
    );

    Route::post(
        '/admin/users',
        [AdminUserController::class, 'store']
    );

    Route::post(
        '/admin/users/bulk',
        [AdminUserController::class, 'bulkStore']
    );

    Route::get(
        '/admin/users/{user}',
        [AdminUserController::class, 'show']
    );

    Route::put(
        '/admin/users/{user}',
        [AdminUserController::class, 'update']
    );

    Route::post(
        '/admin/users/{user}/reset-password',
        [AdminUserController::class, 'resetPassword']
    );

    Route::post(
        '/admin/users/{user}/resend-activation',
        [AdminUserController::class, 'resendActivation']
    );

    Route::delete(
        '/admin/users/{user}',
        [AdminUserController::class, 'destroy']
    );
});