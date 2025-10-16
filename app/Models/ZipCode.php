<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZipCode extends Model
{
    protected $fillable = [
        'zip_code',
        'city',
        'state',
        'county',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    /**
     * Calculate distance to another ZIP code using Haversine formula
     * Returns distance in miles
     */
    public function distanceTo(ZipCode $otherZip): ?float
    {
        if (!$this->latitude || !$this->longitude || !$otherZip->latitude || !$otherZip->longitude) {
            return null;
        }

        $earthRadiusMiles = 3959; // Earth's radius in miles
        
        $dLat = deg2rad($otherZip->latitude - $this->latitude);
        $dLng = deg2rad($otherZip->longitude - $this->longitude);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($this->latitude)) * cos(deg2rad($otherZip->latitude)) *
             sin($dLng/2) * sin($dLng/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return round($earthRadiusMiles * $c, 2);
    }
}
