<?php

namespace App\Exceptions\Payment;

use App\Exceptions\AppException;

/**
 * Base exception for payment-related errors
 */
class PaymentException extends AppException
{
    public function __construct(
        string $message = 'Payment processing error occurred',
        int $code = 500,
        ?\Exception $previous = null,
        string $errorCode = 'PAYMENT_ERROR',
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, $errorCode, $context);
    }
}
