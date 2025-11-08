<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\ShippingService;
use App\Services\NotificationService;
use App\Helpers\LogHelper;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RetryShippingLabelJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public $tries = 3;
    public $backoff = [300, 900, 3600]; // 5 min, 15 min, 1 hour

    protected $orderId;
    protected $rateId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $orderId, string $rateId)
    {
        $this->orderId = $orderId;
        $this->rateId = $rateId;
    }

    /**
     * Execute the job.
     */
    public function handle(ShippingService $shippingService, NotificationService $notificationService): void
    {
        $order = Order::find($this->orderId);

        if (!$order) {
            LogHelper::shipping('Retry shipping label job failed: Order not found', [
                'order_id' => $this->orderId,
            ], 'error');
            return;
        }

        // Check if label was already created
        if ($order->tracking_code) {
            LogHelper::shipping('Shipping label already exists, skipping retry', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'tracking_code' => $order->tracking_code,
            ], 'info');
            return;
        }

        try {
            LogHelper::shipping('Retrying shipping label creation', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'rate_id' => $this->rateId,
                'attempt' => $this->attempts(),
            ], 'info');

            // Attempt to create shipping label
            $result = $shippingService->createShippingLabel($order, $this->rateId);

            if ($result['success']) {
                LogHelper::shipping('Shipping label created successfully on retry', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'tracking_code' => $result['tracking_code'] ?? 'unknown',
                    'attempt' => $this->attempts(),
                ], 'info');

                // Notify customer that label was created
                if ($order->user) {
                    $notificationService->sendOrderShippedNotification($order->user, $order);
                }
            } else {
                throw new \Exception($result['error'] ?? 'Label creation failed');
            }

        } catch (\Exception $e) {
            LogHelper::exception($e, [
                'context' => 'retry_shipping_label',
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'attempt' => $this->attempts(),
            ]);

            // If this is the last attempt, notify admin
            if ($this->attempts() >= $this->tries) {
                $this->notifyAdminOfFailure($order, $e->getMessage(), $notificationService);
            }

            // Re-throw to trigger retry
            throw $e;
        }
    }

    /**
     * Notify admin of shipping label failure
     */
    protected function notifyAdminOfFailure(Order $order, string $error, NotificationService $notificationService): void
    {
        try {
            $notificationService->sendAdminNotification(
                'Shipping Label Creation Failed',
                "Failed to create shipping label for Order #{$order->order_number} after {$this->tries} attempts.\n\n" .
                "Error: {$error}\n\n" .
                "Please create the shipping label manually."
            );
        } catch (\Exception $e) {
            LogHelper::exception($e, [
                'context' => 'admin_shipping_notification_failed',
                'order_id' => $order->id,
            ]);
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        LogHelper::shipping('Retry shipping label job failed permanently', [
            'order_id' => $this->orderId,
            'rate_id' => $this->rateId,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ], 'error');
    }
}
