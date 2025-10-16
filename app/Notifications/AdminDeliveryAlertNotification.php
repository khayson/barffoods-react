<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminDeliveryAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $orderUrl = route('admin.orders.show', $this->order->id);
        
        return (new MailMessage)
            ->subject("🚚 Order #{$this->order->order_number} - Package Delivered")
            ->greeting("Hello {$notifiable->name}!")
            ->line("**IMPORTANT:** A package has been delivered and requires admin verification.")
            ->line("**Order Details:**")
            ->line("• Order Number: #{$this->order->order_number}")
            ->line("• Customer: {$this->order->user->name}")
            ->line("• Customer Email: {$this->order->user->email}")
            ->line("• Tracking Code: {$this->order->tracking_code}")
            ->line("• Carrier: {$this->order->carrier}")
            ->line("• Delivery Status: {$this->order->delivery_status}")
            ->line("• Delivered At: " . now()->format('M d, Y \a\t g:i A'))
            ->line("**Action Required:**")
            ->line("Please verify the delivery and update the order status to 'delivered' in the admin panel.")
            ->action('View Order in Admin Panel', $orderUrl)
            ->line('This is an automated alert from the tracking system.');
    }

    /**
     * Get the database representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'customer_name' => $this->order->user->name,
            'customer_email' => $this->order->user->email,
            'tracking_code' => $this->order->tracking_code,
            'carrier' => $this->order->carrier,
            'delivery_status' => $this->order->delivery_status,
            'delivered_at' => now(),
            'type' => 'delivery_alert',
            'priority' => 'high',
        ];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'customer_name' => $this->order->user->name,
            'customer_email' => $this->order->user->email,
            'tracking_code' => $this->order->tracking_code,
            'carrier' => $this->order->carrier,
            'delivery_status' => $this->order->delivery_status,
            'delivered_at' => now(),
            'type' => 'delivery_alert',
            'priority' => 'high',
        ];
    }
}
