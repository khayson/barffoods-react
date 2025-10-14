<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Events\OrderStatusChanged;
use App\Jobs\SendOrderStatusNotificationJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderStatusService
{
    /**
     * Valid status transitions
     */
    private const VALID_TRANSITIONS = [
        'confirmed' => ['processing', 'shipped', 'delivered'],
        'processing' => ['shipped', 'delivered'],
        'shipped' => ['delivered'],
        'delivered' => [] // Final state - no transitions allowed
    ];

    /**
     * Update order status with validation and automatic history creation
     */
    public function updateOrderStatus(Order $order, string $newStatus, ?string $notes = null, ?string $updatedBy = null): bool
    {
        try {
            DB::beginTransaction();

            // Validate status transition
            $this->validateStatusTransition($order->status, $newStatus);

            // Store old status for comparison
            $oldStatus = $order->status;

            // Update order status
            $order->update(['status' => $newStatus]);

            // Create status history entry
            $this->createStatusHistory($order, $newStatus, $notes, $updatedBy);

            // Trigger events and notifications
            $this->triggerStatusChangeEvents($order, $oldStatus, $newStatus);

            DB::commit();

            Log::info('Order status updated successfully', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'updated_by' => $updatedBy
            ]);

            return true;

        } catch (\Exception $e) {
            DB::rollback();
            
            Log::error('Failed to update order status', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'new_status' => $newStatus,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Validate if status transition is allowed
     */
    private function validateStatusTransition(string $currentStatus, string $newStatus): void
    {
        if ($currentStatus === $newStatus) {
            throw new \InvalidArgumentException("Order is already in '{$newStatus}' status");
        }

        $allowedTransitions = self::VALID_TRANSITIONS[$currentStatus] ?? [];
        
        if (!in_array($newStatus, $allowedTransitions)) {
            throw new \InvalidArgumentException(
                "Invalid status transition from '{$currentStatus}' to '{$newStatus}'. " .
                "Allowed transitions: " . implode(', ', $allowedTransitions)
            );
        }
    }

    /**
     * Create status history entry
     */
    private function createStatusHistory(Order $order, string $status, ?string $notes = null, ?string $updatedBy = null): void
    {
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => $status,
            'notes' => $notes ?: $this->getDefaultNotes($status, $updatedBy),
        ]);
    }

    /**
     * Get default notes for status change
     */
    private function getDefaultNotes(string $status, ?string $updatedBy = null): string
    {
        $baseNotes = match($status) {
            'confirmed' => 'Order confirmed after successful payment',
            'processing' => 'Order is being processed and prepared',
            'shipped' => 'Order has been shipped',
            'delivered' => 'Order has been delivered successfully',
            default => "Status changed to {$status}"
        };

        return $updatedBy ? "{$baseNotes} (Updated by: {$updatedBy})" : $baseNotes;
    }

    /**
     * Trigger events and notifications
     */
    private function triggerStatusChangeEvents(Order $order, string $oldStatus, string $newStatus): void
    {
        // Dispatch event for other listeners
        event(new OrderStatusChanged($order, $oldStatus, $newStatus));

        // Queue notification job
        SendOrderStatusNotificationJob::dispatch($order, $oldStatus, $newStatus);
    }

    /**
     * Get available status transitions for current order status
     */
    public function getAvailableTransitions(string $currentStatus): array
    {
        return self::VALID_TRANSITIONS[$currentStatus] ?? [];
    }

    /**
     * Get all possible statuses
     */
    public function getAllStatuses(): array
    {
        return array_keys(self::VALID_TRANSITIONS);
    }

    /**
     * Check if status transition is valid
     */
    public function canTransitionTo(string $currentStatus, string $newStatus): bool
    {
        $allowedTransitions = self::VALID_TRANSITIONS[$currentStatus] ?? [];
        return in_array($newStatus, $allowedTransitions);
    }
}
