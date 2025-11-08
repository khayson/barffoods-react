<?php

namespace App\Exceptions\Order;

/**
 * Exception thrown when an operation is attempted on an order in an invalid state
 */
class InvalidOrderStateException extends OrderException
{
    public function __construct(
        string $message = 'Invalid order state for this operation',
        int $code = 409,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'INVALID_ORDER_STATE', $context);
    }
}
