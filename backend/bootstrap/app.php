<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AdministratorMiddleware;
use App\Http\Middleware\AdmissionRoleMiddleware;
use App\Http\Middleware\CmsMiddleware;
use App\Http\Middleware\EnsureBursar;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )

    /*
    |--------------------------------------------------------------------------
    | Middleware
    |--------------------------------------------------------------------------
    | All aliases live in a SINGLE withMiddleware() call. Calling
    | withMiddleware() more than once causes each call to overwrite the
    | previous one's alias map — the last block wins and earlier aliases
    | disappear. Keep everything here.
    |
    |   admin           → CMS roles: administrator, editor, staff …
    |   cms             → CMS content editors (see CmsMiddleware)
    |   administrator   → administrator only (user management)
    |   admission.role  → accepts role params, e.g. admission.role:principal
    |   bursar.role     → bursar-only (finance module)
    */
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin'          => AdminMiddleware::class,
            'cms'            => CmsMiddleware::class,
            'administrator'  => AdministratorMiddleware::class,
            'admission.role' => AdmissionRoleMiddleware::class,
            'bursar.role'    => EnsureBursar::class,
        ]);

        // If your front-end uses Sanctum cookie (SPA) auth:
        // $middleware->statefulApi();

        // If CORS matters for sub-domains (admin.mvips.com → api.mvips.com):
        // $middleware->trustProxies(at: '*');
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool =>
                $request->is('api/*') || $request->expectsJson()
        );
    })

    ->create();