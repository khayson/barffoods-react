<?php

namespace App\Exceptions\Inventory;

use App\Exceptions\AppException;

/**
 * Base exception for inventory-related errors
 */
class InventoryException extends AppException
{
    public function __construct(
        string $message = 'Inventory error occurred',
        int $code = 500,
        ?\Exception $previous = null,
        string $errorCode = 'INVENTORY_ERROR',
        array $context = []
    ) {
        parent::__construct($message, $code, $previous, $errorCode, $context);
    }
}
