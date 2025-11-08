<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Events\NotificationCreated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class NotificationService
{
    /**
     * Create a new notification
     */
    public function create(
        string $type,
        string $title,
        string $message,
        ?int $userId = null,
        string $priority = 'medium',
        ?array $data = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?string $icon = null,
        ?string $color = null,
        ?\DateTime $expiresAt = null
    ): Notification {
        // If notifications table follows Laravel default (no "title"), store as Database Notification
        $hasTitle = Schema::hasColumn('notifications', 'title');
        $hasNotifiable = Schema::hasColumn('notifications', 'notifiable_type') && Schema::hasColumn('notifications', 'notifiable_id');

        if (!$hasTitle && $hasNotifiable) {
            $id = (string) \Illuminate\Support\Str::uuid();
            $dataJson = [
                'title' => $title,
                'message' => $message,
                'priority' => $priority,
                'action_url' => $actionUrl,
                'action_text' => $actionText,
                'icon' => $icon,
                'color' => $color,
                'meta' => $data,
            ];

            \DB::table('notifications')->insert([
                'id' => $id,
                'type' => $type,
                'notifiable_type' => User::class,
                'notifiable_id' => $userId,
                'data' => json_encode($dataJson),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Attempt to load via model for return type
            return Notification::query()->where('id', $id)->firstOrFail();
        }

        $payload = [
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'user_id' => $userId,
        ];

        if ($expiresAt) {
            $payload['expires_at'] = $expiresAt;
        }
        if (Schema::hasColumn('notifications', 'status')) {
            $payload['status'] = 'unread';
        }
        // Only include columns that exist on the notifications table
        if (Schema::hasColumn('notifications', 'priority')) {
            $payload['priority'] = $priority;
        }
        if (Schema::hasColumn('notifications', 'action_url')) {
            $payload['action_url'] = $actionUrl;
        }
        if (Schema::hasColumn('notifications', 'action_text')) {
            $payload['action_text'] = $actionText;
        }
        if (Schema::hasColumn('notifications', 'icon')) {
            $payload['icon'] = $icon;
        }
        if (Schema::hasColumn('notifications', 'color')) {
            $payload['color'] = $color;
        }

        $notification = Notification::create($payload);

        // Broadcast the notification
        try {
            broadcast(new NotificationCreated($notification));
        } catch (\Exception $e) {
            Log::warning('Failed to broadcast notification', [
                'notification_id' => $notification->id,
                'error' => $e->getMessage()
            ]);
        }

        Log::info('Notification created', [
            'id' => $notification->id,
            'type' => $type,
            'user_id' => $userId,
            'title' => $title,
        ]);

        return $notification;
    }

    /**
     * Create order notification
     */
    public function createOrderNotification(
        string $orderId,
        string $status,
        int $userId,
        ?string $actionUrl = null
    ): ?Notification {
        $statusMessages = [
            'pending' => 'Your order is being processed',
            'confirmed' => 'Your order has been confirmed',
            'shipped' => 'Your order has been shipped',
            'delivered' => 'Your order has been delivered',
            'cancelled' => 'Your order has been cancelled',
            'refunded' => 'Your order has been refunded',
        ];

        $priorityMap = [
            'cancelled' => 'high',
            'refunded' => 'high',
            'delivered' => 'medium',
            'shipped' => 'medium',
            'confirmed' => 'low',
            'pending' => 'low',
        ];

        return $this->createWithPreferenceCheck(
            'order',
            "Order #{$orderId} - " . ucfirst($status),
            $statusMessages[$status] ?? "Your order status has been updated to {$status}",
            $userId,
            $priorityMap[$status] ?? 'medium',
            ['order_id' => $orderId, 'status' => $status],
            $actionUrl ?? "/orders/{$orderId}",
            'View Order',
            '📦',
            'blue'
        );
    }

    /**
     * Create product notification
     */
    public function createProductNotification(
        string $productId,
        string $productName,
        int $userId,
        ?string $actionUrl = null
    ): Notification {
        return $this->create(
            'product',
            "{$productName} is back in stock!",
            "The product you were interested in is now available for purchase",
            $userId,
            'medium',
            ['product_id' => $productId, 'product_name' => $productName],
            $actionUrl ?? "/products/{$productId}",
            'View Product',
            '🛍️',
            'green'
        );
    }

    /**
     * Create promotion notification
     */
    public function createPromotionNotification(
        string $promotionId,
        string $title,
        string $description,
        int $userId,
        ?string $actionUrl = null
    ): Notification {
        return $this->create(
            'promotion',
            $title,
            $description,
            $userId,
            'medium',
            ['promotion_id' => $promotionId],
            $actionUrl ?? "/promotions/{$promotionId}",
            'View Offer',
            '🎉',
            'purple'
        );
    }

    /**
     * Create security notification
     */
    public function createSecurityNotification(
        string $alertType,
        string $description,
        int $userId,
        ?string $actionUrl = null
    ): Notification {
        return $this->create(
            'security',
            'Security Alert',
            $description,
            $userId,
            'urgent',
            ['alert_type' => $alertType],
            $actionUrl ?? '/security',
            'Secure Account',
            '🔒',
            'red'
        );
    }

    /**
     * Create inventory notification
     */
    public function createInventoryNotification(
        string $productId,
        string $productName,
        int $currentStock,
        int $threshold,
        int $userId,
        ?string $actionUrl = null
    ): Notification {
        return $this->create(
            'inventory',
            "Low Stock Alert - {$productName}",
            "Stock level is {$currentStock}, below threshold of {$threshold}",
            $userId,
            'high',
            [
                'product_id' => $productId,
                'product_name' => $productName,
                'current_stock' => $currentStock,
                'threshold' => $threshold,
            ],
            $actionUrl ?? "/products/{$productId}",
            'Manage Inventory',
            '📊',
            'orange'
        );
    }

    /**
     * Create delivery notification
     */
    public function createDeliveryNotification(
        string $orderId,
        string $status,
        int $userId,
        ?string $trackingNumber = null,
        ?string $actionUrl = null
    ): Notification {
        $statusMessages = [
            'picked_up' => 'Your order has been picked up',
            'in_transit' => 'Your order is in transit',
            'out_for_delivery' => 'Your order is out for delivery',
            'delivered' => 'Your order has been delivered',
            'delivery_failed' => 'Delivery attempt failed',
        ];

        return $this->create(
            'delivery',
            "Delivery Update - Order #{$orderId}",
            $statusMessages[$status] ?? "Delivery status updated to {$status}",
            $userId,
            'medium',
            [
                'order_id' => $orderId,
                'status' => $status,
                'tracking_number' => $trackingNumber,
            ],
            $actionUrl ?? "/orders/{$orderId}/tracking",
            'Track Delivery',
            '🚚',
            'blue'
        );
    }

    /**
     * Create payment notification
     */
    public function createPaymentNotification(
        string $paymentId,
        string $status,
        float $amount,
        string $currency,
        int $userId,
        ?string $actionUrl = null
    ): Notification {
        $statusMessages = [
            'pending' => 'Payment is being processed',
            'completed' => 'Payment completed successfully',
            'failed' => 'Payment failed',
            'refunded' => 'Payment has been refunded',
        ];

        return $this->create(
            'payment',
            'Payment ' . ucfirst($status),
            ($statusMessages[$status] ?? "Payment status updated to {$status}") . " - {$currency} {$amount}",
            $userId,
            $status === 'failed' ? 'high' : 'medium',
            [
                'payment_id' => $paymentId,
                'status' => $status,
                'amount' => $amount,
                'currency' => $currency,
            ],
            $actionUrl ?? "/payments/{$paymentId}",
            'View Payment',
            '💳',
            'green'
        );
    }

    /**
     * Create review notification
     */
    public function createReviewNotification(
        string $reviewId,
        string $productName,
        int $rating,
        int $userId,
        ?string $actionUrl = null
    ): Notification {
        return $this->create(
            'review',
            "New Review for {$productName}",
            "You received a {$rating}-star review",
            $userId,
            'low',
            [
                'review_id' => $reviewId,
                'product_name' => $productName,
                'rating' => $rating,
            ],
            $actionUrl ?? "/reviews/{$reviewId}",
            'View Review',
            '⭐',
            'yellow'
        );
    }

    /**
     * Create system notification
     */
    public function createSystemNotification(
        string $title,
        string $message,
        int $userId,
        string $priority = 'low',
        ?string $actionUrl = null
    ): Notification {
        return $this->create(
            'system',
            $title,
            $message,
            $userId,
            $priority,
            [],
            $actionUrl,
            'View Details',
            '⚙️',
            'gray'
        );
    }

    /**
     * Create customer notification
     */
    public function createCustomerNotification(
        string $title,
        string $message,
        int $userId,
        string $priority = 'low',
        ?string $actionUrl = null
    ): Notification {
        return $this->create(
            'customer',
            $title,
            $message,
            $userId,
            $priority,
            [],
            $actionUrl,
            'View Customer',
            '👤',
            'blue'
        );
    }

    /**
     * Bulk create notifications for multiple users
     */
    public function createBulk(
        array $userIds,
        string $type,
        string $title,
        string $message,
        string $priority = 'medium',
        ?array $data = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?string $icon = null,
        ?string $color = null
    ): array {
        $notifications = [];

        foreach ($userIds as $userId) {
            $notifications[] = $this->create(
                $type,
                $title,
                $message,
                $userId,
                $priority,
                $data,
                $actionUrl,
                $actionText,
                $icon,
                $color
            );
        }

        return $notifications;
    }

    /**
     * Clean up expired notifications
     */
    public function cleanupExpired(): int
    {
        return Notification::where('expires_at', '<', now())->delete();
    }

    /**
     * Check if user has enabled notifications for a specific type
     */
    public function isNotificationEnabled(int $userId, string $type): bool
    {
        $user = User::find($userId);
        
        if (!$user) {
            return false;
        }

        // Check if user has notification preferences
        $preferences = $user->notification_preferences ?? [];
        
        // If no preferences set, default to enabled
        if (empty($preferences)) {
            return true;
        }

        // Check if this notification type is enabled
        return $preferences[$type] ?? true;
    }

    /**
     * Update user notification preferences
     */
    public function updatePreferences(int $userId, array $preferences): bool
    {
        $user = User::find($userId);
        
        if (!$user) {
            return false;
        }

        // Validate preference keys
        $validTypes = [
            'order', 'product', 'promotion', 'security', 
            'delivery', 'payment', 'review', 'system', 'customer'
        ];

        $filteredPreferences = [];
        foreach ($preferences as $type => $enabled) {
            if (in_array($type, $validTypes)) {
                $filteredPreferences[$type] = (bool) $enabled;
            }
        }

        $user->notification_preferences = $filteredPreferences;
        return $user->save();
    }

    /**
     * Get user notification preferences
     */
    public function getPreferences(int $userId): array
    {
        $user = User::find($userId);
        
        if (!$user) {
            return [];
        }

        // Return preferences or default all enabled
        return $user->notification_preferences ?? [
            'order' => true,
            'product' => true,
            'promotion' => true,
            'security' => true,
            'delivery' => true,
            'payment' => true,
            'review' => true,
            'system' => true,
            'customer' => true,
        ];
    }

    /**
     * Create notification with preference check
     */
    public function createWithPreferenceCheck(
        string $type,
        string $title,
        string $message,
        ?int $userId = null,
        string $priority = 'medium',
        ?array $data = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?string $icon = null,
        ?string $color = null,
        ?\DateTime $expiresAt = null
    ): ?Notification {
        // Check if user has this notification type enabled
        if ($userId && !$this->isNotificationEnabled($userId, $type)) {
            Log::info('Notification skipped due to user preferences', [
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
            ]);
            return null;
        }

        return $this->create(
            $type,
            $title,
            $message,
            $userId,
            $priority,
            $data,
            $actionUrl,
            $actionText,
            $icon,
            $color,
            $expiresAt
        );
    }

    /**
     * Send notification to all admin users
     */
    public function sendAdminNotification(
        string $title,
        string $message,
        string $type = 'admin_alert',
        string $priority = 'high',
        ?array $data = null,
        ?string $actionUrl = null,
        ?string $actionText = null
    ): int {
        // Get all admin and super_admin users
        $admins = User::whereIn('role', ['admin', 'super_admin'])
            ->where('is_active', true)
            ->get();

        $notificationCount = 0;

        foreach ($admins as $admin) {
            try {
                $this->create(
                    type: $type,
                    title: $title,
                    message: $message,
                    userId: $admin->id,
                    priority: $priority,
                    data: $data,
                    actionUrl: $actionUrl,
                    actionText: $actionText,
                    icon: 'alert-triangle',
                    color: 'red'
                );
                $notificationCount++;
            } catch (\Exception $e) {
                Log::error('Failed to send admin notification', [
                    'admin_id' => $admin->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Admin notifications sent', [
            'title' => $title,
            'recipients' => $notificationCount,
        ]);

        return $notificationCount;
    }
}
