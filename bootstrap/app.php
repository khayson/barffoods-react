<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsCustomer;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\MigrateAnonymousCart;
use App\Http\Middleware\SanitizeInput;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            \App\Http\Middleware\EnforceHttps::class,
            \App\Http\Middleware\SecurityHeaders::class,
            SanitizeInput::class,
            HandleAppearance::class,
            MigrateAnonymousCart::class, // Migrate anonymous cart after authentication
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\AddRateLimitHeaders::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\AddRateLimitHeaders::class,
        ]);

        // Register role-based middleware
        $middleware->alias([
            'role' => CheckRole::class,
            'admin' => EnsureUserIsAdmin::class,
            'customer' => EnsureUserIsCustomer::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Exception handling is configured in app/Exceptions/Handler.php
    })->create();
