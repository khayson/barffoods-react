<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('New Order Received - ' . $this->order->order_number)
            ->greeting('Hello Admin!')
            ->line('A new order has been placed.')
            ->line('Order Number: ' . $this->order->order_number)
            ->line('Customer: ' . $this->order->user->name)
            ->line('Total: $' . number_format($this->order->total_amount, 2))
            ->line('Items: ' . $this->order->orderItems->count())
            ->action('View Order', url('/admin/orders/' . $this->order->id))
            ->line('Please process this order as soon as possible.');
    }

    public function toArray($notifiable)
    {
        return [
            'title' => 'New Order Received',
            'message' => 'Order #' . $this->order->order_number . ' from ' . $this->order->user->name,
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'customer_name' => $this->order->user->name,
            'total_amount' => $this->order->total_amount,
            'action_url' => '/admin/orders/' . $this->order->id,
            'type' => 'new_order'
        ];
    }
}
