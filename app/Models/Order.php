<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number',
          'user_id',
        'user_address_id',
        'status',
        'total_amount',
        'subtotal',
        'tax',
        'delivery_fee',
        'delivery_address',
        'shipping_method',
        'tracking_code',
        'label_url',
        'carrier',
        'service',
        'shipping_cost',
        'is_ready_for_delivery',
        'ready_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'is_ready_for_delivery' => 'boolean',
        'ready_at' => 'datetime',
    ];


    /**
     * Get the user that owns the order.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }


    /**
     * Get the user address for the order.
     */
    public function userAddress(): BelongsTo
    {
        return $this->belongsTo(UserAddress::class);
    }

    /**
     * Get the order items for the order.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the status history for the order.
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    /**
     * Get the payment transactions for the order.
     */
    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    /**
     * Generate a unique order number.
     */
    public static function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'ORD-' . date('Ymd') . '-' . str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (self::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }
}
