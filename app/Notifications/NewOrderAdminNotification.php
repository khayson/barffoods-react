<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewOrderAdminNotification extends Notification
{
    use Queueable;

    public $order;

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
        return (new MailMessage)
            ->subject('New Order Received - ' . $this->order->order_number)
            ->greeting('New Order Alert!')
            ->line('A new order has been placed and requires your attention.')
            ->line('**Order Details:**')
            ->line('Order Number: ' . $this->order->order_number)
            ->line('Customer: ' . $this->order->user->name . ' (' . $this->order->user->email . ')')
            ->line('Total Amount: $' . number_format($this->order->total_amount, 2))
            ->line('Delivery Address: ' . $this->order->delivery_address)
            ->line('Store: ' . $this->order->store->name)
            ->action('View Order Details', url('/admin/orders/' . $this->order->id))
            ->line('Please process this order as soon as possible.')
            ->salutation('BarfFoods Admin System');
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
            'total_amount' => $this->order->total_amount,
            'store_name' => $this->order->store->name,
            'type' => 'new_order',
        ];
    }
}
