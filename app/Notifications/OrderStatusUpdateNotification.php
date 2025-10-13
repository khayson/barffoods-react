<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusUpdateNotification extends Notification
{
    use Queueable;

    public $order;
    public $oldStatus;
    public $newStatus;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order, string $oldStatus, string $newStatus)
    {
        $this->order = $order;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
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
        $statusMessages = [
            'pending' => 'Your order is being processed.',
            'confirmed' => 'Your order has been confirmed and is being prepared.',
            'preparing' => 'Your order is being prepared by our team.',
            'delivered' => 'Your order has been delivered successfully!',
            'cancelled' => 'Your order has been cancelled.',
        ];

        $message = $statusMessages[$this->newStatus] ?? 'Your order status has been updated.';

        return (new MailMessage)
            ->subject('Order Update - ' . $this->order->order_number)
            ->greeting('Order Status Update')
            ->line($message)
            ->line('**Order Details:**')
            ->line('Order Number: ' . $this->order->order_number)
            ->line('Status: ' . ucfirst($this->newStatus))
            ->line('Total Amount: $' . number_format($this->order->total_amount, 2))
            ->action('View Order Details', url('/orders/' . $this->order->id))
            ->line('Thank you for choosing BarfFoods!')
            ->salutation('Best regards, BarfFoods Team');
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
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
        ];
    }
}
