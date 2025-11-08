<?php

namespace App\Exceptions\Shipping;

/**
 * Exception thrown when shipping rate calculation fails
 */
class RateCalculationException extends ShippingException
{
    public function __construct(
        string $message = 'Failed to calculate shipping rates',
        int $code = 500,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'RATE_CALCULATION_FAILED', $context);
    }
}
