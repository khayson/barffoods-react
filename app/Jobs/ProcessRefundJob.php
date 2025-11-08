<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Services\StripeService;
use App\Services\NotificationService;
use App\Helpers\LogHelper;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessRefundJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 300, 900]; // 1 min, 5 min, 15 min

    protected $orderId;
    protected $paymentIntentId;
    protected $reason;
    protected $notifyAdmin;

    /**
     * Create a new job instance.
     * 
     * @param int|string|null $orderIdOrPaymentIntent Order ID (int) or Payment Intent ID (string)
     * @param string|null $secondParam If first param is payment intent, this is reason. If first param is order ID, this is ignored.
     * @param string|bool $thirdParam Reason (if first param is payment intent) or notifyAdmin (if first param is order ID)
     */
    public function __construct($orderIdOrPaymentIntent, $secondParam = null, $thirdParam = true)
    {
        // Handle different parameter combinations for backward compatibility
        if (is_int($orderIdOrPaymentIntent)) {
            // Old signature: (int $orderId, string $reason, bool $notifyAdmin)
            $this->orderId = $orderIdOrPaymentIntent;
            $this->paymentIntentId = null;
            $this->reason = is_string($secondParam) ? $secondParam : 'Order failed';
            $this->notifyAdmin = is_bool($thirdParam) ? $thirdParam : true;
        } else {
            // New signature: (string $paymentIntentId, null, string $reason)
            $this->orderId = null;
            $this->paymentIntentId = $orderIdOrPaymentIntent;
            $this->reason = is_string($thirdParam) ? $thirdParam : (is_string($secondParam) ? $secondParam : 'Payment failed');
            $this->notifyAdmin = true;
        }
    }

    /**
     * Execute the job.
     */
    public function handle(StripeService $stripeService, NotificationService $notificationService): void
    {
        // Find order and payment transaction
        if ($this->orderId) {
            // Find by order ID
            $order = Order::find($this->orderId);

            if (!$order) {
                LogHelper::payment('Refund job failed: Order not found', [
                    'order_id' => $this->orderId,
                ], 'error');
                return;
            }

            // Find the payment transaction
            $paymentTransaction = PaymentTransaction::where('order_id', $order->id)
                ->where('status', 'completed')
                ->first();
        } else {
            // Find by payment intent ID
            $paymentTransaction = PaymentTransaction::where('transaction_id', $this->paymentIntentId)
                ->first();

            if (!$paymentTransaction) {
                LogHelper::payment('Refund job failed: Payment transaction not found', [
                    'payment_intent_id' => $this->paymentIntentId,
                ], 'error');
                return;
            }

            // Try to find associated order
            $order = $paymentTransaction->order_id ? Order::find($paymentTransaction->order_id) : null;
        }

        if (!$paymentTransaction) {
            // If no payment transaction in database but we have a payment intent ID,
            // try to refund directly through Stripe
            if ($this->paymentIntentId) {
                LogHelper::payment('No payment transaction in database, attempting direct Stripe refund', [
                    'payment_intent_id' => $this->paymentIntentId,
                    'reason' => $this->reason,
                ], 'warning');
                
                try {
                    // Get payment intent from Stripe to get the amount
                    $paymentIntent = \Stripe\PaymentIntent::retrieve($this->paymentIntentId);
                    
                    if ($paymentIntent->status === 'succeeded') {
                        // Create payment transaction record for audit trail
                        $paymentTransaction = PaymentTransaction::create([
                            'order_id' => null,
                            'amount' => $paymentIntent->amount / 100,
                            'payment_method' => 'stripe',
                            'transaction_id' => $this->paymentIntentId,
                            'status' => 'pending_refund',
                            'metadata' => json_encode([
                                'refund_reason' => $this->reason,
                                'created_during_refund' => true,
                                'payment_intent_status' => $paymentIntent->status,
                            ]),
                        ]);
                        
                        // Process refund
                        $refundResult = $stripeService->refundPayment(
                            $this->paymentIntentId,
                            $paymentIntent->amount / 100, // Convert from cents to dollars
                            ['reason' => $this->reason]
                        );
                        
                        if ($refundResult['success']) {
                            // Update payment transaction to refunded
                            $paymentTransaction->update([
                                'status' => 'refunded',
                                'metadata' => json_encode(array_merge(
                                    json_decode($paymentTransaction->metadata, true),
                                    [
                                        'refund_id' => $refundResult['refund_id'] ?? 'unknown',
                                        'refunded_at' => now()->toISOString(),
                                    ]
                                )),
                            ]);
                            
                            LogHelper::payment('Direct Stripe refund completed successfully', [
                                'payment_intent_id' => $this->paymentIntentId,
                                'payment_transaction_id' => $paymentTransaction->id,
                                'refund_id' => $refundResult['refund_id'] ?? 'unknown',
                                'amount' => $paymentIntent->amount / 100,
                            ], 'info');
                            return;
                        } else {
                            // Mark as failed
                            $paymentTransaction->update(['status' => 'refund_failed']);
                            throw new \Exception($refundResult['error'] ?? 'Refund failed');
                        }
                    } else {
                        LogHelper::payment('Payment intent not in succeeded status, no refund needed', [
                            'payment_intent_id' => $this->paymentIntentId,
                            'status' => $paymentIntent->status,
                        ], 'info');
                        return;
                    }
                } catch (\Exception $e) {
                    LogHelper::exception($e, [
                        'context' => 'direct_stripe_refund',
                        'payment_intent_id' => $this->paymentIntentId,
                    ]);
                    throw $e;
                }
            }
            
            LogHelper::payment('Refund job failed: No payment transaction found and no payment intent ID', [
                'order_id' => $this->orderId,
                'payment_intent_id' => $this->paymentIntentId,
                'order_number' => $order ? $order->order_number : 'N/A',
            ], 'error');
            
            if ($this->notifyAdmin && $order) {
                $this->notifyAdminOfRefundIssue($order, 'No payment transaction found', $notificationService);
            }
            return;
        }

        try {
            LogHelper::payment('Processing automatic refund', [
                'order_id' => $order ? $order->id : null,
                'order_number' => $order ? $order->order_number : 'N/A',
                'transaction_id' => $paymentTransaction->transaction_id,
                'amount' => $paymentTransaction->amount,
                'reason' => $this->reason,
            ], 'info');

            // Process refund through Stripe
            $refundResult = $stripeService->refundPayment(
                $paymentTransaction->transaction_id,
                $paymentTransaction->amount,
                ['reason' => $this->reason, 'order_id' => $order ? $order->id : null]
            );

            if ($refundResult['success']) {
                // Update payment transaction
                $paymentTransaction->update([
                    'status' => 'refunded',
                    'metadata' => json_encode(array_merge(
                        json_decode($paymentTransaction->metadata ?? '{}', true),
                        [
                            'refund_id' => $refundResult['refund_id'] ?? 'unknown',
                            'refunded_at' => now()->toISOString(),
                            'refund_reason' => $this->reason,
                        ]
                    )),
                ]);

                // Update order status if order exists
                if ($order) {
                    $order->update([
                        'status' => 'refunded',
                    ]);

                    // Create status history
                    \App\Models\OrderStatusHistory::create([
                        'order_id' => $order->id,
                        'status' => 'refunded',
                        'notes' => 'Automatic refund processed: ' . $this->reason,
                    ]);
                }

                LogHelper::payment('Automatic refund completed successfully', [
                    'order_id' => $order ? $order->id : null,
                    'order_number' => $order ? $order->order_number : 'N/A',
                    'payment_transaction_id' => $paymentTransaction->id,
                    'refund_id' => $refundResult['refund_id'] ?? 'unknown',
                    'amount' => $paymentTransaction->amount,
                ], 'info');

                // Notify customer if order and user exist
                if ($order && $order->user) {
                    $notificationService->sendOrderRefundedNotification($order->user, $order);
                }

            } else {
                throw new \Exception($refundResult['error'] ?? 'Refund failed');
            }

        } catch (\Exception $e) {
            LogHelper::exception($e, [
                'context' => 'automatic_refund_processing',
                'order_id' => $order ? $order->id : null,
                'order_number' => $order ? $order->order_number : 'N/A',
                'payment_intent_id' => $this->paymentIntentId,
                'attempt' => $this->attempts(),
            ]);

            // If this is the last attempt, notify admin
            if ($this->attempts() >= $this->tries && $this->notifyAdmin && $order) {
                $this->notifyAdminOfRefundIssue($order, $e->getMessage(), $notificationService);
            }

            // Re-throw to trigger retry
            throw $e;
        }
    }

    /**
     * Notify admin of refund processing issue
     */
    protected function notifyAdminOfRefundIssue(Order $order, string $error, NotificationService $notificationService): void
    {
        try {
            $notificationService->sendAdminNotification(
                'Refund Processing Failed',
                "Failed to process automatic refund for Order #{$order->order_number}.\n\n" .
                "Error: {$error}\n\n" .
                "Please process this refund manually."
            );
        } catch (\Exception $e) {
            LogHelper::exception($e, [
                'context' => 'admin_refund_notification_failed',
                'order_id' => $order->id,
            ]);
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        LogHelper::payment('Refund job failed permanently', [
            'order_id' => $this->orderId,
            'payment_intent_id' => $this->paymentIntentId,
            'reason' => $this->reason,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ], 'error');
    }
}
