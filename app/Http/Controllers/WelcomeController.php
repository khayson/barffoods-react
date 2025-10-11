<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Store;
use App\Models\Category;

class WelcomeController extends Controller
{
    /**
     * Show the welcome page with location-based data
     */
    public function index(Request $request)
    {
        $userLat = $request->input('latitude', 40.7128);
        $userLng = $request->input('longitude', -74.0060);
        $radius = $request->input('radius', 10); // Reduced to 10 miles

        // Get nearby stores (within radius)
        $nearbyStores = $this->getNearbyStores($userLat, $userLng, $radius);
        
        // Get all stores with distances (for dropdown)
        $allStores = $this->getAllStoresWithDistance($userLat, $userLng);
        
        // Get products from nearby stores, or all products if no nearby stores
        $products = $nearbyStores->isEmpty() 
            ? $this->getAllProducts() 
            : $this->getProductsFromStores($nearbyStores);
        
        // Get all categories
        $categories = $this->getCategories();

        return Inertia::render('welcome', [
            'nearbyStores' => $nearbyStores,
            'allStores' => $allStores,
            'products' => $products,
            'categories' => $categories,
            'userLocation' => [
                'latitude' => $userLat,
                'longitude' => $userLng
            ]
        ]);
    }

    /**
     * Get nearby stores based on user location
     */
    private function getNearbyStores($userLat, $userLng, $radius)
    {
        $stores = Store::selectRaw("
            *, 
            (3959 * acos(cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude)))) AS distance
        ", [$userLat, $userLng, $userLat])
        ->having('distance', '<', $radius)
        ->orderBy('distance')
        ->get();

        return $stores->map(function ($store) {
            return [
                'id' => (string) $store->id,
                'name' => $store->name,
                'address' => $store->address,
                'phone' => $store->phone,
                'latitude' => $store->latitude,
                'longitude' => $store->longitude,
                'delivery_radius' => $store->delivery_radius,
                'min_order_amount' => $store->min_order_amount,
                'delivery_fee' => $store->delivery_fee,
                'distance' => $store->distance
            ];
        });
    }

    /**
     * Get all stores with distances (for dropdown)
     */
    private function getAllStoresWithDistance($userLat, $userLng)
    {
        $stores = Store::selectRaw("
            *, 
            (3959 * acos(cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude)))) AS distance
        ", [$userLat, $userLng, $userLat])
        ->orderBy('distance')
        ->get();

        return $stores->map(function ($store) {
            return [
                'id' => (string) $store->id,
                'name' => $store->name,
                'address' => $store->address,
                'phone' => $store->phone,
                'latitude' => $store->latitude,
                'longitude' => $store->longitude,
                'delivery_radius' => $store->delivery_radius,
                'min_order_amount' => $store->min_order_amount,
                'delivery_fee' => $store->delivery_fee,
                'distance' => $store->distance
            ];
        });
    }

    /**
     * Get products from nearby stores
     */
    private function getProductsFromStores($nearbyStores)
    {
        if ($nearbyStores->isEmpty()) {
            return collect();
        }

        $storeIds = $nearbyStores->pluck('id')->map(function ($id) {
            return (int) $id;
        });

        $products = Product::with(['category', 'store'])
            ->where('is_active', true)
            ->whereIn('store_id', $storeIds)
            ->orderBy('name')
            ->get();

        return $products->map(function ($product) {
            // Calculate actual review count and average rating
            $actualReviewCount = $product->reviews()->approved()->count();
            $actualAverageRating = $product->reviews()->approved()->avg('rating') ?? 0;
            
            return [
                'id' => (string) $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'originalPrice' => $product->original_price,
                'rating' => $actualAverageRating,
                'reviews' => $actualReviewCount,
                'image' => $product->image,
                'store' => $product->store->name,
                'category' => $product->category->name,
                'badges' => $this->generateBadges($product),
            ];
        });
    }

    /**
     * Get all products (fallback when no nearby stores)
     */
    private function getAllProducts()
    {
        $products = Product::with(['category', 'store'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return $products->map(function ($product) {
            // Calculate actual review count and average rating
            $actualReviewCount = $product->reviews()->approved()->count();
            $actualAverageRating = $product->reviews()->approved()->avg('rating') ?? 0;
            
            return [
                'id' => (string) $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'originalPrice' => $product->original_price,
                'rating' => $actualAverageRating,
                'reviews' => $actualReviewCount,
                'image' => $product->image,
                'store' => $product->store->name,
                'category' => $product->category->name,
                'badges' => $this->generateBadges($product),
            ];
        });
    }

    /**
     * Get all categories with product counts
     */
    private function getCategories()
    {
        return Category::active()->ordered()->get()->map(function ($category) {
            return [
                'id' => (string) $category->id,
                'name' => $category->name,
                'product_count' => $category->products()->where('is_active', true)->count(),
            ];
        });
    }

    /**
     * Generate badges for a product
     */
    private function generateBadges($product)
    {
        $badges = [];
        
        if ($product->original_price && $product->original_price > $product->price) {
            $badges[] = ['text' => 'Sale', 'color' => 'red'];
        }
        
        if ($product->average_rating >= 4.5) {
            $badges[] = ['text' => 'Top Rated', 'color' => 'yellow'];
        }
        
        if (str_contains(strtolower($product->name), 'organic')) {
            $badges[] = ['text' => 'Organic', 'color' => 'green'];
        }
        
        if ($product->stock_quantity < 10) {
            $badges[] = ['text' => 'Low Stock', 'color' => 'orange'];
        }
        
        return $badges;
    }
}
