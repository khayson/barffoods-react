<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\TrackingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class EasyPostWebhookController extends Controller
{
    protected $trackingService;

    public function __construct(TrackingService $trackingService)
    {
        $this->trackingService = $trackingService;
    }

    /**
     * Handle EasyPost webhook
     */
    public function handle(Request $request): JsonResponse
    {
        try {
            // Log incoming webhook
            Log::info('EasyPost webhook received', [
                'headers' => $request->headers->all(),
                'payload' => $request->all(),
            ]);

            // Verify webhook signature
            if (!$this->verifyWebhookSignature($request)) {
                Log::warning('Invalid EasyPost webhook signature', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
                
                return response()->json(['error' => 'Invalid signature'], 401);
            }

            // Get webhook data
            $payload = $request->all();
            $description = $payload['description'] ?? '';
            $result = $payload['result'] ?? [];

            // Handle different webhook events
            switch ($description) {
                case 'tracker.created':
                    $this->handleTrackerCreated($result);
                    break;

                case 'tracker.updated':
                    $this->handleTrackerUpdated($result);
                    break;

                default:
                    Log::info('Unhandled EasyPost webhook event', [
                        'description' => $description,
                    ]);
            }

            return response()->json(['success' => true], 200);

        } catch (\Exception $e) {
            Log::error('EasyPost webhook processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $request->all(),
            ]);

            // Return 200 to prevent EasyPost from retrying
            return response()->json(['success' => false, 'error' => 'Internal error'], 200);
        }
    }

    /**
     * Verify webhook signature from EasyPost
     */
    protected function verifyWebhookSignature(Request $request): bool
    {
        // Get webhook secret from environment
        $webhookSecret = config('services.easypost.webhook_secret');

        // If no webhook secret is configured, skip verification in development
        if (!$webhookSecret) {
            if (app()->environment('local')) {
                Log::warning('EasyPost webhook secret not configured - skipping verification in local environment');
                return true;
            }
            
            Log::error('EasyPost webhook secret not configured');
            return false;
        }

        // Get signature from header
        $signature = $request->header('X-Hmac-Signature');

        if (!$signature) {
            Log::warning('EasyPost webhook missing signature header');
            return false;
        }

        // Calculate expected signature
        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $payload, $webhookSecret);

        // Compare signatures
        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('EasyPost webhook signature mismatch', [
                'expected' => $expectedSignature,
                'received' => $signature,
            ]);
            return false;
        }

        return true;
    }

    /**
     * Handle tracker.created event
     */
    protected function handleTrackerCreated(array $tracker): void
    {
        Log::info('Processing tracker.created event', [
            'tracking_code' => $tracker['tracking_code'] ?? null,
            'status' => $tracker['status'] ?? null,
        ]);

        // Process tracking update
        $trackingData = $this->formatTrackingData($tracker);
        $this->trackingService->processTrackingUpdate($trackingData, 'webhook');
    }

    /**
     * Handle tracker.updated event
     */
    protected function handleTrackerUpdated(array $tracker): void
    {
        Log::info('Processing tracker.updated event', [
            'tracking_code' => $tracker['tracking_code'] ?? null,
            'status' => $tracker['status'] ?? null,
        ]);

        // Process tracking update
        $trackingData = $this->formatTrackingData($tracker);
        $this->trackingService->processTrackingUpdate($trackingData, 'webhook');
    }

    /**
     * Format EasyPost tracker data for processing
     */
    protected function formatTrackingData(array $tracker): array
    {
        return [
            'tracking_code' => $tracker['tracking_code'] ?? null,
            'status' => $tracker['status'] ?? 'unknown',
            'carrier' => $tracker['carrier'] ?? 'unknown',
            'tracking_details' => $tracker['tracking_details'] ?? [],
            'est_delivery_date' => $tracker['est_delivery_date'] ?? null,
            'updated_at' => $tracker['updated_at'] ?? now(),
            'message' => $tracker['status_detail'] ?? $tracker['status'] ?? 'Status update',
        ];
    }

    /**
     * Test endpoint for webhook (development only)
     */
    public function test(Request $request): JsonResponse
    {
        if (!app()->environment('local')) {
            return response()->json(['error' => 'Not available in production'], 403);
        }

        // Simulate a tracking update
        $testData = [
            'description' => 'tracker.updated',
            'result' => [
                'tracking_code' => $request->input('tracking_code', 'TEST123456789'),
                'status' => $request->input('status', 'in_transit'),
                'carrier' => $request->input('carrier', 'USPS'),
                'tracking_details' => [
                    [
                        'status' => $request->input('status', 'in_transit'),
                        'message' => $request->input('message', 'Package is in transit'),
                        'datetime' => now()->toIso8601String(),
                        'city' => 'Los Angeles',
                        'state' => 'CA',
                        'zip' => '90001',
                    ]
                ],
                'updated_at' => now()->toIso8601String(),
            ],
        ];

        // Process the test webhook
        $request->merge($testData);
        return $this->handle($request);
    }
}
