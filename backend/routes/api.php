<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminProfileController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\GalleryImageController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PublicAdmissionController;
use App\Http\Controllers\Api\AdminAdmissionController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\NewsletterSubscriberController;

/*
|--------------------------------------------------------------------------
| ADMIN AUTHENTICATION
|--------------------------------------------------------------------------
*/

Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::post('/admin/activate-account', [AdminAuthController::class, 'activateAccount']);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED ADMIN USER
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/user', [AdminAuthController::class, 'user']);
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
});

/*
|--------------------------------------------------------------------------
| PUBLIC WEBSITE
|--------------------------------------------------------------------------
*/

Route::get('/stories', [StoryController::class, 'publicIndex']);
Route::get('/stories/{slug}', [StoryController::class, 'showPublic']);

Route::get('/events', [EventController::class, 'publicIndex']);
Route::get('/events/{slug}', [EventController::class, 'showPublic']);

Route::get('/gallery', [GalleryController::class, 'publicIndex']);
Route::get('/gallery/{slug}', [GalleryController::class, 'showPublic']);

/*
|--------------------------------------------------------------------------
| PUBLIC NEWSLETTERS
|--------------------------------------------------------------------------
*/

Route::get('/newsletters', [NewsletterController::class, 'publicIndex']);
Route::get('/newsletters/{slug}', [NewsletterController::class, 'publicShow']);
Route::get('/newsletters/{slug}/download', [NewsletterController::class, 'download']);

/*
|--------------------------------------------------------------------------
| PUBLIC NEWSLETTER SUBSCRIBERS
|--------------------------------------------------------------------------
| Anybody can subscribe, and the unsubscribe link in emails is public.
*/

Route::post('/newsletter-subscribers', [NewsletterSubscriberController::class, 'store']);
Route::get('/newsletter-subscribers/unsubscribe/{token}', [NewsletterSubscriberController::class, 'unsubscribe']);

/*
|--------------------------------------------------------------------------
| PUBLIC ADMISSIONS
|--------------------------------------------------------------------------
*/

Route::post('/admissions/applications', [PublicAdmissionController::class, 'start']);
Route::post('/admissions/applications/resend-credentials', [PublicAdmissionController::class, 'resendCredentials']);
Route::post('/admissions/applications/{applicationNumber}/track', [PublicAdmissionController::class, 'show']);
Route::post('/admissions/applications/{applicationNumber}/save', [PublicAdmissionController::class, 'save']);
Route::post('/admissions/applications/{applicationNumber}/photo', [PublicAdmissionController::class, 'uploadPhoto']);
Route::get('/admissions/applications/{applicationNumber}/photo', [PublicAdmissionController::class, 'showPhoto']);
Route::post('/admissions/applications/{applicationNumber}/documents', [PublicAdmissionController::class, 'uploadDocument']);
Route::post('/admissions/applications/{applicationNumber}/submit', [PublicAdmissionController::class, 'submit']);

/*
|--------------------------------------------------------------------------
| GENERAL ADMIN PORTAL
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    Route::get('/admin/categories', [CategoryController::class, 'index']);
    Route::post('/admin/categories', [CategoryController::class, 'store']);

    Route::get('/admin/stories', [StoryController::class, 'index']);
    Route::post('/admin/stories', [StoryController::class, 'store']);
    Route::get('/admin/stories/{story}', [StoryController::class, 'show']);
    Route::match(['post', 'put', 'patch'], '/admin/stories/{story}', [StoryController::class, 'update']);
    Route::delete('/admin/stories/{story}', [StoryController::class, 'destroy']);

    Route::get('/admin/events', [EventController::class, 'index']);
    Route::post('/admin/events', [EventController::class, 'store']);
    Route::get('/admin/events/{event}', [EventController::class, 'show']);
    Route::match(['post', 'put', 'patch'], '/admin/events/{event}', [EventController::class, 'update']);
    Route::delete('/admin/events/{event}', [EventController::class, 'destroy']);

    Route::get('/admin/gallery', [GalleryController::class, 'index']);
    Route::post('/admin/gallery', [GalleryController::class, 'store']);
    Route::get('/admin/gallery/{gallery}', [GalleryController::class, 'show']);
    Route::match(['post', 'put', 'patch'], '/admin/gallery/{gallery}', [GalleryController::class, 'update']);
    Route::delete('/admin/gallery/{gallery}', [GalleryController::class, 'destroy']);

    Route::delete('/admin/gallery-images/{galleryImage}', [GalleryImageController::class, 'destroy']);
    Route::post('/admin/gallery-images/reorder', [GalleryImageController::class, 'reorder']);

    Route::get('/admin/profile', [AdminProfileController::class, 'show']);
    Route::put('/admin/profile', [AdminProfileController::class, 'update']);
    Route::post('/admin/profile/password', [AdminProfileController::class, 'changePassword']);

    Route::get('/admin/dashboard', [DashboardController::class, 'index']);

    /*
    |----------------------------------------------------------------------
    | ADMIN — NEWSLETTERS
    |----------------------------------------------------------------------
    */

    Route::get('/admin/newsletters', [NewsletterController::class, 'index']);
    Route::post('/admin/newsletters', [NewsletterController::class, 'store']);
    Route::get('/admin/newsletters/{newsletter}', [NewsletterController::class, 'show']);
    Route::match(['put', 'patch'], '/admin/newsletters/{newsletter}', [NewsletterController::class, 'update']);
    Route::delete('/admin/newsletters/{newsletter}', [NewsletterController::class, 'destroy']);

    /*
    |----------------------------------------------------------------------
    | ADMIN — NEWSLETTER SUBSCRIBERS
    |----------------------------------------------------------------------
    */

    Route::get('/admin/newsletter-subscribers', [NewsletterSubscriberController::class, 'index']);
    Route::delete('/admin/newsletter-subscribers/{subscriber}', [NewsletterSubscriberController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| PRINTABLE APPLICATION (PUBLIC WITH QUERY-TOKEN)
|--------------------------------------------------------------------------
*/

Route::get(
    'admin/admissions/applications/{application}/print',
    [AdminAdmissionController::class, 'printApplication']
);

/*
|--------------------------------------------------------------------------
| ADMISSIONS ADMIN MODULE
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    'admission.role:admissions_officer,principal,headteacher',
])->prefix('admin/admissions')->group(function () {

    Route::get('/dashboard', [AdminAdmissionController::class, 'dashboard']);
    Route::get('/form-options', [AdminAdmissionController::class, 'formOptions']);

    Route::get('/notifications', [AdminAdmissionController::class, 'notifications']);
    Route::post('/notifications/read-all', [AdminAdmissionController::class, 'markAllNotificationsRead']);
    Route::post('/notifications/{id}/read', [AdminAdmissionController::class, 'markNotificationRead']);

    Route::get('/', [AdminAdmissionController::class, 'index']);
    Route::get('/applications', [AdminAdmissionController::class, 'index']);
    Route::post('/applications', [AdminAdmissionController::class, 'store']);

    Route::get('/applications/{application}', [AdminAdmissionController::class, 'show']);
    Route::match(
        ['put', 'patch'],
        '/applications/{application}',
        [AdminAdmissionController::class, 'update']
    );

    Route::get(
        '/applications/{application}/documents/{document}/preview',
        [AdminAdmissionController::class, 'previewDocument']
    );
    Route::get(
        '/applications/{application}/documents/{document}/download',
        [AdminAdmissionController::class, 'downloadDocument']
    );
    Route::post(
        '/applications/{application}/documents/{document}/verify',
        [AdminAdmissionController::class, 'verifyDocument']
    );

    Route::post(
        '/applications/{application}/assessments',
        [AdminAdmissionController::class, 'scheduleAssessment']
    );
    Route::post(
        '/assessments/{assessment}/complete',
        [AdminAdmissionController::class, 'completeAssessment']
    );

    Route::post(
        '/applications/{application}/enrol',
        [AdminAdmissionController::class, 'enrol']
    );

    Route::post(
        '/applications/{application}/comments',
        [AdminAdmissionController::class, 'storeComment']
    );
    Route::match(
        ['put', 'patch'],
        '/applications/{application}/comments/{comment}',
        [AdminAdmissionController::class, 'updateComment']
    );
    Route::delete(
        '/applications/{application}/comments/{comment}',
        [AdminAdmissionController::class, 'destroyComment']
    );

    Route::match(
        ['put', 'patch'],
        '/applications/{application}/decisions/{decision}',
        [AdminAdmissionController::class, 'updateDecision']
    );
    Route::delete(
        '/applications/{application}/decisions/{decision}',
        [AdminAdmissionController::class, 'destroyDecision']
    );
});

/*
|--------------------------------------------------------------------------
| PRINCIPAL-ONLY ADMISSION DECISIONS
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    'admission.role:principal',
])->prefix('admin/admissions')->group(function () {
    Route::post(
        '/applications/{application}/decision',
        [AdminAdmissionController::class, 'decide']
    );
});

/*
|--------------------------------------------------------------------------
| ADMINISTRATOR-ONLY USER MANAGEMENT
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    'administrator',
])->group(function () {
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::post('/admin/users/bulk', [AdminUserController::class, 'bulkStore']);
    Route::get('/admin/users/{user}', [AdminUserController::class, 'show']);
    Route::put('/admin/users/{user}', [AdminUserController::class, 'update']);
    Route::post('/admin/users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);
    Route::post('/admin/users/{user}/resend-activation', [AdminUserController::class, 'resendActivation']);
    Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);
});