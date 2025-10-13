<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register observers
        \App\Models\PaymentTransaction::observe(\App\Observers\PaymentTransactionObserver::class);
        \App\Models\Order::observe(\App\Observers\OrderObserver::class);
    }
}
