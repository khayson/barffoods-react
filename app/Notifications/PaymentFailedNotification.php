<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentFailedNotification extends Notification implements ShouldQueue
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
            ->subject('Payment Failed - Order #' . $this->order->id)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('We were unable to process your payment.')
            ->line('Order Details:')
            ->line('Order ID: #' . $this->order->id)
            ->line('Amount: $' . number_format($this->paymentTransaction->amount, 2))
            ->line('Payment Method: ' . ucfirst($this->paymentTransaction->payment_method))
            ->line('Please try again or contact your bank if the issue persists.')
            ->action('Retry Payment', url('/orders/' . $this->order->id . '/payment'))
            ->line('If you need assistance, please contact our support team.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'payment_failed',
            'order_id' => $this->order->id,
            'amount' => $this->paymentTransaction->amount,
            'payment_method' => $this->paymentTransaction->payment_method,
            'message' => 'Your payment of $' . number_format($this->paymentTransaction->amount, 2) . ' could not be processed.',
        ];
    }
}
