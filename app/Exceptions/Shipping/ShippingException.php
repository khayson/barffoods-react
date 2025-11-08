<?php

namespace App\Exceptions\Shipping;

use App\Exceptions\AppException;

/**
 * Base exception for shipping-related errors
 */
class ShippingException extends AppException
{
    public function __construct(
        string $message = 'Shipping error occurred',
        int $code = 500,
        ?\Exception $previous = null,
        string $errorCode = 'SHIPPING_ERROR',
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, $errorCode, $context);
    }
}
