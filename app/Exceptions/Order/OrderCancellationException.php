<?php

namespace App\Exceptions\Order;

/**
 * Exception thrown when order cancellation fails
 */
class OrderCancellationException extends OrderException
{
    public function __construct(
        string $message = 'Failed to cancel order',
        int $code = 500,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'ORDER_CANCELLATION_FAILED', $context);
    }
}
