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
