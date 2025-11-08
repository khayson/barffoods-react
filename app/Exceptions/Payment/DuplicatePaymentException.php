<?php

namespace App\Exceptions\Payment;

/**
 * Exception thrown when a duplicate payment is detected
 */
class DuplicatePaymentException extends PaymentException
{
    public function __construct(
        string $message = 'Duplicate payment detected',
        int $code = 409,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'DUPLICATE_PAYMENT', $context);
    }
}
