<?php

namespace App\Http\Middleware;

use App\Helpers\LogHelper;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsCustomer
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            LogHelper::security('Unauthenticated customer access attempt', [
                'route' => $request->route()?->getName(),
                'path' => $request->path(),
            ]);
            return redirect()->route('login');
        }

        $user = auth()->user();

        if (!$user->is_active) {
            LogHelper::security('Inactive user customer access attempt', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'route' => $request->route()?->getName(),
            ]);
            auth()->logout();
            return redirect()->route('login')->with('error', 'Your account has been deactivated.');
        }

        if (!$user->isCustomer()) {
            LogHelper::security('Unauthorized customer access attempt', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_role' => $user->role,
                'route' => $request->route()?->getName(),
                'path' => $request->path(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            abort(403, 'Customer access required.');
        }

        return $next($request);
    }
}
