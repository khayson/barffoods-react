<?php

namespace App\Events;

use App\Models\Order;
use App\Models\ShipmentTrackingEvent;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderTrackingUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;
    public $trackingEvent;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order, ShipmentTrackingEvent $trackingEvent)
    {
        $this->order = $order;
        $this->trackingEvent = $trackingEvent;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->order->user_id),
            new PrivateChannel('admin.orders'),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'tracking_event' => [
                'id' => $this->trackingEvent->id,
                'status' => $this->trackingEvent->status,
                'message' => $this->trackingEvent->message,
                'location' => $this->trackingEvent->location,
                'carrier' => $this->trackingEvent->carrier,
                'occurred_at' => $this->trackingEvent->occurred_at->toISOString(),
            ],
            'delivery_status' => $this->order->delivery_status,
            'estimated_delivery_date' => $this->order->estimated_delivery_date,
            'last_tracking_update' => $this->order->last_tracking_update?->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'tracking.updated';
    }
}
