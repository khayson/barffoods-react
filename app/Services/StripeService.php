<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\Customer;
use Stripe\Refund;
use Stripe\Exception\CardException;
use Stripe\Exception\RateLimitException;
use Stripe\Exception\InvalidRequestException;
use Stripe\Exception\AuthenticationException;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Facades\Log;

class StripeService
{
    protected $secretKey;
    protected $publishableKey;
    protected $webhookSecret;

    public function __construct()
    {
        $this->secretKey = config('services.stripe.secret_key');
        $this->publishableKey = config('services.stripe.publishable_key');
        $this->webhookSecret = config('services.stripe.webhook_secret');
        
        Stripe::setApiKey($this->secretKey);
    }

    /**
     * Create a Stripe Checkout Session
     */
    public function createCheckoutSession(array $data): array
    {
        try {
            $sessionData = [
                'payment_method_types' => ['card'],
                'line_items' => $data['line_items'],
                'mode' => 'payment',
                'success_url' => $data['success_url'],
                'cancel_url' => $data['cancel_url'],
                'customer_email' => $data['customer_email'] ?? null,
                'metadata' => $data['metadata'] ?? [],
                'billing_address_collection' => 'required',
            ];

            // Only collect shipping address if not provided in data
            if (!isset($data['shipping_address'])) {
                $sessionData['shipping_address_collection'] = [
                    'allowed_countries' => ['US'],
                ];
            }
            // If shipping address is provided, we'll use it from our form data

            $session = \Stripe\Checkout\Session::create($sessionData);

            return [
                'success' => true,
                'session_id' => $session->id,
                'url' => $session->url,
            ];
        } catch (\Stripe\Exception\ApiErrorException $e) {
            \Log::error('Stripe Checkout Session creation failed', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create a payment intent for a given amount
     */
    public function createPaymentIntent(array $data): array
    {
        try {
            $paymentIntent = PaymentIntent::create([
                'amount' => $data['amount'], // Amount in cents
                'currency' => $data['currency'] ?? 'usd',
                'customer' => $data['customer_id'] ?? null,
                'payment_method' => $data['payment_method_id'] ?? null,
                'metadata' => $data['metadata'] ?? [],
                'description' => $data['description'] ?? 'Order payment',
                'automatic_payment_methods' => [
                    'enabled' => true,
                    'allow_redirects' => 'never',
                ],
            ]);

            return [
                'success' => true,
                'payment_intent' => $paymentIntent,
                'client_secret' => $paymentIntent->client_secret,
            ];

        } catch (CardException $e) {
            Log::error('Stripe Card Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Card was declined: ' . $e->getDeclineCode(),
                'error_type' => 'card_error',
            ];
        } catch (RateLimitException $e) {
            Log::error('Stripe Rate Limit Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Too many requests made to the API too quickly',
                'error_type' => 'rate_limit_error',
            ];
        } catch (InvalidRequestException $e) {
            Log::error('Stripe Invalid Request Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Invalid parameters were supplied to Stripe API',
                'error_type' => 'invalid_request_error',
            ];
        } catch (AuthenticationException $e) {
            Log::error('Stripe Authentication Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Authentication with Stripe API failed',
                'error_type' => 'authentication_error',
            ];
        } catch (ApiConnectionException $e) {
            Log::error('Stripe API Connection Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Network communication with Stripe failed',
                'error_type' => 'api_connection_error',
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'An error occurred with Stripe API',
                'error_type' => 'api_error',
            ];
        }
    }

    /**
     * Confirm a payment intent
     */
    public function confirmPaymentIntent(string $paymentIntentId): array
    {
        try {
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);
            $paymentIntent->confirm();

            return [
                'success' => true,
                'payment_intent' => $paymentIntent,
                'status' => $paymentIntent->status,
            ];

        } catch (ApiErrorException $e) {
            Log::error('Stripe Confirm Payment Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_type' => 'api_error',
            ];
        }
    }

    /**
     * Create or retrieve a Stripe customer
     */
    public function createCustomer(array $data): array
    {
        try {
            $customer = Customer::create([
                'email' => $data['email'],
                'name' => $data['name'] ?? null,
                'phone' => $data['phone'] ?? null,
                'metadata' => $data['metadata'] ?? [],
            ]);

            return [
                'success' => true,
                'customer' => $customer,
                'customer_id' => $customer->id,
            ];

        } catch (ApiErrorException $e) {
            Log::error('Stripe Create Customer Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_type' => 'api_error',
            ];
        }
    }

    /**
     * Create a payment method
     */
    public function createPaymentMethod(array $data): array
    {
        try {
            $paymentMethod = PaymentMethod::create([
                'type' => 'card',
                'card' => [
                    'number' => $data['card_number'],
                    'exp_month' => $data['exp_month'],
                    'exp_year' => $data['exp_year'],
                    'cvc' => $data['cvc'],
                ],
                'billing_details' => [
                    'name' => $data['name'] ?? null,
                    'email' => $data['email'] ?? null,
                    'phone' => $data['phone'] ?? null,
                ],
            ]);

            return [
                'success' => true,
                'payment_method' => $paymentMethod,
                'payment_method_id' => $paymentMethod->id,
            ];

        } catch (CardException $e) {
            Log::error('Stripe Payment Method Card Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => 'Card was declined: ' . $e->getDeclineCode(),
                'error_type' => 'card_error',
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe Payment Method Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_type' => 'api_error',
            ];
        }
    }

    /**
     * Process a refund
     */
    public function refundPayment(string $paymentIntentId, int $amount = null): array
    {
        try {
            $refundData = [
                'payment_intent' => $paymentIntentId,
            ];

            if ($amount !== null) {
                $refundData['amount'] = $amount;
            }

            $refund = Refund::create($refundData);

            return [
                'success' => true,
                'refund' => $refund,
                'refund_id' => $refund->id,
            ];

        } catch (ApiErrorException $e) {
            Log::error('Stripe Refund Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_type' => 'api_error',
            ];
        }
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $signature,
                $this->webhookSecret
            );

            return true;
        } catch (\Exception $e) {
            Log::error('Stripe Webhook Verification Failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Get payment intent details
     */
    public function getPaymentIntent(string $paymentIntentId): array
    {
        try {
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            return [
                'success' => true,
                'payment_intent' => $paymentIntent,
                'status' => $paymentIntent->status,
                'amount' => $paymentIntent->amount,
                'currency' => $paymentIntent->currency,
            ];

        } catch (ApiErrorException $e) {
            Log::error('Stripe Get Payment Intent Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'error_type' => 'api_error',
            ];
        }
    }

    /**
     * Get publishable key for frontend
     */
    public function getPublishableKey(): string
    {
        return $this->publishableKey;
    }
}
