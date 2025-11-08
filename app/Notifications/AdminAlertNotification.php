<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class AdminAlertNotification extends Notification
{
    use Queueable;

    protected $subject;
    protected $message;

    public function __construct(string $subject, string $message)
    {
        $this->subject = $subject;
        $this->message = $message;
    }

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('[Admin Alert] ' . $this->subject)
            ->line($this->message)
            ->action('View Admin Dashboard', url('/admin/dashboard'))
            ->line('This is an automated admin alert.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'admin_alert',
            'subject' => $this->subject,
            'message' => $this->message,
        ];
    }
}
