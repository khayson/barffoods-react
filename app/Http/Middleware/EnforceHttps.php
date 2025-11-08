<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceHttps
{
    /**
     * Handle an incoming request and enforce HTTPS in production.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only enforce HTTPS in production environment
        if (app()->environment('production') && !$request->secure()) {
            // Redirect to HTTPS version of the URL
            return redirect()->secure($request->getRequestUri(), 301);
        }

        return $next($request);
    }
}
