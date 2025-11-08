<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BackupCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        private string $filename,
        private int $size
    ) {}

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
        $sizeInMb = round($this->size / 1024 / 1024, 2);
        
        return (new MailMessage)
            ->subject('Database Backup Completed Successfully')
            ->line('The scheduled database backup has been completed successfully.')
            ->line("Backup file: {$this->filename}")
            ->line("Size: {$sizeInMb} MB")
            ->line('The backup has been stored locally and uploaded to cloud storage.')
            ->line('Thank you for maintaining system reliability!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'backup_completed',
            'filename' => $this->filename,
            'size' => $this->size,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
