<?php

namespace App\Observers;

use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class ProductObserver
{
    /**
     * Handle the Product "created" event.
     */
    public function created(Product $product): void
    {
        $this->clearProductCaches();
    }

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        $this->clearProductCaches();
        
        // Clear specific product cache if it exists
        Cache::forget("product_{$product->id}");
    }

    /**
     * Handle the Product "deleted" event.
     */
    public function deleted(Product $product): void
    {
        $this->clearProductCaches();
        Cache::forget("product_{$product->id}");
    }

    /**
     * Handle the Product "restored" event.
     */
    public function restored(Product $product): void
    {
        $this->clearProductCaches();
    }

    /**
     * Handle the Product "force deleted" event.
     */
    public function forceDeleted(Product $product): void
    {
        $this->clearProductCaches();
        Cache::forget("product_{$product->id}");
    }
    
    /**
     * Clear all product-related caches
     */
    private function clearProductCaches(): void
    {
        Cache::forget('products_browse');
        Cache::forget('categories_active');
        Cache::forget('stores_active');
    }
}
