<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdateMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;
    public string $oldStatus;
    public string $newStatus;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order, string $oldStatus, string $newStatus)
    {
        $this->order = $order;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = "Order #{$this->order->order_number} Status Update - " . ucfirst($this->newStatus);
        
        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.order-status-update',
            with: [
                'order' => $this->order,
                'oldStatus' => $this->oldStatus,
                'newStatus' => $this->newStatus,
                'statusLabels' => $this->getStatusLabels(),
            ]
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }

    /**
     * Get human-readable status labels
     */
    private function getStatusLabels(): array
    {
        return [
            'confirmed' => 'Order Confirmed',
            'processing' => 'Processing',
            'shipped' => 'Shipped',
            'delivered' => 'Delivered',
        ];
    }
}
