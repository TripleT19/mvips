<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBursar
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user, 401, 'Authentication required.');

        abort_unless(
            in_array($user->role, ['bursar', 'admin', 'administrator'], true),
            403,
            'Only the bursar can manage school fees.'
        );

        return $next($request);
    }
}