<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;
    protected $oldStatus;
    protected $newStatus;

    public function __construct(Order $order, string $oldStatus, string $newStatus)
    {
        $this->order = $order;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        $statusMessages = [
            'pending' => 'Your order is pending confirmation.',
            'confirmed' => 'Your order has been confirmed and is being prepared.',
            'processing' => 'Your order is being processed.',
            'ready' => 'Your order is ready for shipment.',
            'shipped' => 'Your order has been shipped!',
            'delivered' => 'Your order has been delivered!',
            'cancelled' => 'Your order has been cancelled.',
        ];

        $message = (new MailMessage)
            ->subject('Order Status Update - ' . $this->order->order_number)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Your order status has been updated.')
            ->line('Order Number: ' . $this->order->order_number)
            ->line('New Status: ' . ucfirst($this->newStatus));

        if (isset($statusMessages[$this->newStatus])) {
            $message->line($statusMessages[$this->newStatus]);
        }

        if ($this->newStatus === 'shipped' && $this->order->tracking_code) {
            $message->line('Tracking Number: ' . $this->order->tracking_code)
                    ->line('Carrier: ' . $this->order->carrier);
        }

        return $message->action('View Order', url('/orders/' . $this->order->id))
                       ->line('Thank you for your order!');
    }

    public function toArray($notifiable)
    {
        return [
            'title' => 'Order Status Updated',
            'message' => 'Order #' . $this->order->order_number . ' is now ' . ucfirst($this->newStatus),
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'action_url' => '/orders/' . $this->order->id,
            'type' => 'order_status_updated'
        ];
    }
}
