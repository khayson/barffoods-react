<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;
    protected $paymentTransaction;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order, PaymentTransaction $paymentTransaction)
    {
        $this->order = $order;
        $this->paymentTransaction = $paymentTransaction;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Payment Confirmed - Order #' . $this->order->id)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Your payment has been successfully processed.')
            ->line('Order Details:')
            ->line('Order ID: #' . $this->order->id)
            ->line('Amount: $' . number_format($this->paymentTransaction->amount, 2))
            ->line('Payment Method: ' . ucfirst($this->paymentTransaction->payment_method))
            ->line('Thank you for your order!')
            ->action('View Order', url('/orders/' . $this->order->id))
            ->line('If you have any questions, please contact our support team.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'payment_completed',
            'order_id' => $this->order->id,
            'amount' => $this->paymentTransaction->amount,
            'payment_method' => $this->paymentTransaction->payment_method,
            'message' => 'Your payment of $' . number_format($this->paymentTransaction->amount, 2) . ' has been confirmed.',
        ];
    }
}
