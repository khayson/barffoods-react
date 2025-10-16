<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\ShipmentTrackingEvent;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderTrackingUpdateMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $order;
    public $user;
    public $trackingEvent;
    public $trackingEvents;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order, User $user, ShipmentTrackingEvent $trackingEvent, $trackingEvents = null)
    {
        $this->order = $order;
        $this->user = $user;
        $this->trackingEvent = $trackingEvent;
        $this->trackingEvents = $trackingEvents ?? $order->trackingEvents()->orderBy('occurred_at', 'desc')->get();
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $status = ucwords(str_replace('_', ' ', $this->trackingEvent->status));
        return new Envelope(
            subject: "Order #{$this->order->order_number} - {$status}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.order-tracking-update',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
