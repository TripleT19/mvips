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
use App\Http\Controllers\Api\ContactMessageController;

/* ---- Academic module ---- */
use App\Http\Controllers\Api\AcademicLookupController;
use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\AcademicTermController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\ClassSubjectController;
use App\Http\Controllers\Api\ClubController;
use App\Http\Controllers\Api\TeacherAssignmentController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\StudentPhotoController;
use App\Http\Controllers\Api\AssessmentObjectiveController;
use App\Http\Controllers\Api\AssessmentSheetController;
use App\Http\Controllers\Api\TermReportPublishController;

/* ---- Student & parent portals ---- */
use App\Http\Controllers\Api\StudentAccountController;
use App\Http\Controllers\Api\ParentPortalController;
use App\Http\Controllers\Api\ParentAuthController;

/* ---- Portal meta ---- */
use App\Http\Controllers\Api\PortalCapabilityController;

/* ---- Finance module (bursar-only) ---- */
use App\Http\Controllers\Api\SchoolBankAccountController;
use App\Http\Controllers\Api\FeeStructureController;
use App\Http\Controllers\Api\FeeInvoiceController;
use App\Http\Controllers\Api\FeePaymentController;
use App\Http\Controllers\Api\FeeDashboardController;

/* ============================================================
 * ADMIN AUTH
 * ============================================================ */

Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::post('/admin/activate-account', [AdminAuthController::class, 'activateAccount']);

/* ============================================================
 * PARENT AUTH
 * ============================================================ */

Route::prefix('parent')->group(function () {
    Route::post('/login',            [ParentAuthController::class, 'login']);
    Route::post('/activate-account', [ParentAuthController::class, 'activateAccount']);
    Route::post('/forgot-password',  [ParentAuthController::class, 'forgotPassword']);
    Route::post('/reset-password',   [ParentAuthController::class, 'resetPassword']);
});

/* ============================================================
 * PUBLIC WEBSITE
 * ============================================================ */

Route::get('/stories', [StoryController::class, 'publicIndex']);
Route::get('/stories/{slug}', [StoryController::class, 'showPublic']);

Route::get('/events', [EventController::class, 'publicIndex']);
Route::get('/events/{slug}', [EventController::class, 'showPublic']);

Route::get('/gallery', [GalleryController::class, 'publicIndex']);
Route::get('/gallery/{slug}', [GalleryController::class, 'showPublic']);

Route::get('/newsletters', [NewsletterController::class, 'publicIndex']);
Route::get('/newsletters/{slug}', [NewsletterController::class, 'publicShow']);
Route::get('/newsletters/{slug}/download', [NewsletterController::class, 'download']);

Route::post('/newsletter-subscribers', [NewsletterSubscriberController::class, 'store']);
Route::get('/newsletter-subscribers/unsubscribe/{token}', [NewsletterSubscriberController::class, 'unsubscribe']);

Route::post('/contact-messages', [ContactMessageController::class, 'store']);

/* ============================================================
 * PUBLIC ADMISSIONS
 * ============================================================ */

Route::post('/admissions/applications', [PublicAdmissionController::class, 'start']);
Route::post('/admissions/applications/resend-credentials', [PublicAdmissionController::class, 'resendCredentials']);
Route::post('/admissions/applications/{applicationNumber}/track', [PublicAdmissionController::class, 'show']);
Route::post('/admissions/applications/{applicationNumber}/save', [PublicAdmissionController::class, 'save']);
Route::post('/admissions/applications/{applicationNumber}/photo', [PublicAdmissionController::class, 'uploadPhoto']);
Route::get('/admissions/applications/{applicationNumber}/photo', [PublicAdmissionController::class, 'showPhoto']);
Route::post('/admissions/applications/{applicationNumber}/documents', [PublicAdmissionController::class, 'uploadDocument']);
Route::post('/admissions/applications/{applicationNumber}/submit', [PublicAdmissionController::class, 'submit']);

/* ============================================================
 * PORTAL — AUTHENTICATED (staff + parents)
 * ============================================================ */

Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    /* ---- Identity & session ---- */
    Route::get('/admin/user',   [AdminAuthController::class, 'user']);
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);

    /* ---- Portal capabilities ---- */
    Route::get('/admin/portal/capabilities', [PortalCapabilityController::class, 'show']);

    /* ---- Profile ---- */
    Route::get('/admin/profile', [AdminProfileController::class, 'show']);
    Route::put('/admin/profile', [AdminProfileController::class, 'update']);
    Route::post('/admin/profile/password', [AdminProfileController::class, 'changePassword']);
});

/* ============================================================
 * DASHBOARD — staff only
 * ============================================================ */

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/admin/dashboard', [DashboardController::class, 'index']);
});

/* ============================================================
 * PARENT PORTAL — bound by SLUG, not ID
 * ------------------------------------------------------------
 *   /admin/parent/children/{student:slug}/terms
 *   /admin/parent/children/{student:slug}/results?term_id=…
 *
 * The `:slug` hint makes Laravel resolve Student by the slug
 * column for these routes only. Everywhere else in the app,
 * `{student}` still binds by the primary key.
 * ============================================================ */

Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin/parent')
    ->group(function () {
        Route::get('/children',                          [ParentPortalController::class, 'children']);
        Route::get('/children/{student:slug}/terms',     [ParentPortalController::class, 'terms']);
        Route::get('/children/{student:slug}/results',   [ParentPortalController::class, 'results']);
    });

/* ============================================================
 * CMS — website content
 * ============================================================ */

Route::middleware(['auth:sanctum', 'admin', 'cms'])->group(function () {

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

    Route::get('/admin/newsletters', [NewsletterController::class, 'index']);
    Route::post('/admin/newsletters', [NewsletterController::class, 'store']);
    Route::get('/admin/newsletters/{newsletter}', [NewsletterController::class, 'show']);
    Route::match(['put', 'patch'], '/admin/newsletters/{newsletter}', [NewsletterController::class, 'update']);
    Route::delete('/admin/newsletters/{newsletter}', [NewsletterController::class, 'destroy']);

    Route::get('/admin/newsletter-subscribers', [NewsletterSubscriberController::class, 'index']);
    Route::delete('/admin/newsletter-subscribers/{subscriber}', [NewsletterSubscriberController::class, 'destroy']);

    Route::get('/admin/contact-messages', [ContactMessageController::class, 'index']);
    Route::get('/admin/contact-messages/{contactMessage}', [ContactMessageController::class, 'show']);
    Route::match(['put', 'patch'], '/admin/contact-messages/{contactMessage}', [ContactMessageController::class, 'update']);
    Route::post('/admin/contact-messages/{contactMessage}/reply', [ContactMessageController::class, 'reply']);
    Route::delete('/admin/contact-messages/{contactMessage}', [ContactMessageController::class, 'destroy']);
});

/* ============================================================
 * PRINTABLE APPLICATION
 * ============================================================ */

Route::get(
    'admin/admissions/applications/{application}/print',
    [AdminAdmissionController::class, 'printApplication']
);

/* ============================================================
 * ADMISSIONS ADMIN MODULE
 * ============================================================ */

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

    Route::post('/applications/{application}/paper-enrol', [AdminAdmissionController::class, 'paperEnrol']);
    Route::post('/students/{student}/reassign', [AdminAdmissionController::class, 'reassignStudent']);

    Route::get('/applications/{application}', [AdminAdmissionController::class, 'show']);
    Route::match(['put', 'patch'], '/applications/{application}', [AdminAdmissionController::class, 'update']);

    Route::get('/applications/{application}/documents/{document}/preview', [AdminAdmissionController::class, 'previewDocument']);
    Route::get('/applications/{application}/documents/{document}/download', [AdminAdmissionController::class, 'downloadDocument']);
    Route::post('/applications/{application}/documents/{document}/verify', [AdminAdmissionController::class, 'verifyDocument']);

    Route::post('/applications/{application}/assessments', [AdminAdmissionController::class, 'scheduleAssessment']);
    Route::post('/assessments/{assessment}/complete', [AdminAdmissionController::class, 'completeAssessment']);

    Route::post('/applications/{application}/enrol', [AdminAdmissionController::class, 'enrol']);

    Route::post('/applications/{application}/comments', [AdminAdmissionController::class, 'storeComment']);
    Route::match(['put', 'patch'], '/applications/{application}/comments/{comment}', [AdminAdmissionController::class, 'updateComment']);
    Route::delete('/applications/{application}/comments/{comment}', [AdminAdmissionController::class, 'destroyComment']);

    Route::match(['put', 'patch'], '/applications/{application}/decisions/{decision}', [AdminAdmissionController::class, 'updateDecision']);
    Route::delete('/applications/{application}/decisions/{decision}', [AdminAdmissionController::class, 'destroyDecision']);
});

Route::middleware([
    'auth:sanctum',
    'admission.role:principal',
])->prefix('admin/admissions')->group(function () {
    Route::post('/applications/{application}/decision', [AdminAdmissionController::class, 'decide']);
});

/* ============================================================
 * ADMINISTRATOR-ONLY USER MANAGEMENT
 * ============================================================ */

Route::middleware(['auth:sanctum', 'administrator'])->group(function () {
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::post('/admin/users/bulk', [AdminUserController::class, 'bulkStore']);
    Route::get('/admin/users/{user}', [AdminUserController::class, 'show']);
    Route::put('/admin/users/{user}', [AdminUserController::class, 'update']);
    Route::post('/admin/users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);
    Route::post('/admin/users/{user}/resend-activation', [AdminUserController::class, 'resendActivation']);
    Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);
});

/* ============================================================
 * STUDENT ACCOUNTS
 * ============================================================ */

Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin/student-accounts')
    ->group(function () {
        Route::get('/sections',                      [StudentAccountController::class, 'sections']);
        Route::get('/students',                      [StudentAccountController::class, 'students']);
        Route::post('/preview',                      [StudentAccountController::class, 'preview']);
        Route::post('/bulk',                         [StudentAccountController::class, 'bulkStore']);
        Route::post('/',                             [StudentAccountController::class, 'store']);
        Route::post('/{user}/resend-activation',     [StudentAccountController::class, 'resendActivation']);
        Route::delete('/{student}/guardians/{user}', [StudentAccountController::class, 'unlink']);
    });

/* ============================================================
 * ACADEMIC MODULE
 * ============================================================ */

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {

    Route::get('academic-lookups', [AcademicLookupController::class, 'index']);

    Route::apiResource('academic-years', AcademicYearController::class);
    Route::apiResource('academic-terms', AcademicTermController::class);
    Route::apiResource('subjects', SubjectController::class);
    Route::apiResource('clubs', ClubController::class);

    Route::get('school-classes', [SchoolClassController::class, 'index']);
    Route::post('school-classes', [SchoolClassController::class, 'store']);
    Route::match(['put', 'patch'], 'school-classes/{schoolClass}', [SchoolClassController::class, 'update']);
    Route::patch('school-classes/{schoolClass}/stream', [SchoolClassController::class, 'updateStream']);
    Route::delete('school-classes/{schoolClass}', [SchoolClassController::class, 'destroy']);

    Route::get('class-subjects', [ClassSubjectController::class, 'index']);
    Route::post('class-subjects', [ClassSubjectController::class, 'store']);
    Route::delete('class-subjects/{classSubject}', [ClassSubjectController::class, 'destroy']);

    Route::get('teacher-assignments', [TeacherAssignmentController::class, 'index']);
    Route::post('teacher-assignments', [TeacherAssignmentController::class, 'store']);
    Route::post('teacher-assignments/bulk', [TeacherAssignmentController::class, 'bulkStore']);
    Route::delete('teacher-assignments/{teacherAssignment}', [TeacherAssignmentController::class, 'destroy']);

    Route::prefix('student-photos')->group(function () {
        Route::get   ('sections',        [StudentPhotoController::class, 'sections']);
        Route::get   ('roster',          [StudentPhotoController::class, 'roster']);
        Route::post  ('{student}/photo', [StudentPhotoController::class, 'upload']);
        Route::delete('{student}/photo', [StudentPhotoController::class, 'destroyPhoto']);
    });

    Route::prefix('attendance')->group(function () {
        Route::get   ('sections',                       [AttendanceController::class, 'sections']);
        Route::get   ('sections/{classStream}',         [AttendanceController::class, 'roster']);
        Route::post  ('sections/{classStream}',         [AttendanceController::class, 'save']);
        Route::get   ('sections/{classStream}/history', [AttendanceController::class, 'history']);
        Route::get   ('sections/{classStream}/summary', [AttendanceController::class, 'summary']);
    });

    Route::prefix('assessment-objectives')->group(function () {
        Route::get   ('context',                 [AssessmentObjectiveController::class, 'context']);
        Route::get   ('',                        [AssessmentObjectiveController::class, 'index']);
        Route::post  ('copy-from',               [AssessmentObjectiveController::class, 'copyFrom']);
        Route::post  ('reorder',                 [AssessmentObjectiveController::class, 'reorder']);

        Route::post  ('strands',                 [AssessmentObjectiveController::class, 'storeStrand']);
        Route::put   ('strands/{strand}',        [AssessmentObjectiveController::class, 'updateStrand']);
        Route::delete('strands/{strand}',        [AssessmentObjectiveController::class, 'destroyStrand']);

        Route::post  ('',                        [AssessmentObjectiveController::class, 'store']);
        Route::put   ('/{assessmentObjective}',  [AssessmentObjectiveController::class, 'update']);
        Route::delete('/{assessmentObjective}',  [AssessmentObjectiveController::class, 'destroy']);
    });

    Route::prefix('assessment-sheet')->group(function () {
        Route::get ('sections',       [AssessmentSheetController::class, 'sections']);
        Route::get ('roster',         [AssessmentSheetController::class, 'roster']);
        Route::get ('{student}/form', [AssessmentSheetController::class, 'form']);
        Route::put ('{student}/form', [AssessmentSheetController::class, 'save']);
    });

    Route::post('assessment-sheet/{student}/submit',   [TermReportPublishController::class, 'submit']);
    Route::post('assessment-sheet/{student}/unsubmit', [TermReportPublishController::class, 'unsubmit']);

    Route::prefix('results')->group(function () {
        Route::get ('stats',             [TermReportPublishController::class, 'stats']);
        Route::get ('submissions',       [TermReportPublishController::class, 'list']);
        Route::post('{student}/publish', [TermReportPublishController::class, 'publish']);
        Route::post('bulk-publish',      [TermReportPublishController::class, 'bulkPublish']);
    });
});

/* ============================================================
 * FINANCE MODULE — BURSAR ONLY
 * ============================================================ */

Route::middleware(['auth:sanctum', 'bursar.role'])
    ->prefix('admin/fees')
    ->group(function () {

        Route::get('dashboard', [FeeDashboardController::class, 'index']);

        Route::get   ('bank-accounts',                             [SchoolBankAccountController::class, 'index']);
        Route::post  ('bank-accounts',                             [SchoolBankAccountController::class, 'store']);
        Route::put   ('bank-accounts/{schoolBankAccount}',         [SchoolBankAccountController::class, 'update']);
        Route::post  ('bank-accounts/{schoolBankAccount}/default', [SchoolBankAccountController::class, 'setDefault']);
        Route::delete('bank-accounts/{schoolBankAccount}',         [SchoolBankAccountController::class, 'destroy']);

        Route::get   ('structures',                [FeeStructureController::class, 'index']);
        Route::post  ('structures',                [FeeStructureController::class, 'store']);
        Route::get   ('structures/{feeStructure}', [FeeStructureController::class, 'show']);
        Route::put   ('structures/{feeStructure}', [FeeStructureController::class, 'update']);
        Route::delete('structures/{feeStructure}', [FeeStructureController::class, 'destroy']);

        Route::get   ('invoices',                    [FeeInvoiceController::class, 'index']);
        Route::post  ('invoices/generate',           [FeeInvoiceController::class, 'generate']);
        Route::get   ('invoices/{feeInvoice}',       [FeeInvoiceController::class, 'show']);
        Route::delete('invoices/{feeInvoice}',       [FeeInvoiceController::class, 'destroy']);
        Route::get   ('students/{student}/invoices', [FeeInvoiceController::class, 'studentInvoices']);

        Route::get   ('payments',                       [FeePaymentController::class, 'index']);
        Route::post  ('invoices/{feeInvoice}/payments', [FeePaymentController::class, 'store']);
        Route::delete('payments/{feePayment}',          [FeePaymentController::class, 'destroy']);
        Route::get   ('payments/{feePayment}/receipt',  [FeePaymentController::class, 'receipt']);
    });