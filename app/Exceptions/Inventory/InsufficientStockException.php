<?php

namespace App\Exceptions\Inventory;

/**
 * Exception thrown when there is insufficient stock for an operation
 */
class InsufficientStockException extends InventoryException
{
    public function __construct(
        string $message = 'Insufficient stock available',
        int $code = 409,
        ?\Exception $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, 'INSUFFICIENT_STOCK', $context);
    }
}
