<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Services\StripeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProcessStripePaymentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $order;
    protected $paymentData;
    protected $stripeService;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(Order $order, array $paymentData)
    {
        $this->order = $order;
        $this->paymentData = $paymentData;
        $this->stripeService = new StripeService();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        DB::beginTransaction();

        try {
            Log::info('Processing Stripe payment job started', [
                'order_id' => $this->order->id,
                'amount' => $this->paymentData['amount'],
            ]);

            // Create payment transaction record
            $paymentTransaction = PaymentTransaction::create([
                'order_id' => $this->order->id,
                'amount' => $this->paymentData['amount'],
                'payment_method' => 'stripe',
                'status' => 'pending',
            ]);

            // Process payment with Stripe
            $result = $this->processStripePayment($paymentTransaction);

            if ($result['success']) {
                // Update payment transaction with Stripe details
                $paymentTransaction->update([
                    'transaction_id' => $result['payment_intent']->id,
                    'status' => 'completed',
                ]);

                Log::info('Stripe payment processed successfully', [
                    'order_id' => $this->order->id,
                    'payment_intent_id' => $result['payment_intent']->id,
                    'amount' => $this->paymentData['amount'],
                ]);

            } else {
                // Update payment transaction as failed
                $paymentTransaction->update([
                    'status' => 'failed',
                ]);

                Log::error('Stripe payment failed', [
                    'order_id' => $this->order->id,
                    'error' => $result['error'],
                    'error_type' => $result['error_type'] ?? 'unknown',
                ]);

                // Fail the job so it can be retried
                $this->fail(new \Exception($result['error']));
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Stripe payment job failed', [
                'order_id' => $this->order->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Process payment with Stripe
     */
    private function processStripePayment(PaymentTransaction $paymentTransaction): array
    {
        try {
            // Prepare payment data for Stripe
            $stripeData = [
                'amount' => $this->convertToCents($this->paymentData['amount']),
                'currency' => $this->paymentData['currency'] ?? 'usd',
                'description' => "Order #{$this->order->id} - BarfFoods",
                'metadata' => [
                    'order_id' => $this->order->id,
                    'payment_transaction_id' => $paymentTransaction->id,
                ],
            ];

            // Add customer if user exists
            if ($this->order->user) {
                $customerResult = $this->stripeService->createCustomer([
                    'email' => $this->order->user->email,
                    'name' => $this->order->user->name,
                    'metadata' => [
                        'user_id' => $this->order->user->id,
                    ],
                ]);

                if ($customerResult['success']) {
                    $stripeData['customer_id'] = $customerResult['customer_id'];
                }
            }

            // Add payment method if provided
            if (isset($this->paymentData['payment_method_id'])) {
                $stripeData['payment_method_id'] = $this->paymentData['payment_method_id'];
            }

            // Create payment intent
            return $this->stripeService->createPaymentIntent($stripeData);

        } catch (\Exception $e) {
            Log::error('Stripe payment processing error', [
                'order_id' => $this->order->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_type' => 'processing_error',
            ];
        }
    }

    /**
     * Convert amount to cents for Stripe
     */
    private function convertToCents(float $amount): int
    {
        return (int) round($amount * 100);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Stripe payment job permanently failed', [
            'order_id' => $this->order->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);

        // Update order status to payment_failed
        $this->order->update(['status' => 'payment_failed']);

        // Create failed payment transaction if it doesn't exist
        PaymentTransaction::updateOrCreate(
            ['order_id' => $this->order->id],
            [
                'amount' => $this->paymentData['amount'],
                'payment_method' => 'stripe',
                'status' => 'failed',
            ]
        );
    }
}
