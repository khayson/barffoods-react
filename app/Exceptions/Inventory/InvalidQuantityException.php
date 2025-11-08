<?php

namespace App\Exceptions\Inventory;

/**
 * Exception thrown when an invalid quantity is provided
 */
class InvalidQuantityException extends InventoryException
{
    public function __construct(
        string $message = 'Invalid quantity provided',
        int $code = 400,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'INVALID_QUANTITY', $context);
    }
}
