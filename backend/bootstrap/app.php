<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AdministratorMiddleware;
use App\Http\Middleware\AdmissionRoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(
    basePath: dirname(__DIR__)
)
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware): void {

        /*
        |--------------------------------------------------------------------------
        | Middleware Aliases
        |--------------------------------------------------------------------------
        |
        | admin          → CMS roles: administrator, editor, staff
        | administrator  → administrator only (user management)
        | admission.role → takes role names as parameters
        |                  e.g. 'admission.role:principal'
        |
        */

        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'administrator' => AdministratorMiddleware::class,
            'admission.role' => AdmissionRoleMiddleware::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions): void {

        /*
        |--------------------------------------------------------------------------
        | Return JSON for API Requests
        |--------------------------------------------------------------------------
        */

        $exceptions->shouldRenderJsonWhen(
            function (Request $request): bool {
                return $request->is('api/*')
                    || $request->expectsJson();
            }
        );
    })

    ->create();