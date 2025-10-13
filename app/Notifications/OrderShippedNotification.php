<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderShippedNotification extends Notification
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
        $trackingInfo = '';
        if ($this->order->tracking_code) {
            $trackingInfo = "\n\n**Tracking Information:**\nTracking Code: " . $this->order->tracking_code;
            if ($this->order->carrier) {
                $trackingInfo .= "\nCarrier: " . $this->order->carrier;
            }
        }

        return (new MailMessage)
            ->subject('Your Order is on the Way! - ' . $this->order->order_number)
            ->greeting('Great news!')
            ->line('Your order has been shipped and is on its way to you.')
            ->line('**Shipping Details:**')
            ->line('Order Number: ' . $this->order->order_number)
            ->line('Delivery Address: ' . $this->order->delivery_address)
            ->line('Estimated Delivery: ' . $this->order->delivery_time_estimate . ' minutes')
            ->line($trackingInfo)
            ->action('Track Your Order', url('/orders/' . $this->order->id))
            ->line('Please ensure someone is available to receive the delivery.')
            ->line('If you have any questions about your delivery, please contact our support team.')
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
            'tracking_code' => $this->order->tracking_code,
            'carrier' => $this->order->carrier,
        ];
    }
}
