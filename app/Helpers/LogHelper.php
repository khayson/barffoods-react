<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

/**
 * Helper class for structured logging
 */
class LogHelper
{
    /**
     * Log a security event
     */
    public static function security(string $message, array $context = [], string $level = 'warning'): void
    {
        $enrichedContext = self::enrichContext($context, 'security');
        Log::channel('security')->{$level}($message, $enrichedContext);
    }

    /**
     * Log a payment event
     */
    public static function payment(string $message, array $context = [], string $level = 'info'): void
    {
        $enrichedContext = self::enrichContext($context, 'payment');
        Log::channel('payment')->{$level}($message, $enrichedContext);
    }

    /**
     * Log a shipping event
     */
    public static function shipping(string $message, array $context = [], string $level = 'info'): void
    {
        $enrichedContext = self::enrichContext($context, 'shipping');
        Log::channel('shipping')->{$level}($message, $enrichedContext);
    }

    /**
     * Log a performance event
     */
    public static function performance(string $message, array $context = [], string $level = 'info'): void
    {
        $enrichedContext = self::enrichContext($context, 'performance');
        Log::channel('performance')->{$level}($message, $enrichedContext);
    }

    /**
     * Log an audit event
     */
    public static function audit(string $action, string $resource, array $context = []): void
    {
        $enrichedContext = self::enrichContext(array_merge($context, [
            'action' => $action,
            'resource' => $resource,
        ]), 'audit');
        
        Log::channel('security')->info('Audit: ' . $action, $enrichedContext);
    }

    /**
     * Enrich context with common data
     */
    private static function enrichContext(array $context, string $category): array
    {
        $enriched = [
            'category' => $category,
            'timestamp' => now()->toIso8601String(),
            'environment' => config('app.env'),
        ];

        // Add user information if authenticated
        if (Auth::check()) {
            $user = Auth::user();
            $enriched['user_id'] = $user->id;
            $enriched['user_email'] = $user->email;
            $enriched['user_role'] = $user->role;
        }

        // Add request information if available
        if (app()->bound('request')) {
            $request = request();
            $enriched['ip_address'] = $request->ip();
            $enriched['user_agent'] = $request->userAgent();
            $enriched['url'] = $request->fullUrl();
            $enriched['method'] = $request->method();
        }

        return array_merge($enriched, $context);
    }

    /**
     * Log an exception with full context
     */
    public static function exception(\Throwable $exception, array $additionalContext = []): void
    {
        $context = self::enrichContext([
            'exception_class' => get_class($exception),
            'exception_message' => $exception->getMessage(),
            'exception_code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
        ], 'exception');

        $context = array_merge($context, $additionalContext);

        Log::error('Exception occurred: ' . $exception->getMessage(), $context);
    }

    /**
     * Log a critical error that requires immediate attention
     */
    public static function critical(string $message, array $context = []): void
    {
        $enrichedContext = self::enrichContext($context, 'critical');
        Log::critical($message, $enrichedContext);
        
        // Send notification to admins if configured
        if (config('logging.notify_on_critical', false)) {
            // This will be implemented when notification service is ready
            // NotificationService::notifyAdmins($message, $enrichedContext);
        }
    }
}
