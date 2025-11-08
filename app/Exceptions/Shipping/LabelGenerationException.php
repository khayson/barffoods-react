<?php

namespace App\Exceptions\Shipping;

/**
 * Exception thrown when shipping label generation fails
 */
class LabelGenerationException extends ShippingException
{
    public function __construct(
        string $message = 'Failed to generate shipping label',
        int $code = 500,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'LABEL_GENERATION_FAILED', $context);
    }
}
