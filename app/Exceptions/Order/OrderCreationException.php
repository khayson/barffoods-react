<?php

namespace App\Exceptions\Order;

/**
 * Exception thrown when order creation fails
 */
class OrderCreationException extends OrderException
{
    public function __construct(
        string $message = 'Failed to create order',
        int $code = 500,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'ORDER_CREATION_FAILED', $context);
    }
}
