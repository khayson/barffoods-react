<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Store extends Model
{
    protected $fillable = [
        'name',
        'image',
        'address',
        'phone',
        'latitude',
        'longitude',
        'delivery_radius',
        'min_order_amount',
        'delivery_fee',
        'is_active',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'delivery_radius' => 'integer',
        'min_order_amount' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get the products for the store.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the orders for the store.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get the delivery slots for the store.
     */
    public function deliverySlots(): HasMany
    {
        return $this->hasMany(DeliverySlot::class);
    }

    /**
     * Scope for active stores.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
