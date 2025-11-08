<?php

namespace App\Observers;

use App\Models\PaymentTransaction;
use App\Models\Order;
use App\Services\AuditService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\PaymentCompletedNotification;
use App\Notifications\PaymentFailedNotification;

class PaymentTransactionObserver
{
    protected $auditService;

    public function __construct(AuditService $auditService)
    {
        $this->auditService = $auditService;
    }
    /**
     * Handle the PaymentTransaction "created" event.
     */
    public function created(PaymentTransaction $paymentTransaction): void
    {
        $this->auditService->log(
            'payment_transaction_created',
            $paymentTransaction,
            null,
            $paymentTransaction->toArray(),
            "Payment transaction created for order {$paymentTransaction->order_id} - Amount: {$paymentTransaction->amount}"
        );

        Log::info('Payment transaction created', [
            'transaction_id' => $paymentTransaction->id,
            'order_id' => $paymentTransaction->order_id,
            'amount' => $paymentTransaction->amount,
            'status' => $paymentTransaction->status,
        ]);
    }

    /**
     * Handle the PaymentTransaction "updated" event.
     */
    public function updated(PaymentTransaction $paymentTransaction): void
    {
        // Get all changed attributes
        $changes = $paymentTransaction->getChanges();
        $original = array_intersect_key($paymentTransaction->getOriginal(), $changes);

        // Log the update to audit service
        if (!empty($changes)) {
            $this->auditService->log(
                'payment_transaction_updated',
                $paymentTransaction,
                $original,
                $changes,
                "Payment transaction {$paymentTransaction->id} updated"
            );
        }

        // Check if status changed
        if ($paymentTransaction->isDirty('status')) {
            $oldStatus = $paymentTransaction->getOriginal('status');
            $newStatus = $paymentTransaction->status;

            $this->auditService->log(
                'payment_status_changed',
                $paymentTransaction,
                ['status' => $oldStatus],
                ['status' => $newStatus],
                "Payment transaction {$paymentTransaction->id} status changed from {$oldStatus} to {$newStatus}"
            );

            Log::info('Payment transaction status changed', [
                'transaction_id' => $paymentTransaction->id,
                'order_id' => $paymentTransaction->order_id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]);

            // Handle status-specific logic
            $this->handleStatusChange($paymentTransaction, $oldStatus, $newStatus);
        }

        // Check if transaction_id was set (Stripe payment intent ID)
        if ($paymentTransaction->isDirty('transaction_id') && $paymentTransaction->transaction_id) {
            $this->auditService->log(
                'payment_transaction_id_set',
                $paymentTransaction,
                ['transaction_id' => $paymentTransaction->getOriginal('transaction_id')],
                ['transaction_id' => $paymentTransaction->transaction_id],
                "Stripe payment intent ID set for transaction {$paymentTransaction->id}"
            );

            Log::info('Payment transaction ID set', [
                'transaction_id' => $paymentTransaction->id,
                'stripe_payment_intent_id' => $paymentTransaction->transaction_id,
            ]);
        }
    }

    /**
     * Handle the PaymentTransaction "deleted" event.
     */
    public function deleted(PaymentTransaction $paymentTransaction): void
    {
        $this->auditService->log(
            'payment_transaction_deleted',
            $paymentTransaction,
            $paymentTransaction->toArray(),
            null,
            "Payment transaction {$paymentTransaction->id} deleted for order {$paymentTransaction->order_id}"
        );

        Log::info('Payment transaction deleted', [
            'transaction_id' => $paymentTransaction->id,
            'order_id' => $paymentTransaction->order_id,
        ]);
    }

    /**
     * Handle status change logic
     */
    private function handleStatusChange(PaymentTransaction $paymentTransaction, string $oldStatus, string $newStatus): void
    {
        $order = $paymentTransaction->order;

        switch ($newStatus) {
            case 'completed':
                $this->handlePaymentCompleted($paymentTransaction, $order);
                break;

            case 'failed':
                $this->handlePaymentFailed($paymentTransaction, $order);
                break;

            case 'refunded':
                $this->handlePaymentRefunded($paymentTransaction, $order);
                break;

            case 'pending':
                $this->handlePaymentPending($paymentTransaction, $order);
                break;
        }
    }

    /**
     * Handle payment completed
     */
    private function handlePaymentCompleted(PaymentTransaction $paymentTransaction, Order $order): void
    {
        // Update order status to confirmed (payment completed)
        $order->update(['status' => 'confirmed']);

        // Send notification to customer
        if ($order->user) {
            $order->user->notify(new PaymentCompletedNotification($order, $paymentTransaction));
        }

        // Send notification to admin (if needed)
        // You can add admin notification here

        Log::info('Payment completed - Order updated', [
            'order_id' => $order->id,
            'transaction_id' => $paymentTransaction->id,
            'amount' => $paymentTransaction->amount,
        ]);
    }

    /**
     * Handle payment failed
     */
    private function handlePaymentFailed(PaymentTransaction $paymentTransaction, Order $order): void
    {
        // Update order status to payment_failed
        $order->update(['status' => 'payment_failed']);

        // Send notification to customer
        if ($order->user) {
            $order->user->notify(new PaymentFailedNotification($order, $paymentTransaction));
        }

        Log::warning('Payment failed - Order updated', [
            'order_id' => $order->id,
            'transaction_id' => $paymentTransaction->id,
            'amount' => $paymentTransaction->amount,
        ]);
    }

    /**
     * Handle payment refunded
     */
    private function handlePaymentRefunded(PaymentTransaction $paymentTransaction, Order $order): void
    {
        // Update order status to refunded
        $order->update(['status' => 'refunded']);

        Log::info('Payment refunded - Order updated', [
            'order_id' => $order->id,
            'transaction_id' => $paymentTransaction->id,
            'amount' => $paymentTransaction->amount,
        ]);
    }

    /**
     * Handle payment pending
     */
    private function handlePaymentPending(PaymentTransaction $paymentTransaction, Order $order): void
    {
        // Update order status to pending_payment
        $order->update(['status' => 'pending_payment']);

        Log::info('Payment pending - Order updated', [
            'order_id' => $order->id,
            'transaction_id' => $paymentTransaction->id,
            'amount' => $paymentTransaction->amount,
        ]);
    }
}
