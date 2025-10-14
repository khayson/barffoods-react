<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Services\OrderStatusService;
use Illuminate\Support\Facades\Log;

class OrderObserver
{
    protected $orderStatusService;

    public function __construct(OrderStatusService $orderStatusService)
    {
        $this->orderStatusService = $orderStatusService;
    }

    /**
     * Handle the Order "created" event.
     */
    public function created(Order $order): void
    {
        Log::info('Order created', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'user_id' => $order->user_id
        ]);
    }

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        // Check if status was changed
        if ($order->wasChanged('status')) {
            $oldStatus = $order->getOriginal('status');
            $newStatus = $order->status;

            Log::info('Order status changed via observer', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'old_status' => $oldStatus,
                'new_status' => $newStatus
            ]);

            // Only create status history if it wasn't already created by OrderStatusService
            // This prevents duplicate entries when using the service
            $hasRecentStatusHistory = $order->statusHistory()
                ->where('status', $newStatus)
                ->where('created_at', '>=', now()->subMinutes(1))
                ->exists();

            if (!$hasRecentStatusHistory) {
                $this->createStatusHistory($order, $newStatus, $oldStatus);
            }
        }

        // Log other important changes
        if ($order->wasChanged('is_ready_for_delivery')) {
            Log::info('Order ready for delivery status changed', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'is_ready_for_delivery' => $order->is_ready_for_delivery
            ]);
        }
    }

    /**
     * Handle the Order "deleted" event.
     */
    public function deleted(Order $order): void
    {
        Log::info('Order deleted', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status
        ]);
    }

    /**
     * Create status history entry
     */
    private function createStatusHistory(Order $order, string $newStatus, string $oldStatus): void
    {
        try {
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => $newStatus,
                'notes' => "Status automatically updated from '{$oldStatus}' to '{$newStatus}'"
            ]);

            Log::info('Status history created via observer', [
                'order_id' => $order->id,
                'status' => $newStatus
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create status history via observer', [
                'order_id' => $order->id,
                'status' => $newStatus,
                'error' => $e->getMessage()
            ]);
        }
    }
}