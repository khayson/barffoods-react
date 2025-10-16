<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShipmentTrackingEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'tracking_code',
        'status',
        'message',
        'location',
        'carrier',
        'carrier_status_code',
        'carrier_status_detail',
        'occurred_at',
        'source',
        'raw_data',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'raw_data' => 'array',
    ];

    /**
     * Get the order that owns the tracking event
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Scope to get events for a specific tracking code
     */
    public function scopeForTrackingCode($query, string $trackingCode)
    {
        return $query->where('tracking_code', $trackingCode);
    }

    /**
     * Scope to get events by status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get latest events first
     */
    public function scopeLatestFirst($query)
    {
        return $query->orderBy('occurred_at', 'desc');
    }

    /**
     * Check if this is a delivery event
     */
    public function isDelivered(): bool
    {
        return in_array($this->status, ['delivered', 'available_for_pickup']);
    }

    /**
     * Check if this is a failure event
     */
    public function isFailure(): bool
    {
        return in_array($this->status, ['failure', 'returned', 'error', 'cancelled']);
    }

    /**
     * Get human-readable status
     */
    public function getStatusLabelAttribute(): string
    {
        $labels = [
            'pre_transit' => 'Label Created',
            'in_transit' => 'In Transit',
            'out_for_delivery' => 'Out for Delivery',
            'delivered' => 'Delivered',
            'available_for_pickup' => 'Available for Pickup',
            'return_to_sender' => 'Return to Sender',
            'failure' => 'Delivery Failed',
            'cancelled' => 'Cancelled',
            'error' => 'Tracking Error',
            'unknown' => 'Status Unknown',
        ];

        return $labels[$this->status] ?? ucwords(str_replace('_', ' ', $this->status));
    }
}
