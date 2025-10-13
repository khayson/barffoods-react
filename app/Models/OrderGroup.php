<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderGroup extends Model
{
    protected $fillable = [
        'group_number',
        'user_id',
        'user_address_id',
        'status',
        'total_amount',
        'delivery_preference',
        'delivery_address',
        'delivery_fee',
        'delivery_time_estimate',
        'tracking_code',
        'label_url',
        'carrier',
        'service',
        'shipping_cost',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'delivery_time_estimate' => 'integer',
        'shipping_cost' => 'decimal:2',
    ];

    /**
     * Get the user that owns the order group.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user address for the order group.
     */
    public function userAddress(): BelongsTo
    {
        return $this->belongsTo(UserAddress::class);
    }

    /**
     * Get the orders for the order group.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Generate a unique order group number.
     */
    public static function generateGroupNumber(): string
    {
        do {
            $groupNumber = 'GRP-' . date('Ymd') . '-' . str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (self::where('group_number', $groupNumber)->exists());

        return $groupNumber;
    }

    /**
     * Get the overall status of the order group.
     */
    public function getOverallStatus(): string
    {
        $orders = $this->orders;
        
        if ($orders->isEmpty()) {
            return 'pending';
        }

        // If any order is cancelled, group is cancelled
        if ($orders->contains('status', 'cancelled')) {
            return 'cancelled';
        }

        // If all orders are delivered, group is delivered
        if ($orders->every('status', 'delivered')) {
            return 'delivered';
        }

        // If any order is preparing, group is processing
        if ($orders->contains('status', 'preparing')) {
            return 'processing';
        }

        // If all orders are confirmed, group is confirmed
        if ($orders->every('status', 'confirmed')) {
            return 'confirmed';
        }

        return 'pending';
    }
}
