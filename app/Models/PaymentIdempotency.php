<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class PaymentIdempotency extends Model
{
    protected $fillable = [
        'idempotency_key',
        'user_id',
        'order_id',
        'payment_intent_id',
        'status',
        'request_data',
        'response_data',
        'expires_at',
    ];

    protected $casts = [
        'request_data' => 'array',
        'response_data' => 'array',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Check if idempotency key exists and is still valid
     */
    public static function check(string $key): ?self
    {
        return self::where('idempotency_key', $key)
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Create or retrieve idempotency record
     */
    public static function createOrRetrieve(string $key, int $userId, array $requestData): self
    {
        $existing = self::check($key);

        if ($existing) {
            return $existing;
        }

        return self::create([
            'idempotency_key' => $key,
            'user_id' => $userId,
            'status' => 'pending',
            'request_data' => $requestData,
            'expires_at' => Carbon::now()->addHours(24),
        ]);
    }

    /**
     * Mark as completed with response data
     */
    public function markCompleted(array $responseData, string $paymentIntentId = null): void
    {
        $this->update([
            'status' => 'completed',
            'response_data' => $responseData,
            'payment_intent_id' => $paymentIntentId,
        ]);
    }

    /**
     * Mark as failed
     */
    public function markFailed(array $errorData): void
    {
        $this->update([
            'status' => 'failed',
            'response_data' => $errorData,
        ]);
    }

    /**
     * Check if the record is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Clean up expired idempotency records
     */
    public static function cleanup(): int
    {
        return self::where('expires_at', '<', now())->delete();
    }
}

