<?php

namespace App\Jobs;

use App\Models\PaymentTransaction;
use App\Services\StripeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProcessStripeWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $eventData;
    protected $stripeService;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(array $eventData)
    {
        $this->eventData = $eventData;
        $this->stripeService = new StripeService();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Processing Stripe webhook', [
                'event_type' => $this->eventData['type'],
                'event_id' => $this->eventData['id'],
            ]);

            switch ($this->eventData['type']) {
                case 'payment_intent.succeeded':
                    $this->handlePaymentIntentSucceeded();
                    break;

                case 'payment_intent.payment_failed':
                    $this->handlePaymentIntentFailed();
                    break;

                case 'payment_intent.canceled':
                    $this->handlePaymentIntentCanceled();
                    break;

                case 'charge.dispute.created':
                    $this->handleChargeDisputeCreated();
                    break;

                case 'payment_method.attached':
                    $this->handlePaymentMethodAttached();
                    break;

                default:
                    Log::info('Unhandled Stripe webhook event', [
                        'event_type' => $this->eventData['type'],
                    ]);
                    break;
            }

        } catch (\Exception $e) {
            Log::error('Stripe webhook processing failed', [
                'event_type' => $this->eventData['type'],
                'event_id' => $this->eventData['id'],
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle payment intent succeeded
     */
    private function handlePaymentIntentSucceeded(): void
    {
        $paymentIntent = $this->eventData['data']['object'];
        
        DB::transaction(function () use ($paymentIntent) {
            $paymentTransaction = PaymentTransaction::where('transaction_id', $paymentIntent['id'])->first();
            
            if ($paymentTransaction) {
                $paymentTransaction->update(['status' => 'completed']);
                
                Log::info('Payment transaction updated from webhook', [
                    'transaction_id' => $paymentTransaction->id,
                    'stripe_payment_intent_id' => $paymentIntent['id'],
                    'amount' => $paymentIntent['amount'],
                ]);
            } else {
                Log::warning('Payment transaction not found for webhook', [
                    'stripe_payment_intent_id' => $paymentIntent['id'],
                ]);
            }
        });
    }

    /**
     * Handle payment intent failed
     */
    private function handlePaymentIntentFailed(): void
    {
        $paymentIntent = $this->eventData['data']['object'];
        
        DB::transaction(function () use ($paymentIntent) {
            $paymentTransaction = PaymentTransaction::where('transaction_id', $paymentIntent['id'])->first();
            
            if ($paymentTransaction) {
                $paymentTransaction->update(['status' => 'failed']);
                
                Log::info('Payment transaction marked as failed from webhook', [
                    'transaction_id' => $paymentTransaction->id,
                    'stripe_payment_intent_id' => $paymentIntent['id'],
                    'failure_reason' => $paymentIntent['last_payment_error']['message'] ?? 'Unknown',
                ]);
            }
        });
    }

    /**
     * Handle payment intent canceled
     */
    private function handlePaymentIntentCanceled(): void
    {
        $paymentIntent = $this->eventData['data']['object'];
        
        DB::transaction(function () use ($paymentIntent) {
            $paymentTransaction = PaymentTransaction::where('transaction_id', $paymentIntent['id'])->first();
            
            if ($paymentTransaction) {
                $paymentTransaction->update(['status' => 'failed']);
                
                Log::info('Payment transaction canceled from webhook', [
                    'transaction_id' => $paymentTransaction->id,
                    'stripe_payment_intent_id' => $paymentIntent['id'],
                ]);
            }
        });
    }

    /**
     * Handle charge dispute created
     */
    private function handleChargeDisputeCreated(): void
    {
        $dispute = $this->eventData['data']['object'];
        
        Log::warning('Charge dispute created', [
            'dispute_id' => $dispute['id'],
            'charge_id' => $dispute['charge'],
            'amount' => $dispute['amount'],
            'reason' => $dispute['reason'],
        ]);

        // You can add dispute handling logic here
        // For example, notify admin, update order status, etc.
    }

    /**
     * Handle payment method attached
     */
    private function handlePaymentMethodAttached(): void
    {
        $paymentMethod = $this->eventData['data']['object'];
        
        Log::info('Payment method attached', [
            'payment_method_id' => $paymentMethod['id'],
            'customer_id' => $paymentMethod['customer'],
        ]);

        // You can add payment method handling logic here
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Stripe webhook job permanently failed', [
            'event_type' => $this->eventData['type'],
            'event_id' => $this->eventData['id'],
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);
    }
}
