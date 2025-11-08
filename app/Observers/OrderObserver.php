<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Services\OrderStatusService;
use App\Services\AuditService;
use Illuminate\Support\Facades\Log;

class OrderObserver
{
    protected $orderStatusService;
    protected $auditService;

    public function __construct(OrderStatusService $orderStatusService, AuditService $auditService)
    {
        $this->orderStatusService = $orderStatusService;
        $this->auditService = $auditService;
    }

    /**
     * Handle the Order "created" event.
     */
    public function created(Order $order): void
    {
        $this->auditService->log(
            'order_created',
            $order,
            null,
            $order->toArray(),
            "Order {$order->order_number} created with status {$order->status}"
        );

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
        // Get all changed attributes
        $changes = $order->getChanges();
        $original = array_intersect_key($order->getOriginal(), $changes);

        // Log the update to audit service
        if (!empty($changes)) {
            $this->auditService->log(
                'order_updated',
                $order,
                $original,
                $changes,
                "Order {$order->order_number} updated"
            );
        }

        // Check if status was changed
        if ($order->wasChanged('status')) {
            $oldStatus = $order->getOriginal('status');
            $newStatus = $order->status;

            $this->auditService->log(
                'order_status_changed',
                $order,
                ['status' => $oldStatus],
                ['status' => $newStatus],
                "Order {$order->order_number} status changed from {$oldStatus} to {$newStatus}"
            );

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
            $this->auditService->log(
                'order_ready_for_delivery_changed',
                $order,
                ['is_ready_for_delivery' => $order->getOriginal('is_ready_for_delivery')],
                ['is_ready_for_delivery' => $order->is_ready_for_delivery],
                "Order {$order->order_number} ready for delivery status changed"
            );

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
        $this->auditService->log(
            'order_deleted',
            $order,
            $order->toArray(),
            null,
            "Order {$order->order_number} deleted"
        );

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