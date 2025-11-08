<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request and add security headers.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent clickjacking attacks
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Enable XSS protection (legacy browsers)
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Control referrer information
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content Security Policy
        $isDevelopment = config('app.env') === 'local';
        $appHost = parse_url(config('app.url'), PHP_URL_HOST);
        
        // Build CSP directives
        $cspDirectives = [
            "default-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
        ];
        
        // Script sources
        $scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://cdn.jsdelivr.net"];
        if ($isDevelopment) {
            $scriptSrc[] = "https://{$appHost}:5173";
            $scriptSrc[] = "http://{$appHost}:5173";
        }
        $cspDirectives[] = "script-src " . implode(' ', $scriptSrc);
        
        // Style sources
        $styleSrc = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.bunny.net"];
        if ($isDevelopment) {
            $styleSrc[] = "https://{$appHost}:5173";
            $styleSrc[] = "http://{$appHost}:5173";
        }
        $cspDirectives[] = "style-src " . implode(' ', $styleSrc);
        
        // Font sources
        $cspDirectives[] = "font-src 'self' https://fonts.gstatic.com https://fonts.bunny.net data:";
        
        // Image sources
        $cspDirectives[] = "img-src 'self' data: https: blob:";
        
        // Connect sources (for API calls and WebSockets)
        $connectSrc = ["'self'", "https://api.stripe.com", "wss://{$appHost}"];
        if ($isDevelopment) {
            $connectSrc[] = "https://{$appHost}:5173";
            $connectSrc[] = "http://{$appHost}:5173";
            $connectSrc[] = "ws://{$appHost}:5173";
            $connectSrc[] = "wss://{$appHost}:5173";
            // Allow Pusher/Laravel Echo connections on localhost
            $connectSrc[] = "ws://localhost:8080";
            $connectSrc[] = "wss://localhost:8080";
            $connectSrc[] = "ws://127.0.0.1:8080";
            $connectSrc[] = "wss://127.0.0.1:8080";
        }
        $cspDirectives[] = "connect-src " . implode(' ', $connectSrc);
        
        // Frame sources
        $cspDirectives[] = "frame-src 'self' https://js.stripe.com https://hooks.stripe.com";
        
        // Only upgrade insecure requests in production
        if (!$isDevelopment) {
            $cspDirectives[] = "upgrade-insecure-requests";
        }
        
        $csp = implode('; ', $cspDirectives);
        $response->headers->set('Content-Security-Policy', $csp);

        // Additional security headers
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        return $response;
    }
}
