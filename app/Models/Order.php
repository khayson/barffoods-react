<?php

namespace App\Models;

use App\Traits\HasOptimisticLocking;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasOptimisticLocking;
    
    protected $fillable = [
        'user_address_id',
        'delivery_address',
        'shipping_method',
        'shipping_preference',
    ];

    /**
     * The attributes that should be guarded from mass assignment.
     * Critical fields that should only be set programmatically.
     *
     * @var list<string>
     */
    protected $guarded = [
        'id',
        'order_number',
        'user_id',
        'status',
        'total_amount',
        'subtotal',
        'tax',
        'delivery_fee',
        'tracking_code',
        'label_url',
        'carrier',
        'service',
        'shipping_cost',
        'rate_id',
        'shipment_id',
        'tracker_id',
        'estimated_delivery_date',
        'delivery_status',
        'last_tracking_update',
        'is_ready_for_delivery',
        'ready_at',
        'additional_shipping_cost',
        'version',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'additional_shipping_cost' => 'decimal:2',
        'is_ready_for_delivery' => 'boolean',
        'ready_at' => 'datetime',
        'last_tracking_update' => 'datetime',
        'estimated_delivery_date' => 'datetime',
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
     * Get the shipment tracking events for the order.
     */
    public function trackingEvents(): HasMany
    {
        return $this->hasMany(ShipmentTrackingEvent::class)->orderBy('occurred_at', 'desc');
    }


    /**
     * Get the latest tracking event
     */
    public function latestTrackingEvent()
    {
        return $this->hasOne(ShipmentTrackingEvent::class)->latestOfMany('occurred_at');
    }

    /**
     * Check if order has tracking information
     */
    public function hasTracking(): bool
    {
        return !empty($this->tracking_code);
    }

    /**
     * Check if order is delivered based on tracking
     */
    public function isDelivered(): bool
    {
        return $this->delivery_status === 'delivered';
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
