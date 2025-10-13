<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Services\StripeService;
use App\Jobs\ProcessStripePaymentJob;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PaymentTransactionController extends Controller
{
    protected $stripeService;

    public function __construct(StripeService $stripeService)
    {
        $this->stripeService = $stripeService;
    }

    /**
     * Create a payment intent for an order
     */
    public function createPaymentIntent(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'string|in:usd,eur,gbp',
        ]);

        try {
            $order = Order::findOrFail($request->order_id);
            
            // Verify order belongs to authenticated user
            if (auth()->id() !== $order->user_id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Check if order already has a completed payment
            if ($order->paymentTransactions()->where('status', 'completed')->exists()) {
                return response()->json(['error' => 'Order already paid'], 400);
            }

            $paymentData = [
                'amount' => $request->amount,
                'currency' => $request->currency ?? 'usd',
                'description' => "Order #{$order->id} - BarfFoods",
                'metadata' => [
                    'order_id' => $order->id,
                ],
            ];

            // Add customer information if user exists
            if ($order->user) {
                $customerResult = $this->stripeService->createCustomer([
                    'email' => $order->user->email,
                    'name' => $order->user->name,
                    'metadata' => [
                        'user_id' => $order->user->id,
                    ],
                ]);

                if ($customerResult['success']) {
                    $paymentData['customer_id'] = $customerResult['customer_id'];
                }
            }

            $result = $this->stripeService->createPaymentIntent($paymentData);

            if ($result['success']) {
                // Create payment transaction record
                PaymentTransaction::create([
                    'order_id' => $order->id,
                    'amount' => $request->amount,
                    'payment_method' => 'stripe',
                    'transaction_id' => $result['payment_intent']->id,
                    'status' => 'pending',
                ]);

                return response()->json([
                    'success' => true,
                    'client_secret' => $result['client_secret'],
                    'payment_intent_id' => $result['payment_intent']->id,
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error'],
                    'error_type' => $result['error_type'] ?? 'unknown',
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Payment intent creation failed', [
                'order_id' => $request->order_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Payment processing failed',
            ], 500);
        }
    }

    /**
     * Confirm a payment intent
     */
    public function confirmPayment(Request $request): JsonResponse
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        try {
            $result = $this->stripeService->confirmPaymentIntent($request->payment_intent_id);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'status' => $result['status'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error'],
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Payment confirmation failed', [
                'payment_intent_id' => $request->payment_intent_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Payment confirmation failed',
            ], 500);
        }
    }

    /**
     * Process payment asynchronously
     */
    public function processPayment(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'string|in:usd,eur,gbp',
            'payment_method_id' => 'string',
        ]);

        try {
            $order = Order::findOrFail($request->order_id);
            
            // Verify order belongs to authenticated user
            if (auth()->id() !== $order->user_id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Dispatch payment processing job
            ProcessStripePaymentJob::dispatch($order, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Payment processing started',
            ]);

        } catch (\Exception $e) {
            Log::error('Payment processing dispatch failed', [
                'order_id' => $request->order_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Payment processing failed',
            ], 500);
        }
    }

    /**
     * Get payment status
     */
    public function getPaymentStatus(Request $request): JsonResponse
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        try {
            $result = $this->stripeService->getPaymentIntent($request->payment_intent_id);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'status' => $result['status'],
                    'amount' => $result['amount'],
                    'currency' => $result['currency'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error'],
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Payment status check failed', [
                'payment_intent_id' => $request->payment_intent_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Payment status check failed',
            ], 500);
        }
    }

    /**
     * Process refund
     */
    public function refundPayment(Request $request): JsonResponse
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
            'amount' => 'numeric|min:0.01',
        ]);

        try {
            $refundData = [
                'payment_intent' => $request->payment_intent_id,
            ];

            if ($request->has('amount')) {
                $refundData['amount'] = $this->convertToCents($request->amount);
            }

            $result = $this->stripeService->refundPayment($request->payment_intent_id, $refundData['amount'] ?? null);

            if ($result['success']) {
                // Update payment transaction status
                PaymentTransaction::where('transaction_id', $request->payment_intent_id)
                    ->update(['status' => 'refunded']);

                return response()->json([
                    'success' => true,
                    'refund_id' => $result['refund_id'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error'],
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Payment refund failed', [
                'payment_intent_id' => $request->payment_intent_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Payment refund failed',
            ], 500);
        }
    }

    /**
     * Get Stripe publishable key
     */
    public function getPublishableKey(): JsonResponse
    {
        return response()->json([
            'publishable_key' => $this->stripeService->getPublishableKey(),
        ]);
    }

    /**
     * Convert amount to cents for Stripe
     */
    private function convertToCents(float $amount): int
    {
        return (int) round($amount * 100);
    }
}
