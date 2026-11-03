<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Force every generated URL (assets, routes, image links) to use
        // APP_URL from .env — regardless of the request's Host header.
        // Prevents "http://localhost:8000/..." from leaking into API
        // responses when the backend is reached via a forwarded URL.
        if (config('app.url')) {
            URL::forceRootUrl(config('app.url'));

            if (str_starts_with((string) config('app.url'), 'https://')) {
                URL::forceScheme('https');
            }
        }
    }
}