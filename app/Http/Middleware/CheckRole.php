<?php

namespace App\Http\Middleware;

use App\Helpers\LogHelper;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $role
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!auth()->check()) {
            LogHelper::security('Unauthenticated access attempt', [
                'required_role' => $role,
                'route' => $request->route()?->getName(),
                'path' => $request->path(),
            ]);
            return redirect()->route('login');
        }

        $user = auth()->user();

        if (!$user->is_active) {
            LogHelper::security('Inactive user access attempt', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'required_role' => $role,
                'route' => $request->route()?->getName(),
            ]);
            auth()->logout();
            return redirect()->route('login')->with('error', 'Your account has been deactivated.');
        }

        if ($user->role !== $role) {
            LogHelper::security('Unauthorized role access attempt', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_role' => $user->role,
                'required_role' => $role,
                'route' => $request->route()?->getName(),
                'path' => $request->path(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            abort(403, 'Unauthorized access.');
        }

        return $next($request);
    }
}
