<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdmissionRoleMiddleware {
    public function handle(Request $request, Closure $next, ...$roles): Response {
        $user = $request->user();

        if (!$user) return response()->json(['success'=>false,'message'=>'Unauthenticated.'], 401);
        if (!$user->is_active) return response()->json(['success'=>false,'message'=>'Your account is inactive.'], 403);

        if ($user->role === 'administrator') return $next($request);

        if (!in_array($user->role, $roles, true)) {
            return response()->json(['success'=>false,'message'=>'You do not have permission to access this admissions function.'], 403);
        }

        return $next($request);
    }
}
