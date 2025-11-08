<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BackupFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct() {}

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
        return (new MailMessage)
            ->error()
            ->subject('⚠️ Database Backup Failed - Immediate Action Required')
            ->line('The scheduled database backup has failed.')
            ->line('This is a critical issue that requires immediate attention.')
            ->line('Please check the application logs for more details.')
            ->action('View System Logs', url('/admin/system-health'))
            ->line('Ensure backups are restored as soon as possible to maintain data protection.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'backup_failed',
            'severity' => 'critical',
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
