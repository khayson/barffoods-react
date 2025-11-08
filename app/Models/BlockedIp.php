<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class BlockedIp extends Model
{
    protected $fillable = [
        'ip_address',
        'reason',
        'details',
        'violation_count',
        'blocked_at',
        'expires_at',
        'is_permanent',
    ];

    protected $casts = [
        'blocked_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_permanent' => 'boolean',
    ];

    /**
     * Check if an IP is blocked
     */
    public static function isBlocked(string $ipAddress): bool
    {
        $blocked = self::where('ip_address', $ipAddress)
            ->where(function ($query) {
                $query->where('is_permanent', true)
                    ->orWhere('expires_at', '>', Carbon::now());
            })
            ->first();

        return $blocked !== null;
    }

    /**
     * Block an IP address
     */
    public static function blockIp(
        string $ipAddress,
        string $reason,
        ?string $details = null,
        ?int $durationHours = 24,
        bool $isPermanent = false
    ): self {
        $existing = self::where('ip_address', $ipAddress)->first();

        if ($existing) {
            $existing->increment('violation_count');
            $existing->update([
                'reason' => $reason,
                'details' => $details,
                'blocked_at' => Carbon::now(),
                'expires_at' => $isPermanent ? null : Carbon::now()->addHours($durationHours),
                'is_permanent' => $isPermanent,
            ]);
            
            return $existing;
        }

        return self::create([
            'ip_address' => $ipAddress,
            'reason' => $reason,
            'details' => $details,
            'violation_count' => 1,
            'blocked_at' => Carbon::now(),
            'expires_at' => $isPermanent ? null : Carbon::now()->addHours($durationHours),
            'is_permanent' => $isPermanent,
        ]);
    }

    /**
     * Unblock an IP address
     */
    public static function unblockIp(string $ipAddress): bool
    {
        return self::where('ip_address', $ipAddress)->delete() > 0;
    }

    /**
     * Clean up expired blocks
     */
    public static function cleanup(): int
    {
        return self::where('is_permanent', false)
            ->where('expires_at', '<', Carbon::now())
            ->delete();
    }

    /**
     * Get block reason
     */
    public function getBlockReason(): string
    {
        if ($this->is_permanent) {
            return "Permanently blocked: {$this->reason}";
        }

        $expiresIn = $this->expires_at->diffForHumans();
        return "Temporarily blocked: {$this->reason}. Expires {$expiresIn}.";
    }
}
