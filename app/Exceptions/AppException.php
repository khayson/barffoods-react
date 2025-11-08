<?php

namespace App\Exceptions;

use Exception;

/**
 * Base custom exception for the application
 */
class AppException extends Exception
{
    protected string $errorCode;
    protected array $context = [];

    public function __construct(
        string $message = '',
        int $code = 0,
        ?Exception $previous = null,
        string $errorCode = 'APP_ERROR',
        array $context = []
    ) {
        parent::__construct($message, $code, $previous);
        $this->errorCode = $errorCode;
        $this->context = $context;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getContext(): array
    {
        return $this->context;
    }

    public function setContext(array $context): self
    {
        $this->context = $context;
        return $this;
    }
}
