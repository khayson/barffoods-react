<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Store;
use App\Models\Category;
use App\Models\SystemSetting;

class WelcomeController extends Controller
{
    /**
     * Show the welcome page with location-based data
     */
    public function index(Request $request)
    {
        // Get default map location from system settings
        $defaultMapLocation = SystemSetting::get('default_map_location');
        $defaultMapLocation = is_string($defaultMapLocation) ? json_decode($defaultMapLocation, true) : $defaultMapLocation;
        
        $defaultLat = $defaultMapLocation['latitude'] ?? 40.7128;
        $defaultLng = $defaultMapLocation['longitude'] ?? -74.0060;
        
        $userLat = $request->input('latitude', $defaultLat);
        $userLng = $request->input('longitude', $defaultLng);
        $radius = $request->input('radius', 25); // Match StoreController API radius

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
            ],
            'defaultMapLocation' => $defaultMapLocation
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
        ->limit(10) // Match StoreController API limit
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
                'images' => $product->images ?? [], // Multiple images array
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
                'images' => $product->images ?? [], // Multiple images array
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
     * Generate badges for a product based on industry standards
     */
    private function generateBadges($product)
    {
        $badges = [];
        $productName = strtolower($product->name);
        $productDescription = strtolower($product->description ?? '');
        
        // Priority 1: Sale/Discount Badge (RED - Urgent/Promotional)
        if ($product->original_price && $product->original_price > $product->price) {
            $discountPercent = round((($product->original_price - $product->price) / $product->original_price) * 100);
            $badges[] = ['text' => "Sale {$discountPercent}%", 'color' => 'red'];
        }
        
        // Priority 2: New Arrival Badge (BLUE - Freshness indicator, last 30 days)
        if ($product->created_at && $product->created_at->diffInDays(now()) <= 30) {
            $badges[] = ['text' => 'New', 'color' => 'blue'];
        }
        
        // Priority 3: Best Seller Badge (PURPLE - Social proof, based on review count)
        // Products with 20+ reviews are considered best sellers
        if ($product->review_count >= 20) {
            $badges[] = ['text' => 'Best Seller', 'color' => 'purple'];
        }
        
        // Priority 4: Low Stock Badge (ORANGE - Urgency)
        if ($product->stock_quantity > 0 && $product->stock_quantity < 10) {
            $badges[] = ['text' => 'Low Stock', 'color' => 'orange'];
        }
        
        // Priority 5: Out of Stock Badge (RED)
        if ($product->stock_quantity == 0) {
            $badges[] = ['text' => 'Out of Stock', 'color' => 'red'];
        }
        
        // Priority 6: Top Rated Badge (YELLOW - Quality indicator)
        if ($product->average_rating >= 4.5 && $product->review_count >= 5) {
            $badges[] = ['text' => '⭐ Top Rated', 'color' => 'yellow'];
        }
        
        // Product Attribute Badges (GREEN - Quality/Health attributes)
        
        // Organic
        if (str_contains($productName, 'organic') || str_contains($productDescription, 'organic')) {
            $badges[] = ['text' => '🌿 Organic', 'color' => 'green'];
        }
        
        // Grass-Fed (common in raw pet food)
        if (str_contains($productName, 'grass-fed') || str_contains($productName, 'grass fed') ||
            str_contains($productDescription, 'grass-fed') || str_contains($productDescription, 'grass fed')) {
            $badges[] = ['text' => '🌾 Grass-Fed', 'color' => 'green'];
        }
        
        // Human Grade
        if (str_contains($productName, 'human grade') || str_contains($productName, 'human-grade') ||
            str_contains($productDescription, 'human grade') || str_contains($productDescription, 'human-grade')) {
            $badges[] = ['text' => '✓ Human Grade', 'color' => 'green'];
        }
        
        // Free Range
        if (str_contains($productName, 'free range') || str_contains($productName, 'free-range') ||
            str_contains($productDescription, 'free range') || str_contains($productDescription, 'free-range')) {
            $badges[] = ['text' => '🐔 Free Range', 'color' => 'green'];
        }
        
        // Wild Caught
        if (str_contains($productName, 'wild caught') || str_contains($productName, 'wild-caught') ||
            str_contains($productDescription, 'wild caught') || str_contains($productDescription, 'wild-caught')) {
            $badges[] = ['text' => '🐟 Wild Caught', 'color' => 'blue'];
        }
        
        // Non-GMO
        if (str_contains($productName, 'non-gmo') || str_contains($productName, 'non gmo') ||
            str_contains($productDescription, 'non-gmo') || str_contains($productDescription, 'non gmo')) {
            $badges[] = ['text' => '🌱 Non-GMO', 'color' => 'green'];
        }
        
        // Grain-Free
        if (str_contains($productName, 'grain-free') || str_contains($productName, 'grain free') ||
            str_contains($productDescription, 'grain-free') || str_contains($productDescription, 'grain free')) {
            $badges[] = ['text' => '🌾 Grain-Free', 'color' => 'brown'];
        }
        
        // Gluten-Free
        if (str_contains($productName, 'gluten-free') || str_contains($productName, 'gluten free') ||
            str_contains($productDescription, 'gluten-free') || str_contains($productDescription, 'gluten free')) {
            $badges[] = ['text' => 'Gluten-Free', 'color' => 'brown'];
        }
        
        // Local/Locally Sourced
        if (str_contains($productName, 'local') || str_contains($productDescription, 'locally sourced') ||
            str_contains($productDescription, 'local farm')) {
            $badges[] = ['text' => '📍 Local', 'color' => 'green'];
        }
        
        // Fresh (for perishable items)
        if (str_contains($productName, 'fresh') || str_contains($productDescription, 'fresh')) {
            $badges[] = ['text' => '❄️ Fresh', 'color' => 'blue'];
        }
        
        // Frozen
        if (str_contains($productName, 'frozen') || str_contains($productDescription, 'frozen')) {
            $badges[] = ['text' => '🧊 Frozen', 'color' => 'blue'];
        }
        
        // Sustainable/Eco-Friendly
        if (str_contains($productName, 'sustainable') || str_contains($productName, 'eco-friendly') ||
            str_contains($productDescription, 'sustainable') || str_contains($productDescription, 'eco-friendly')) {
            $badges[] = ['text' => '♻️ Sustainable', 'color' => 'green'];
        }
        
        // Made in USA
        if (str_contains($productName, 'made in usa') || str_contains($productName, 'usa made') ||
            str_contains($productDescription, 'made in usa') || str_contains($productDescription, 'usa made')) {
            $badges[] = ['text' => '🇺🇸 Made in USA', 'color' => 'blue'];
        }
        
        // Limit to max 3 badges for clean UI (prioritized by order above)
        return array_slice($badges, 0, 3);
    }
}
