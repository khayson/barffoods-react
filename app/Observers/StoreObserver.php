<?php

namespace App\Observers;

use App\Models\Store;
use Illuminate\Support\Facades\Cache;

class StoreObserver
{
    /**
     * Handle the Store "created" event.
     */
    public function created(Store $store): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the Store "updated" event.
     */
    public function updated(Store $store): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the Store "deleted" event.
     */
    public function deleted(Store $store): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the Store "restored" event.
     */
    public function restored(Store $store): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the Store "force deleted" event.
     */
    public function forceDeleted(Store $store): void
    {
        $this->clearCaches();
    }
    
    /**
     * Clear store-related caches
     */
    private function clearCaches(): void
    {
        Cache::forget('stores_active');
        Cache::forget('products_browse');
    }
}
