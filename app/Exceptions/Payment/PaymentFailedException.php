<?php

namespace App\Exceptions\Payment;

/**
 * Exception thrown when a payment fails
 */
class PaymentFailedException extends PaymentException
{
    public function __construct(
        string $message = 'Payment failed',
        int $code = 402,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'PAYMENT_FAILED', $context);
    }
}
