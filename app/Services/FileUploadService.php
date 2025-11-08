<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class FileUploadService
{
    /**
     * Allowed image MIME types
     */
    protected array $allowedImageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    /**
     * Maximum file size in bytes (5MB)
     */
    protected int $maxFileSize = 5242880;

    /**
     * Maximum image dimensions
     */
    protected int $maxWidth = 2000;
    protected int $maxHeight = 2000;

    /**
     * Upload and validate an image file
     */
    public function uploadImage(UploadedFile $file, string $directory = 'images'): string
    {
        // Validate file type
        $this->validateImageType($file);

        // Validate file size
        $this->validateFileSize($file);

        // Scan for malware (basic check)
        $this->scanFile($file);

        // Generate unique filename
        $filename = $this->generateFilename($file);

        // Optimize and resize image
        $optimizedImage = $this->optimizeImage($file);

        // Store the file
        $path = Storage::disk('public')->put(
            $directory . '/' . $filename,
            $optimizedImage
        );

        return Storage::disk('public')->url($path);
    }

    /**
     * Validate image MIME type
     */
    protected function validateImageType(UploadedFile $file): void
    {
        if (!in_array($file->getMimeType(), $this->allowedImageTypes)) {
            throw new \InvalidArgumentException(
                'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
            );
        }

        // Additional check: verify file extension matches MIME type
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();

        $validExtensions = [
            'image/jpeg' => ['jpg', 'jpeg'],
            'image/png' => ['png'],
            'image/gif' => ['gif'],
            'image/webp' => ['webp'],
        ];

        if (!isset($validExtensions[$mimeType]) || 
            !in_array($extension, $validExtensions[$mimeType])) {
            throw new \InvalidArgumentException(
                'File extension does not match file type.'
            );
        }
    }

    /**
     * Validate file size
     */
    protected function validateFileSize(UploadedFile $file): void
    {
        if ($file->getSize() > $this->maxFileSize) {
            throw new \InvalidArgumentException(
                'File size exceeds maximum allowed size of 5MB.'
            );
        }
    }

    /**
     * Basic malware scanning
     */
    protected function scanFile(UploadedFile $file): void
    {
        // Check for PHP code in image files
        $content = file_get_contents($file->getRealPath());
        
        $suspiciousPatterns = [
            '/<\?php/i',
            '/<script/i',
            '/eval\(/i',
            '/base64_decode/i',
            '/system\(/i',
            '/exec\(/i',
            '/shell_exec/i',
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                throw new \InvalidArgumentException(
                    'File contains suspicious content and cannot be uploaded.'
                );
            }
        }
    }

    /**
     * Generate a unique filename
     */
    protected function generateFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        return Str::random(40) . '.' . $extension;
    }

    /**
     * Optimize and resize image using Intervention Image
     */
    protected function optimizeImage(UploadedFile $file): string
    {
        try {
            // Create ImageManager with GD driver
            $manager = new ImageManager(new Driver());

            // Read image from file
            $image = $manager->read($file->getRealPath());

            // Get original dimensions
            $width = $image->width();
            $height = $image->height();

            // Resize if image is too large (maintains aspect ratio)
            if ($width > $this->maxWidth || $height > $this->maxHeight) {
                $image->scale(
                    width: $this->maxWidth,
                    height: $this->maxHeight
                );
            }

            // Encode with quality optimization
            $extension = strtolower($file->getClientOriginalExtension());
            $encoded = match ($extension) {
                'jpg', 'jpeg' => $image->toJpeg(quality: 85),
                'png' => $image->toPng(),
                'gif' => $image->toGif(),
                'webp' => $image->toWebp(quality: 85),
                default => $image->toJpeg(quality: 85),
            };

            return (string) $encoded;
        } catch (\Exception $e) {
            // If image optimization fails, return original file content
            return file_get_contents($file->getRealPath());
        }
    }

    /**
     * Delete an uploaded file
     */
    public function deleteFile(string $url): bool
    {
        // Extract path from URL
        $path = str_replace(Storage::disk('public')->url(''), '', $url);
        
        return Storage::disk('public')->delete($path);
    }

    /**
     * Validate multiple files
     */
    public function validateMultipleImages(array $files): void
    {
        if (count($files) > 10) {
            throw new \InvalidArgumentException(
                'You can upload a maximum of 10 images.'
            );
        }

        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $this->validateImageType($file);
                $this->validateFileSize($file);
            }
        }
    }

    /**
     * Create a thumbnail from an uploaded image
     */
    public function createThumbnail(UploadedFile $file, int $width = 300, int $height = 300, string $directory = 'thumbnails'): string
    {
        $this->validateImageType($file);
        $this->validateFileSize($file);

        $manager = new ImageManager(new Driver());
        $image = $manager->read($file->getRealPath());

        // Create thumbnail with cover (crops to fit)
        $image->cover($width, $height);

        $filename = $this->generateFilename($file);
        $encoded = $image->toJpeg(quality: 80);

        $path = Storage::disk('public')->put(
            $directory . '/' . $filename,
            (string) $encoded
        );

        return Storage::disk('public')->url($path);
    }

    /**
     * Add watermark to an image
     */
    public function addWatermark(UploadedFile $file, string $watermarkPath, string $directory = 'images'): string
    {
        $this->validateImageType($file);
        $this->validateFileSize($file);

        $manager = new ImageManager(new Driver());
        $image = $manager->read($file->getRealPath());

        // Resize if needed
        if ($image->width() > $this->maxWidth || $image->height() > $this->maxHeight) {
            $image->scale(width: $this->maxWidth, height: $this->maxHeight);
        }

        // Add watermark in bottom right corner
        if (file_exists($watermarkPath)) {
            $watermark = $manager->read($watermarkPath);
            $watermark->scale(width: 150); // Resize watermark

            $image->place(
                $watermark,
                'bottom-right',
                10,
                10
            );
        }

        $filename = $this->generateFilename($file);
        $encoded = $image->toJpeg(quality: 85);

        $path = Storage::disk('public')->put(
            $directory . '/' . $filename,
            (string) $encoded
        );

        return Storage::disk('public')->url($path);
    }
}
