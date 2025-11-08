<?php

namespace App\Exceptions\Order;

use App\Exceptions\AppException;

/**
 * Base exception for order-related errors
 */
class OrderException extends AppException
{
    public function __construct(
        string $message = 'Order error occurred',
        int $code = 500,
        ?\Exception $previous = null,
        string $errorCode = 'ORDER_ERROR',
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, $errorCode, $context);
    }
}
