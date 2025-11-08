<?php

use App\Helpers\LogHelper;
use Illuminate\Support\Facades\Log;

uses(Tests\TestCase::class);

test('LogHelper security method logs to security channel', function () {
    Log::shouldReceive('channel')
        ->once()
        ->with('security')
        ->andReturnSelf();
    
    Log::shouldReceive('warning')
        ->once()
        ->withArgs(function ($message, $context) {
            return $message === 'Test security event' &&
                   isset($context['category']) &&
                   $context['category'] === 'security';
        });

    LogHelper::security('Test security event');
});

test('LogHelper payment method logs to payment channel', function () {
    Log::shouldReceive('channel')
        ->once()
        ->with('payment')
        ->andReturnSelf();
    
    Log::shouldReceive('info')
        ->once()
        ->withArgs(function ($message, $context) {
            return $message === 'Test payment event' &&
                   isset($context['category']) &&
                   $context['category'] === 'payment';
        });

    LogHelper::payment('Test payment event');
});

test('LogHelper shipping method logs to shipping channel', function () {
    Log::shouldReceive('channel')
        ->once()
        ->with('shipping')
        ->andReturnSelf();
    
    Log::shouldReceive('info')
        ->once()
        ->withArgs(function ($message, $context) {
            return $message === 'Test shipping event' &&
                   isset($context['category']) &&
                   $context['category'] === 'shipping';
        });

    LogHelper::shipping('Test shipping event');
});

test('LogHelper performance method logs to performance channel', function () {
    Log::shouldReceive('channel')
        ->once()
        ->with('performance')
        ->andReturnSelf();
    
    Log::shouldReceive('info')
        ->once()
        ->withArgs(function ($message, $context) {
            return $message === 'Test performance event' &&
                   isset($context['category']) &&
                   $context['category'] === 'performance';
        });

    LogHelper::performance('Test performance event');
});

test('LogHelper exception method logs exception details', function () {
    $exception = new \Exception('Test exception', 500);

    Log::shouldReceive('error')
        ->once()
        ->withArgs(function ($message, $context) {
            return str_contains($message, 'Exception occurred') &&
                   isset($context['exception_class']) &&
                   isset($context['exception_message']) &&
                   isset($context['category']) &&
                   $context['category'] === 'exception';
        });

    LogHelper::exception($exception);
});

test('LogHelper critical method logs critical errors', function () {
    Log::shouldReceive('critical')
        ->once()
        ->withArgs(function ($message, $context) {
            return $message === 'Critical error' &&
                   isset($context['category']) &&
                   $context['category'] === 'critical';
        });

    LogHelper::critical('Critical error');
});
