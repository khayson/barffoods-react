<?php

namespace App\Exceptions\Shipping;

/**
 * Exception thrown when tracking operations fail
 */
class TrackingException extends ShippingException
{
    public function __construct(
        string $message = 'Tracking operation failed',
        int $code = 500,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'TRACKING_FAILED', $context);
    }
}
