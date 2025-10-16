<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\TrackingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncOrderTrackingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300; // 5 minutes

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(TrackingService $trackingService): void
    {
        Log::info('Starting scheduled tracking sync');

        try {
            // Get all orders with tracking codes that are not yet delivered
            $orders = Order::whereNotNull('tracking_code')
                ->whereNotIn('delivery_status', ['delivered', 'returned', 'failure'])
                ->where(function ($query) {
                    // Only sync orders that haven't been updated in the last 6 hours
                    $query->whereNull('last_tracking_update')
                        ->orWhere('last_tracking_update', '<', now()->subHours(6));
                })
                ->get();

            Log::info('Found orders to sync', ['count' => $orders->count()]);

            $successCount = 0;
            $failureCount = 0;

            foreach ($orders as $order) {
                try {
                    $result = $trackingService->refreshTracking($order);

                    if ($result['success']) {
                        $successCount++;
                    } else {
                        $failureCount++;
                        Log::warning('Failed to sync tracking for order', [
                            'order_id' => $order->id,
                            'tracking_code' => $order->tracking_code,
                            'message' => $result['message'] ?? 'Unknown error',
                        ]);
                    }

                    // Small delay to avoid rate limiting
                    usleep(100000); // 0.1 seconds

                } catch (\Exception $e) {
                    $failureCount++;
                    Log::error('Exception while syncing tracking for order', [
                        'order_id' => $order->id,
                        'tracking_code' => $order->tracking_code,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Tracking sync completed', [
                'total' => $orders->count(),
                'success' => $successCount,
                'failures' => $failureCount,
            ]);

        } catch (\Exception $e) {
            Log::error('Tracking sync job failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e; // Re-throw to mark job as failed
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Tracking sync job permanently failed', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
