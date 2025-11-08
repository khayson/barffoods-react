<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class PaymentTimeoutNotification extends Notification
{
    use Queueable;

    protected $payment;

    public function __construct($payment)
    {
        $this->payment = $payment;
    }

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Payment Processing Timeout')
            ->line('Your payment processing has timed out.')
            ->line('Please try again or contact support if the issue persists.')
            ->action('Try Again', url('/checkout'))
            ->line('Thank you for your patience!');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'payment_timeout',
            'message' => 'Your payment processing has timed out. Please try again.',
            'idempotency_key' => $this->payment->idempotency_key,
        ];
    }
}
