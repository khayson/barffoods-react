<?php

namespace App\Exceptions;

use Exception;

class StaleModelException extends Exception
{
    /**
     * Create a new stale model exception instance.
     */
    public function __construct(string $model, int $expectedVersion, int $currentVersion)
    {
        $message = "The {$model} has been modified by another process. Expected version {$expectedVersion}, but current version is {$currentVersion}.";
        
        parent::__construct($message);
    }
}
