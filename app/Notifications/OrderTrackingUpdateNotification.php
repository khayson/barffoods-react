<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\ShipmentTrackingEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderTrackingUpdateNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;
    protected $trackingEvent;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order, ShipmentTrackingEvent $trackingEvent)
    {
        $this->order = $order;
        $this->trackingEvent = $trackingEvent;
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
        $status = ucwords(str_replace('_', ' ', $this->trackingEvent->status));
        $orderUrl = route('orders.show', $this->order->id);
        
        $mailMessage = (new MailMessage)
            ->subject("Order #{$this->order->order_number} - {$status}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("Your order #{$this->order->order_number} has been updated:")
            ->line("**Status:** {$status}")
            ->line("**Message:** {$this->trackingEvent->message}");
            
        if ($this->trackingEvent->location) {
            $mailMessage->line("**Location:** {$this->trackingEvent->location}");
        }
        
        if ($this->trackingEvent->carrier) {
            $mailMessage->line("**Carrier:** {$this->trackingEvent->carrier}");
        }
        
        $mailMessage->line("**Time:** " . $this->trackingEvent->occurred_at->format('M d, Y \a\t g:i A'))
            ->action('View Order Details', $orderUrl)
            ->line('Thank you for choosing our service!');
            
        return $mailMessage;
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
            'tracking_event_id' => $this->trackingEvent->id,
            'status' => $this->trackingEvent->status,
            'message' => $this->trackingEvent->message,
            'location' => $this->trackingEvent->location,
            'carrier' => $this->trackingEvent->carrier,
            'occurred_at' => $this->trackingEvent->occurred_at,
            'type' => 'tracking_update',
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
            'tracking_event_id' => $this->trackingEvent->id,
            'status' => $this->trackingEvent->status,
            'message' => $this->trackingEvent->message,
            'location' => $this->trackingEvent->location,
            'carrier' => $this->trackingEvent->carrier,
            'occurred_at' => $this->trackingEvent->occurred_at,
            'type' => 'tracking_update',
        ];
    }
}
