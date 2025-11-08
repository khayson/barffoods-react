<?php

namespace App\Console\Commands;

use App\Models\PaymentIdempotency;
use App\Models\User;
use App\Services\NotificationService;
use App\Helpers\LogHelper;
use Illuminate\Console\Command;
use Carbon\Carbon;

class CheckPaymentTimeouts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:check-timeouts {--timeout=15 : Timeout in minutes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for payment operations that have timed out and notify users';

    protected NotificationService $notificationService;

    /**
     * Create a new command instance.
     */
    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $timeoutMinutes = (int) $this->option('timeout');
        $timeoutThreshold = Carbon::now()->subMinutes($timeoutMinutes);

        $this->info("Checking for payment timeouts (older than {$timeoutMinutes} minutes)...");

        // Find pending payments that have timed out
        $timedOutPayments = PaymentIdempotency::where('status', 'pending')
            ->where('created_at', '<', $timeoutThreshold)
            ->where('expires_at', '>', Carbon::now()) // Not yet expired
            ->get();

        if ($timedOutPayments->isEmpty()) {
            $this->info('No timed out payments found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$timedOutPayments->count()} timed out payment(s).");

        $notifiedCount = 0;
        $failedCount = 0;

        foreach ($timedOutPayments as $payment) {
            try {
                // Mark as failed
                $payment->markFailed([
                    'error' => 'Payment processing timeout',
                    'timeout_minutes' => $timeoutMinutes,
                    'timed_out_at' => Carbon::now()->toDateTimeString(),
                ]);

                // Notify user if user_id exists
                if ($payment->user_id) {
                    $user = User::find($payment->user_id);
                    
                    if ($user) {
                        $this->notificationService->sendPaymentTimeoutNotification($user, $payment);
                        $notifiedCount++;
                        
                        $this->line("✓ Notified user #{$user->id} about payment timeout");
                    }
                }

                LogHelper::payment('Payment timeout detected and handled', [
                    'idempotency_key' => $payment->idempotency_key,
                    'user_id' => $payment->user_id,
                    'timeout_minutes' => $timeoutMinutes,
                ], 'warning');

            } catch (\Exception $e) {
                $failedCount++;
                $this->error("✗ Failed to process timeout for payment #{$payment->id}: {$e->getMessage()}");
                
                LogHelper::exception($e, [
                    'context' => 'payment_timeout_check',
                    'payment_id' => $payment->id,
                ]);
            }
        }

        $this->info("\nSummary:");
        $this->info("- Total timed out: {$timedOutPayments->count()}");
        $this->info("- Users notified: {$notifiedCount}");
        
        if ($failedCount > 0) {
            $this->warn("- Failed to process: {$failedCount}");
        }

        return Command::SUCCESS;
    }
}
