<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class RateLimitServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // Default API rate limiter - 60 requests per minute
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many requests. Please try again later.',
                        'error_code' => 'RATE_LIMIT_EXCEEDED',
                        'timestamp' => now()->toIso8601String(),
                    ], 429, $headers);
                });
        });

        // Authentication endpoints - 5 attempts per minute
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    // Check if this is an Inertia request
                    if ($request->header('X-Inertia')) {
                        return back()->withErrors([
                            'email' => 'Too many login attempts. Please try again later.',
                        ])->withHeaders($headers);
                    }
                    
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again later.',
                        'error_code' => 'AUTH_RATE_LIMIT_EXCEEDED',
                        'timestamp' => now()->toIso8601String(),
                    ], 429, $headers);
                });
        });

        // Payment endpoints - 10 requests per minute
        RateLimiter::for('payment', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    // Check if this is an Inertia request
                    if ($request->header('X-Inertia')) {
                        return back()->withErrors([
                            'payment' => 'Too many payment requests. Please try again later.',
                        ])->withHeaders($headers);
                    }
                    
                    return response()->json([
                        'message' => 'Too many payment requests. Please try again later.',
                        'error_code' => 'PAYMENT_RATE_LIMIT_EXCEEDED',
                        'timestamp' => now()->toIso8601String(),
                    ], 429, $headers);
                });
        });

        // Guest users - 30 requests per minute
        RateLimiter::for('guest', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many requests. Please try again later.',
                        'error_code' => 'RATE_LIMIT_EXCEEDED',
                        'timestamp' => now()->toIso8601String(),
                    ], 429, $headers);
                });
        });

        // Authenticated users - 120 requests per minute
        RateLimiter::for('authenticated', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(120)->by($request->user()->id)
                    ->response(function (Request $request, array $headers) {
                        // Check if this is an Inertia request
                        if ($request->header('X-Inertia')) {
                            return back()->withErrors([
                                'error' => 'Too many requests. Please try again later.',
                            ])->withHeaders($headers);
                        }
                        
                        return response()->json([
                            'message' => 'Too many requests. Please try again later.',
                            'error_code' => 'RATE_LIMIT_EXCEEDED',
                            'timestamp' => now()->toIso8601String(),
                        ], 429, $headers);
                    })
                : Limit::perMinute(30)->by($request->ip())
                    ->response(function (Request $request, array $headers) {
                        // Check if this is an Inertia request
                        if ($request->header('X-Inertia')) {
                            return back()->withErrors([
                                'error' => 'Too many requests. Please try again later.',
                            ])->withHeaders($headers);
                        }
                        
                        return response()->json([
                            'message' => 'Too many requests. Please try again later.',
                            'error_code' => 'RATE_LIMIT_EXCEEDED',
                            'timestamp' => now()->toIso8601String(),
                        ], 429, $headers);
                    });
        });

        // Admin endpoints - Higher limits (300 per minute)
        RateLimiter::for('admin', function (Request $request) {
            return Limit::perMinute(300)->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many requests. Please try again later.',
                        'error_code' => 'RATE_LIMIT_EXCEEDED',
                        'timestamp' => now()->toIso8601String(),
                    ], 429, $headers);
                });
        });

        // Webhook endpoints - 100 requests per minute (for external services)
        RateLimiter::for('webhook', function (Request $request) {
            return Limit::perMinute(100)->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many webhook requests.',
                        'error_code' => 'WEBHOOK_RATE_LIMIT_EXCEEDED',
                        'timestamp' => now()->toIso8601String(),
                    ], 429, $headers);
                });
        });
    }
}
