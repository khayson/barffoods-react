<?php

namespace App\Jobs;

use App\Models\Order;
use App\Mail\OrderStatusUpdateMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendOrderStatusNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Order $order;
    public string $oldStatus;
    public string $newStatus;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public int $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(Order $order, string $oldStatus, string $newStatus)
    {
        $this->order = $order;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Sending order status notification', [
                'order_id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'old_status' => $this->oldStatus,
                'new_status' => $this->newStatus,
                'customer_email' => $this->order->user->email
            ]);

            // Send email notification to customer
            Mail::to($this->order->user->email)
                ->send(new OrderStatusUpdateMail($this->order, $this->oldStatus, $this->newStatus));

            Log::info('Order status notification sent successfully', [
                'order_id' => $this->order->id,
                'customer_email' => $this->order->user->email
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send order status notification', [
                'order_id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'customer_email' => $this->order->user->email,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts()
            ]);

            // Re-throw the exception to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Order status notification job failed permanently', [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'customer_email' => $this->order->user->email,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);
    }
}
