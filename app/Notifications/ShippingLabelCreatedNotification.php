<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ShippingLabelCreatedNotification extends Notification implements ShouldQueue
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
        $message = (new MailMessage)
            ->subject('Your Order is Ready to Ship - ' . $this->order->order_number)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Great news! Your order is ready to ship.')
            ->line('Order Number: ' . $this->order->order_number);

        if ($this->order->tracking_code) {
            $message->line('Tracking Number: ' . $this->order->tracking_code);
        }

        if ($this->order->carrier) {
            $message->line('Carrier: ' . $this->order->carrier);
        }

        if ($this->order->service) {
            $message->line('Service: ' . $this->order->service);
        }

        if ($this->order->estimated_delivery_date) {
            $message->line('Estimated Delivery: ' . $this->order->estimated_delivery_date->format('M d, Y'));
        }

        return $message->action('Track Your Order', url('/orders/' . $this->order->id))
                       ->line('You will receive another notification when your order ships.');
    }

    public function toArray($notifiable)
    {
        return [
            'title' => 'Shipping Label Created',
            'message' => 'Your order #' . $this->order->order_number . ' is ready to ship.',
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'tracking_code' => $this->order->tracking_code,
            'carrier' => $this->order->carrier,
            'action_url' => '/orders/' . $this->order->id,
            'type' => 'shipping_label_created'
        ];
    }
}
