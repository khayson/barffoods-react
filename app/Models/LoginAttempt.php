<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class LoginAttempt extends Model
{
    protected $fillable = [
        'email',
        'ip_address',
        'successful',
        'user_agent',
        'attempted_at',
    ];

    protected $casts = [
        'successful' => 'boolean',
        'attempted_at' => 'datetime',
    ];

    /**
     * Record a login attempt
     */
    public static function record(string $email, string $ipAddress, bool $successful, ?string $userAgent = null): self
    {
        return self::create([
            'email' => $email,
            'ip_address' => $ipAddress,
            'successful' => $successful,
            'user_agent' => $userAgent,
            'attempted_at' => now(),
        ]);
    }

    /**
     * Get failed attempts for an email/IP combination within a time window
     */
    public static function getRecentFailedAttempts(string $email, string $ipAddress, int $minutes = 15): int
    {
        return self::where('email', $email)
            ->where('ip_address', $ipAddress)
            ->where('successful', false)
            ->where('attempted_at', '>=', Carbon::now()->subMinutes($minutes))
            ->count();
    }

    /**
     * Check if account is locked
     */
    public static function isLocked(string $email, string $ipAddress, int $maxAttempts = 5, int $lockoutMinutes = 15): bool
    {
        $failedAttempts = self::getRecentFailedAttempts($email, $ipAddress, $lockoutMinutes);
        return $failedAttempts >= $maxAttempts;
    }

    /**
     * Clear failed attempts for an email/IP combination
     */
    public static function clearAttempts(string $email, string $ipAddress): void
    {
        self::where('email', $email)
            ->where('ip_address', $ipAddress)
            ->where('successful', false)
            ->delete();
    }

    /**
     * Clean up old login attempts (older than 30 days)
     */
    public static function cleanup(): int
    {
        return self::where('attempted_at', '<', Carbon::now()->subDays(30))->delete();
    }
}
