<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\SyncOrderTrackingJob;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule tracking sync every 6 hours
Schedule::job(new SyncOrderTrackingJob)->everySixHours()->name('sync-order-tracking');

// Schedule daily database backups at 2:00 AM with verification
Schedule::command('backup:database --verify')
    ->dailyAt('02:00')
    ->name('daily-database-backup')
    ->onSuccess(function () {
        Log::info('Daily database backup completed successfully');
    })
    ->onFailure(function () {
        Log::error('Daily database backup failed');
        
        // Notify admins of backup failure
        $admins = \App\Models\User::where('role', 'super_admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\BackupFailedNotification());
        }
    });

// Schedule monthly backup on the 1st of each month at 3:00 AM
Schedule::command('backup:database --verify')
    ->monthlyOn(1, '03:00')
    ->name('monthly-database-backup')
    ->onSuccess(function () {
        Log::info('Monthly database backup completed successfully');
    });

// Process queued jobs every minute (for refunds, notifications, etc.)
Schedule::command('queue:work --stop-when-empty --max-time=50')
    ->everyMinute()
    ->name('process-queue')
    ->withoutOverlapping()
    ->runInBackground();

// Clean up old anonymous carts (older than 7 days)
Schedule::call(function () {
    $deleted = \App\Models\AnonymousCart::where('last_accessed_at', '<', now()->subDays(7))->delete();
    Log::info('Cleaned up old anonymous carts', ['deleted_count' => $deleted]);
})->daily()->name('cleanup-anonymous-carts');

// Clean up expired payment idempotency records (older than 30 days)
Schedule::call(function () {
    $deleted = \App\Models\PaymentIdempotency::where('expires_at', '<', now()->subDays(30))->delete();
    Log::info('Cleaned up expired payment idempotency records', ['deleted_count' => $deleted]);
})->daily()->name('cleanup-payment-idempotency');

// Clean up old sessions (older than 30 days)
Schedule::command('session:gc')
    ->daily()
    ->name('cleanup-sessions');

// Monitor failed jobs and alert admins
Schedule::call(function () {
    $failedJobsCount = \DB::table('failed_jobs')->count();
    
    if ($failedJobsCount > 10) {
        Log::warning('High number of failed jobs detected', ['count' => $failedJobsCount]);
        
        // Notify admins
        $admins = \App\Models\User::where('role', 'super_admin')->get();
        foreach ($admins as $admin) {
            try {
                \App\Services\NotificationService::create(
                    userId: $admin->id,
                    type: 'system_alert',
                    title: 'High Failed Jobs Count',
                    message: "There are {$failedJobsCount} failed jobs in the queue. Please review.",
                    data: ['failed_jobs_count' => $failedJobsCount]
                );
            } catch (\Exception $e) {
                Log::error('Failed to send failed jobs notification', ['error' => $e->getMessage()]);
            }
        }
    }
})->hourly()->name('monitor-failed-jobs');

// Retry failed refund jobs (up to 3 times)
Schedule::call(function () {
    $failedRefunds = \DB::table('failed_jobs')
        ->where('payload', 'like', '%ProcessRefundJob%')
        ->where('failed_at', '>', now()->subHours(24))
        ->get();
    
    foreach ($failedRefunds as $failedJob) {
        try {
            // Retry the job
            Artisan::call('queue:retry', ['id' => $failedJob->id]);
            Log::info('Retrying failed refund job', ['job_id' => $failedJob->id]);
        } catch (\Exception $e) {
            Log::error('Failed to retry refund job', [
                'job_id' => $failedJob->id,
                'error' => $e->getMessage()
            ]);
        }
    }
})->everyThreeHours()->name('retry-failed-refunds');
