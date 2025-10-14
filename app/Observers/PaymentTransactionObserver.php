<?php

namespace App\Observers;

use App\Models\PaymentTransaction;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\PaymentCompletedNotification;
use App\Notifications\PaymentFailedNotification;

class PaymentTransactionObserver
{
    /**
     * Handle the PaymentTransaction "created" event.
     */
    public function created(PaymentTransaction $paymentTransaction): void
    {
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
        // Check if status changed
        if ($paymentTransaction->isDirty('status')) {
            $oldStatus = $paymentTransaction->getOriginal('status');
            $newStatus = $paymentTransaction->status;

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
