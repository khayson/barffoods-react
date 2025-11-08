<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class AddRateLimitHeaders
{
    /**
     * Handle an incoming request and add rate limit headers to the response.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Determine which rate limiter is being used
        $limiterName = $this->getActiveLimiter($request);
        
        if ($limiterName) {
            // Build the rate limiter key using the same format as Laravel's throttle middleware
            $key = $this->buildRateLimiterKey($request, $limiterName);

            // Get rate limit information
            $maxAttempts = $this->getMaxAttempts($limiterName);
            $remainingAttempts = RateLimiter::remaining($key, $maxAttempts);
            $retryAfter = RateLimiter::availableIn($key);

            // Add rate limit headers to response
            $response->headers->set('X-RateLimit-Limit', (string)$maxAttempts);
            $response->headers->set('X-RateLimit-Remaining', (string)max(0, $remainingAttempts));

            // Add Retry-After header if rate limit is exceeded
            if ($response->getStatusCode() === 429) {
                $response->headers->set('Retry-After', (string)$retryAfter);
                $response->headers->set('X-RateLimit-Reset', (string)now()->addSeconds($retryAfter)->timestamp);
            }
        }

        return $response;
    }
    
    /**
     * Get the active rate limiter name from route middleware
     */
    protected function getActiveLimiter(Request $request): ?string
    {
        $routeMiddleware = $request->route()?->middleware() ?? [];

        foreach ($routeMiddleware as $middleware) {
            if (str_contains($middleware, 'throttle:')) {
                // Extract the rate limiter name
                $parts = explode(':', $middleware);
                return $parts[1] ?? null;
            }
        }

        return null;
    }

    /**
     * Build the rate limiter key using the same format as Laravel's throttle middleware.
     */
    protected function buildRateLimiterKey(Request $request, string $limiterName): string
    {
        // Use the same key format as the rate limiter configuration
        $identifier = match ($limiterName) {
            'auth', 'guest', 'webhook' => $request->ip(),
            'authenticated' => $request->user()?->id ?: $request->ip(),
            default => $request->user()?->id ?: $request->ip(),
        };

        return $limiterName . ':' . $identifier;
    }

    /**
     * Get the maximum number of attempts for the given rate limiter.
     */
    protected function getMaxAttempts(string $limiterName): int
    {
        return match ($limiterName) {
            'auth' => 5,
            'payment' => 10,
            'guest' => 30,
            'authenticated' => 120,
            'admin' => 300,
            'webhook' => 100,
            default => 60, // api default
        };
    }
}
