<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Fields that should not be sanitized (e.g., passwords, encrypted data)
     */
    protected array $except = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'token',
        'secret',
        '_token',
    ];

    /**
     * Fields that allow limited HTML (rich text fields)
     */
    protected array $allowHtml = [
        'description',
        'notes',
        'delivery_instructions',
        'content',
        'message',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        
        $sanitized = $this->sanitizeArray($input);
        
        $request->merge($sanitized);

        return $next($request);
    }

    /**
     * Recursively sanitize an array of data
     */
    protected function sanitizeArray(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            // Skip fields that should not be sanitized
            if (in_array($key, $this->except)) {
                $sanitized[$key] = $value;
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value);
            } elseif (is_string($value)) {
                // Check if this field allows HTML
                $allowHtml = in_array($key, $this->allowHtml);
                $sanitized[$key] = $this->sanitizeString($value, $allowHtml);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize a string value
     */
    protected function sanitizeString(string $value, bool $allowHtml = false): string
    {
        // Trim whitespace
        $value = trim($value);
        
        if ($allowHtml) {
            // Allow limited safe HTML tags for rich text fields
            $allowedTags = '<p><br><strong><em><u><a><ul><ol><li><h1><h2><h3><h4><h5><h6>';
            $value = strip_tags($value, $allowedTags);
            
            // Remove dangerous attributes from allowed tags
            $value = preg_replace('/<([a-z][a-z0-9]*)[^>]*?(on\w+\s*=)[^>]*?>/i', '<$1>', $value);
            $value = preg_replace('/<([a-z][a-z0-9]*)[^>]*?(javascript:)[^>]*?>/i', '<$1>', $value);
        } else {
            // Strip all tags to prevent XSS
            $value = strip_tags($value);
            
            // Convert special characters to HTML entities
            $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
        }
        
        return $value;
    }
}
