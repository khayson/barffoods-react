<?php

use App\Exceptions\AppException;
use App\Exceptions\Payment\PaymentFailedException;
use App\Exceptions\Shipping\RateCalculationException;
use App\Exceptions\Inventory\InsufficientStockException;
use App\Exceptions\Order\OrderCreationException;

test('AppException can be created with error code and context', function () {
    $exception = new AppException(
        'Test error message',
        500,
        null,
        'TEST_ERROR',
        ['key' => 'value']
    );

    expect($exception->getMessage())->toBe('Test error message');
    expect($exception->getCode())->toBe(500);
    expect($exception->getErrorCode())->toBe('TEST_ERROR');
    expect($exception->getContext())->toBe(['key' => 'value']);
});

test('PaymentFailedException has correct defaults', function () {
    $exception = new PaymentFailedException();

    expect($exception->getMessage())->toBe('Payment failed');
    expect($exception->getCode())->toBe(402);
    expect($exception->getErrorCode())->toBe('PAYMENT_FAILED');
});

test('RateCalculationException has correct defaults', function () {
    $exception = new RateCalculationException();

    expect($exception->getMessage())->toBe('Failed to calculate shipping rates');
    expect($exception->getCode())->toBe(500);
    expect($exception->getErrorCode())->toBe('RATE_CALCULATION_FAILED');
});

test('InsufficientStockException has correct defaults', function () {
    $exception = new InsufficientStockException();

    expect($exception->getMessage())->toBe('Insufficient stock available');
    expect($exception->getCode())->toBe(409);
    expect($exception->getErrorCode())->toBe('INSUFFICIENT_STOCK');
});

test('OrderCreationException has correct defaults', function () {
    $exception = new OrderCreationException();

    expect($exception->getMessage())->toBe('Failed to create order');
    expect($exception->getCode())->toBe(500);
    expect($exception->getErrorCode())->toBe('ORDER_CREATION_FAILED');
});

test('exception context can be set after creation', function () {
    $exception = new AppException('Test');
    $exception->setContext(['user_id' => 123]);

    expect($exception->getContext())->toBe(['user_id' => 123]);
});
