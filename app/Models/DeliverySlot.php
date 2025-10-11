<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliverySlot extends Model
{
    protected $fillable = [
        'store_id',
        'day_of_week',
        'start_time',
        'end_time',
        'max_orders',
        'current_orders',
        'is_active',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'max_orders' => 'integer',
        'current_orders' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the store that owns the delivery slot.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Scope for active slots.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for available slots (not at capacity).
     */
    public function scopeAvailable($query)
    {
        return $query->whereColumn('current_orders', '<', 'max_orders');
    }
}
