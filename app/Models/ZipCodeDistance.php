<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZipCodeDistance extends Model
{
    protected $fillable = [
        'from_zip',
        'to_zip',
        'distance_miles',
    ];

    protected $casts = [
        'distance_miles' => 'decimal:2',
    ];

    /**
     * Get distance between two US ZIP codes (checks both directions)
     * Returns distance in miles
     */
    public static function getDistance(string $fromZip, string $toZip): ?float
    {
        // Clean ZIP codes (extract only digits, get first 5)
        $fromZip = substr(preg_replace('/[^0-9]/', '', $fromZip), 0, 5);
        $toZip = substr(preg_replace('/[^0-9]/', '', $toZip), 0, 5);

        // Validate ZIP codes
        if (strlen($fromZip) !== 5 || strlen($toZip) !== 5) {
            return null;
        }

        // Same ZIP code = 0 miles
        if ($fromZip === $toZip) {
            return 0.0;
        }

        // Try to find cached distance (check both directions)
        $distance = self::where(function($query) use ($fromZip, $toZip) {
            $query->where('from_zip', $fromZip)->where('to_zip', $toZip);
        })->orWhere(function($query) use ($fromZip, $toZip) {
            $query->where('from_zip', $toZip)->where('to_zip', $fromZip);
        })->first();

        return $distance ? (float) $distance->distance_miles : null;
    }

    /**
     * Calculate and cache distance between two US ZIP codes
     */
    public static function calculateAndCache(string $fromZip, string $toZip): ?float
    {
        // Clean ZIP codes
        $fromZip = substr(preg_replace('/[^0-9]/', '', $fromZip), 0, 5);
        $toZip = substr(preg_replace('/[^0-9]/', '', $toZip), 0, 5);

        // Validate ZIP codes
        if (strlen($fromZip) !== 5 || strlen($toZip) !== 5) {
            return null;
        }

        // Get ZIP code coordinates
        $fromZipData = ZipCode::where('zip_code', $fromZip)->first();
        $toZipData = ZipCode::where('zip_code', $toZip)->first();

        if (!$fromZipData || !$toZipData) {
            return null;
        }

        // Calculate distance in miles
        $distance = $fromZipData->distanceTo($toZipData);

        if ($distance !== null) {
            // Cache the result
            self::updateOrCreate(
                ['from_zip' => $fromZip, 'to_zip' => $toZip],
                ['distance_miles' => $distance]
            );
        }

        return $distance;
    }
}
