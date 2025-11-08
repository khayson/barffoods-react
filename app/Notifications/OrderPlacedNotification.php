<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPlacedNotification extends Notification implements ShouldQueue
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
            ->subject('Order Confirmation - ' . $this->order->order_number)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Thank you for your order!')
            ->line('Your order #' . $this->order->order_number . ' has been placed successfully.')
            ->line('Order Total: $' . number_format($this->order->total_amount, 2))
            ->line('We will send you another email when your order ships.')
            ->action('View Order', url('/orders/' . $this->order->id))
            ->line('Thank you for shopping with us!');
    }

    public function toArray($notifiable)
    {
        return [
            'title' => 'Order Placed Successfully',
            'message' => 'Your order #' . $this->order->order_number . ' has been placed.',
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'total_amount' => $this->order->total_amount,
            'action_url' => '/orders/' . $this->order->id,
            'type' => 'order_placed'
        ];
    }
}
