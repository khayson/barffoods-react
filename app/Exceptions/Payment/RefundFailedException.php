<?php

namespace App\Exceptions\Payment;

/**
 * Exception thrown when a refund fails
 */
class RefundFailedException extends PaymentException
{
    public function __construct(
        string $message = 'Refund processing failed',
        int $code = 500,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'REFUND_FAILED', $context);
    }
}
