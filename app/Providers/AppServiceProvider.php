<?php

namespace App\Providers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
        \App\Models\Product::observe(\App\Observers\ProductObserver::class);
        \App\Models\Category::observe(\App\Observers\CategoryObserver::class);
        \App\Models\Store::observe(\App\Observers\StoreObserver::class);

        // Configure slow query logging
        $this->configureSlowQueryLogging();
    }

    /**
     * Configure slow query logging to detect performance issues.
     */
    protected function configureSlowQueryLogging(): void
    {
        // Only enable in non-production or when explicitly enabled
        if (config('app.env') !== 'production' || config('database.log_slow_queries', false)) {
            DB::listen(function ($query) {
                // Log queries that take longer than 1000ms (1 second)
                $threshold = config('database.slow_query_threshold', 1000);
                
                if ($query->time > $threshold) {
                    Log::channel('performance')->warning('Slow query detected', [
                        'sql' => $query->sql,
                        'bindings' => $query->bindings,
                        'time' => $query->time . 'ms',
                        'threshold' => $threshold . 'ms',
                        'connection' => $query->connectionName,
                        'url' => request()->fullUrl(),
                        'user_id' => auth()->id(),
                        'ip' => request()->ip(),
                    ]);
                }
            });
        }

        // Log all queries in local environment for debugging (optional)
        if (config('app.env') === 'local' && config('database.log_all_queries', false)) {
            DB::listen(function ($query) {
                Log::channel('performance')->debug('Query executed', [
                    'sql' => $query->sql,
                    'bindings' => $query->bindings,
                    'time' => $query->time . 'ms',
                ]);
            });
        }
    }
}
