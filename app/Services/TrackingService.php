<?php

namespace App\Services;

use App\Models\Order;
use App\Models\ShipmentTrackingEvent;
use App\Models\User;
use App\Services\NotificationService;
use App\Mail\OrderTrackingUpdateMail;
use App\Events\OrderTrackingUpdated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TrackingService
{
    protected $easyPostService;
    protected $notificationService;

    public function __construct(EasyPostService $easyPostService, NotificationService $notificationService)
    {
        $this->easyPostService = $easyPostService;
        $this->notificationService = $notificationService;
    }

    /**
     * Process tracking update from webhook or manual check
     */
    public function processTrackingUpdate(array $trackingData, string $source = 'webhook'): bool
    {
        try {
            $trackingCode = $trackingData['tracking_code'] ?? null;
            
            if (!$trackingCode) {
                Log::warning('Tracking update received without tracking code', ['data' => $trackingData]);
                return false;
            }

            // Find order by tracking code
            $order = Order::where('tracking_code', $trackingCode)->first();
            
            if (!$order) {
                Log::warning('Order not found for tracking code', ['tracking_code' => $trackingCode]);
                return false;
            }

            // Extract tracking details
            $trackingDetails = $trackingData['tracking_details'] ?? [];
            $status = $trackingData['status'] ?? 'unknown';
            $carrier = $trackingData['carrier'] ?? $order->carrier;

            // Update order delivery status
            $order->update([
                'delivery_status' => $status,
                'last_tracking_update' => now(),
            ]);

            // Process each tracking detail/event
            foreach ($trackingDetails as $detail) {
                $this->createTrackingEvent($order, $detail, $carrier, $source);
            }

            // If no tracking details, create a single event
            if (empty($trackingDetails)) {
                $this->createTrackingEvent($order, [
                    'status' => $status,
                    'message' => $trackingData['message'] ?? 'Tracking status updated',
                    'datetime' => $trackingData['updated_at'] ?? now(),
                ], $carrier, $source);
            }

            // Send notifications based on status
            $this->sendTrackingNotifications($order, $status);

            // Alert admin if delivered
            if ($status === 'delivered') {
                $this->alertAdminOfDelivery($order);
            }

            Log::info('Tracking update processed successfully', [
                'order_id' => $order->id,
                'tracking_code' => $trackingCode,
                'status' => $status,
                'source' => $source,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to process tracking update', [
                'tracking_data' => $trackingData,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return false;
        }
    }

    /**
     * Create a tracking event
     */
    protected function createTrackingEvent(Order $order, array $detail, string $carrier, string $source): void
    {
        $status = $detail['status'] ?? 'unknown';
        $message = $detail['message'] ?? $detail['description'] ?? 'Status update';
        $occurredAt = $detail['datetime'] ?? $detail['occurred_at'] ?? now();

        // Check if event already exists to avoid duplicates
        $exists = ShipmentTrackingEvent::where('order_id', $order->id)
            ->where('status', $status)
            ->where('occurred_at', $occurredAt)
            ->exists();

        if ($exists) {
            return;
        }

        $trackingEvent = ShipmentTrackingEvent::create([
            'order_id' => $order->id,
            'tracking_code' => $order->tracking_code,
            'status' => $status,
            'message' => $message,
            'location' => $this->formatLocation($detail),
            'carrier' => $carrier,
            'carrier_status_code' => $detail['status_code'] ?? null,
            'carrier_status_detail' => $detail['status_detail'] ?? null,
            'occurred_at' => $occurredAt,
            'source' => $source,
            'raw_data' => $detail,
        ]);

        // Broadcast the tracking update event
        broadcast(new OrderTrackingUpdated($order, $trackingEvent));
    }

    /**
     * Format location from tracking detail
     */
    protected function formatLocation(array $detail): ?string
    {
        $parts = array_filter([
            $detail['city'] ?? null,
            $detail['state'] ?? null,
            $detail['zip'] ?? null,
        ]);

        return !empty($parts) ? implode(', ', $parts) : null;
    }

    /**
     * Send tracking notifications to customer
     */
    protected function sendTrackingNotifications(Order $order, string $status): void
    {
        try {
            $user = $order->user;
            
            if (!$user) {
                return;
            }

            // Get human-readable status
            $statusLabels = [
                'pre_transit' => 'Label Created',
                'in_transit' => 'In Transit',
                'out_for_delivery' => 'Out for Delivery',
                'delivered' => 'Delivered',
                'available_for_pickup' => 'Available for Pickup',
                'return_to_sender' => 'Return to Sender',
                'failure' => 'Delivery Failed',
            ];

            $statusLabel = $statusLabels[$status] ?? ucwords(str_replace('_', ' ', $status));

            // Create notification
            $this->notificationService->create(
                'order_tracking_update',
                "Order {$statusLabel}",
                "Your order #{$order->order_number} is now {$statusLabel}",
                $user->id,
                'medium',
                [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'tracking_code' => $order->tracking_code,
                    'status' => $status,
                    'status_label' => $statusLabel,
                ],
                route('orders.show', $order->id),
                'View Order',
                '📦'
            );

            // Send email notification
            $latestEvent = $order->trackingEvents()->latest('occurred_at')->first();
            if ($latestEvent) {
                Mail::to($user->email)->send(new OrderTrackingUpdateMail($order, $user, $latestEvent));
            }

            Log::info('Tracking notification sent', [
                'order_id' => $order->id,
                'user_id' => $user->id,
                'status' => $status,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send tracking notification', [
                'order_id' => $order->id,
                'status' => $status,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Alert admin when order is delivered
     */
    protected function alertAdminOfDelivery(Order $order): void
    {
        try {
            // Get all admin users
            $admins = User::where('role', 'admin')->get();

            foreach ($admins as $admin) {
                $this->notificationService->create(
                    'order_delivered_admin_alert',
                    'Order Delivered - Action Required',
                    "Order #{$order->order_number} has been delivered. Please verify and update order status.",
                    $admin->id,
                    'high',
                    [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'tracking_code' => $order->tracking_code,
                        'customer_name' => $order->user->name ?? 'Unknown',
                    ],
                    route('admin.orders.show', $order->id),
                    'Review Order',
                    '🚚',
                    'blue'
                );
            }

            Log::info('Admin delivery alert sent', [
                'order_id' => $order->id,
                'admin_count' => $admins->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to alert admin of delivery', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Manually refresh tracking for an order
     */
    public function refreshTracking(Order $order): array
    {
        try {
            if (!$order->tracking_code) {
                return [
                    'success' => false,
                    'message' => 'No tracking code available for this order',
                ];
            }

            // Get tracking info from EasyPost
            $trackingResult = $this->easyPostService->trackShipment($order->tracking_code);

            if (!$trackingResult['success']) {
                return $trackingResult;
            }

            // Process the tracking update
            $this->processTrackingUpdate($trackingResult, 'manual_check');

            return [
                'success' => true,
                'message' => 'Tracking information updated successfully',
                'tracking_details' => $trackingResult['tracking_details'] ?? [],
                'status' => $trackingResult['status'] ?? 'unknown',
            ];

        } catch (\Exception $e) {
            Log::error('Manual tracking refresh failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to refresh tracking information',
            ];
        }
    }

    /**
     * Get tracking timeline for an order
     */
    public function getTrackingTimeline(Order $order): array
    {
        $events = $order->trackingEvents()
            ->orderBy('occurred_at', 'asc')
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'status' => $event->status,
                    'status_label' => $event->status_label,
                    'message' => $event->message,
                    'location' => $event->location,
                    'occurred_at' => $event->occurred_at->format('M d, Y g:i A'),
                    'is_delivered' => $event->isDelivered(),
                    'is_failure' => $event->isFailure(),
                ];
            });

        return [
            'tracking_code' => $order->tracking_code,
            'carrier' => $order->carrier,
            'service' => $order->service,
            'current_status' => $order->delivery_status,
            'estimated_delivery_date' => $order->estimated_delivery_date,
            'last_update' => $order->last_tracking_update?->format('M d, Y g:i A'),
            'events' => $events,
        ];
    }
}

