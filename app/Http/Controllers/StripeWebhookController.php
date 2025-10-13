<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessStripeWebhookJob;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class StripeWebhookController extends Controller
{
    /**
     * Handle Stripe webhook events
     */
    public function handle(Request $request): Response
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        // Verify webhook signature (skip if no webhook secret configured)
        $stripeService = new \App\Services\StripeService();
        
        // Skip verification if no webhook secret is configured (development only)
        if (config('services.stripe.webhook_secret') && !$stripeService->verifyWebhookSignature($payload, $signature)) {
            Log::warning('Stripe webhook signature verification failed', [
                'signature' => $signature,
                'payload_length' => strlen($payload),
            ]);

            return response('Invalid signature', 400);
        }

        try {
            $event = json_decode($payload, true);

            Log::info('Stripe webhook received', [
                'event_type' => $event['type'],
                'event_id' => $event['id'],
            ]);

            // Dispatch webhook processing job
            ProcessStripeWebhookJob::dispatch($event);

            return response('Webhook processed', 200);

        } catch (\Exception $e) {
            Log::error('Stripe webhook processing failed', [
                'error' => $e->getMessage(),
                'payload' => $payload,
            ]);

            return response('Webhook processing failed', 500);
        }
    }
}
