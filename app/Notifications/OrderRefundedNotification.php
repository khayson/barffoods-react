<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class OrderRefundedNotification extends Notification
{
    use Queueable;

    protected $order;

    public function __construct($order)
    {
        $this->order = $order;
    }

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Order Refunded - Order #' . $this->order->order_number)
            ->line('Your order #' . $this->order->order_number . ' has been refunded.')
            ->line('Amount: $' . number_format($this->order->total_amount, 2))
            ->line('The refund will appear in your account within 5-10 business days.')
            ->action('View Order', url('/orders/' . $this->order->id))
            ->line('If you have any questions, please contact our support team.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'order_refunded',
            'message' => 'Your order #' . $this->order->order_number . ' has been refunded.',
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'amount' => $this->order->total_amount,
        ];
    }
}
