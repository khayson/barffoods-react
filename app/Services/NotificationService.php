<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Events\NotificationCreated;
use Illuminate\Support\Facades\Log;

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
        $notification = Notification::create([
            'type' => $type,
            'priority' => $priority,
            'status' => 'unread',
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'user_id' => $userId,
            'expires_at' => $expiresAt,
            'action_url' => $actionUrl,
            'action_text' => $actionText,
            'icon' => $icon,
            'color' => $color,
        ]);

        // Broadcast the notification
        broadcast(new NotificationCreated($notification));

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
    ): Notification {
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

        return $this->create(
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
}
