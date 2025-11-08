<?php

namespace App\Console\Commands;

use App\Models\BlockedIp;
use App\Models\LoginAttempt;
use App\Helpers\LogHelper;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DetectAbusePatterns extends Command
{
    protected $signature = 'security:detect-abuse {--dry-run : Show what would be blocked without actually blocking}';
    protected $description = 'Detect and block IPs showing abuse patterns';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->info('Running in DRY RUN mode - no IPs will be blocked');
        }

        $this->info('Detecting abuse patterns...');

        $blockedCount = 0;

        // Pattern 1: Multiple failed login attempts
        $blockedCount += $this->detectFailedLoginAbuse($isDryRun);

        // Pattern 2: Rapid requests (rate limit violations)
        $blockedCount += $this->detectRateLimitAbuse($isDryRun);

        // Pattern 3: Multiple payment failures
        $blockedCount += $this->detectPaymentAbuse($isDryRun);

        $this->info("\nSummary:");
        $this->info("- IPs " . ($isDryRun ? 'that would be blocked' : 'blocked') . ": {$blockedCount}");

        // Clean up expired blocks
        if (!$isDryRun) {
            $cleaned = BlockedIp::cleanup();
            $this->info("- Expired blocks cleaned up: {$cleaned}");
        }

        return Command::SUCCESS;
    }

    /**
     * Detect IPs with excessive failed login attempts
     */
    protected function detectFailedLoginAbuse(bool $isDryRun): int
    {
        $threshold = 10; // 10 failed attempts in 1 hour
        $timeWindow = Carbon::now()->subHour();

        $suspiciousIps = LoginAttempt::select('ip_address', DB::raw('COUNT(*) as attempt_count'))
            ->where('successful', false)
            ->where('attempted_at', '>=', $timeWindow)
            ->groupBy('ip_address')
            ->having('attempt_count', '>=', $threshold)
            ->get();

        $blocked = 0;

        foreach ($suspiciousIps as $record) {
            // Skip if already blocked
            if (BlockedIp::isBlocked($record->ip_address)) {
                continue;
            }

            $this->warn("⚠ Failed login abuse detected: {$record->ip_address} ({$record->attempt_count} attempts)");

            if (!$isDryRun) {
                BlockedIp::blockIp(
                    $record->ip_address,
                    'Excessive failed login attempts',
                    "Failed {$record->attempt_count} login attempts in 1 hour",
                    24, // Block for 24 hours
                    false
                );

                LogHelper::security('IP blocked for failed login abuse', [
                    'ip_address' => $record->ip_address,
                    'attempt_count' => $record->attempt_count,
                ], 'warning');
            }

            $blocked++;
        }

        return $blocked;
    }

    /**
     * Detect IPs with excessive rate limit violations
     */
    protected function detectRateLimitAbuse(bool $isDryRun): int
    {
        // This would require tracking rate limit hits in a separate table
        // For now, we'll return 0 as a placeholder
        return 0;
    }

    /**
     * Detect IPs with multiple payment failures
     */
    protected function detectPaymentAbuse(bool $isDryRun): int
    {
        $threshold = 5; // 5 failed payments in 1 hour
        $timeWindow = Carbon::now()->subHour();

        $suspiciousIps = DB::table('payment_transactions')
            ->select('ip_address', DB::raw('COUNT(*) as failure_count'))
            ->where('status', 'failed')
            ->where('created_at', '>=', $timeWindow)
            ->whereNotNull('ip_address')
            ->groupBy('ip_address')
            ->having('failure_count', '>=', $threshold)
            ->get();

        $blocked = 0;

        foreach ($suspiciousIps as $record) {
            // Skip if already blocked
            if (BlockedIp::isBlocked($record->ip_address)) {
                continue;
            }

            $this->warn("⚠ Payment abuse detected: {$record->ip_address} ({$record->failure_count} failures)");

            if (!$isDryRun) {
                BlockedIp::blockIp(
                    $record->ip_address,
                    'Excessive payment failures',
                    "Failed {$record->failure_count} payment attempts in 1 hour",
                    48, // Block for 48 hours
                    false
                );

                LogHelper::security('IP blocked for payment abuse', [
                    'ip_address' => $record->ip_address,
                    'failure_count' => $record->failure_count,
                ], 'warning');
            }

            $blocked++;
        }

        return $blocked;
    }
}
