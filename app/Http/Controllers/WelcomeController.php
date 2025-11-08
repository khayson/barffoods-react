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
        try {
            // Validate location inputs
            $validated = $request->validate([
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'radius' => 'nullable|numeric|min:1|max:100',
            ]);
            
            // Get default map location from system settings
            $defaultMapLocation = SystemSetting::get('default_map_location');
            $defaultMapLocation = is_string($defaultMapLocation) ? json_decode($defaultMapLocation, true) : $defaultMapLocation;
            
            $defaultLat = $defaultMapLocation['latitude'] ?? 40.7128;
            $defaultLng = $defaultMapLocation['longitude'] ?? -74.0060;
            
            $userLat = $validated['latitude'] ?? $defaultLat;
            $userLng = $validated['longitude'] ?? $defaultLng;
            $radius = $validated['radius'] ?? 25;

            // Get nearby stores (within radius)
            $nearbyStores = $this->getNearbyStores($userLat, $userLng, $radius);
            
            // Get all stores with distances (for dropdown) - limited to 50
            $allStores = $this->getAllStoresWithDistance($userLat, $userLng);
            
            // Get products from nearby stores, or all products if no nearby stores
            $products = $nearbyStores->isEmpty() 
                ? $this->getAllProducts() 
                : $this->getProductsFromStores($nearbyStores);
            
            // Get all categories (cached)
            $categories = $this->getCategories();

            \Log::info('Welcome page data', [
                'nearbyStores_count' => $nearbyStores->count(),
                'allStores_count' => $allStores->count(),
                'products_count' => $products->count(),
                'categories_count' => $categories->count(),
                'userLocation' => ['lat' => $userLat, 'lng' => $userLng]
            ]);
            
            return Inertia::render('welcome', [
                'nearbyStores' => $nearbyStores,
                'allStores' => $allStores,
                'products' => $products,
                'categories' => $categories,
                'userLocation' => [
                    'latitude' => (float) $userLat,
                    'longitude' => (float) $userLng
                ],
                'defaultMapLocation' => $defaultMapLocation
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return validation errors to frontend
            return back()->withErrors($e->errors());
            
        } catch (\Exception $e) {
            // Log error and return with default data
            \Log::error('Welcome page error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Return with default location
            $defaultMapLocation = ['latitude' => 40.7128, 'longitude' => -74.0060];
            
            return Inertia::render('welcome', [
                'nearbyStores' => collect(),
                'allStores' => collect(),
                'products' => $this->getAllProducts()->take(20),
                'categories' => $this->getCategories(),
                'userLocation' => $defaultMapLocation,
                'defaultMapLocation' => $defaultMapLocation,
                'error' => 'Unable to load location-based data. Showing default results.'
            ]);
        }
    }

    /**
     * Get nearby stores based on user location
     */
    private function getNearbyStores($userLat, $userLng, $radius)
    {
        try {
            $stores = Store::where('is_active', true)
                ->selectRaw("
                    *, 
                    (3959 * acos(cos(radians(?)) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(latitude)))) AS distance
                ", [$userLat, $userLng, $userLat])
                ->whereRaw('latitude IS NOT NULL AND longitude IS NOT NULL')
                ->whereRaw('latitude != 0 OR longitude != 0')
                ->having('distance', '<', $radius)
                ->orderBy('distance')
                ->limit(10)
                ->get();

            return $stores->map(function ($store) {
                return [
                    'id' => (string) $store->id,
                    'name' => $store->name,
                    'address' => $store->address,
                    'phone' => $store->phone,
                    'latitude' => (float) $store->latitude,
                    'longitude' => (float) $store->longitude,
                    'delivery_radius' => (float) $store->delivery_radius,
                    'min_order_amount' => (float) $store->min_order_amount,
                    'delivery_fee' => (float) $store->delivery_fee,
                    'distance' => round($store->distance, 2),
                    'product_count' => \App\Models\Product::where('store_id', $store->id)->where('is_active', true)->count()
                ];
            });
            
        } catch (\Exception $e) {
            \Log::error('Error getting nearby stores', [
                'error' => $e->getMessage(),
                'location' => ['lat' => $userLat, 'lng' => $userLng, 'radius' => $radius]
            ]);
            return collect();
        }
    }

    /**
     * Get all stores with distances (for dropdown)
     */
    private function getAllStoresWithDistance($userLat, $userLng)
    {
        try {
            $stores = Store::where('is_active', true)
                ->selectRaw("
                    *, 
                    (3959 * acos(cos(radians(?)) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(latitude)))) AS distance
                ", [$userLat, $userLng, $userLat])
                ->whereRaw('latitude IS NOT NULL AND longitude IS NOT NULL')
                ->whereRaw('latitude != 0 OR longitude != 0')
                ->orderBy('distance')
                ->limit(50) // Limit for performance
                ->get();

            return $stores->map(function ($store) {
                return [
                    'id' => (string) $store->id,
                    'name' => $store->name,
                    'address' => $store->address,
                    'phone' => $store->phone,
                    'latitude' => (float) $store->latitude,
                    'longitude' => (float) $store->longitude,
                    'delivery_radius' => (float) $store->delivery_radius,
                    'min_order_amount' => (float) $store->min_order_amount,
                    'delivery_fee' => (float) $store->delivery_fee,
                    'distance' => round($store->distance, 2),
                    'product_count' => \App\Models\Product::where('store_id', $store->id)->where('is_active', true)->count()
                ];
            });
            
        } catch (\Exception $e) {
            \Log::error('Error getting all stores with distance', [
                'error' => $e->getMessage(),
                'location' => ['lat' => $userLat, 'lng' => $userLng]
            ]);
            return collect();
        }
    }

    /**
     * Get products from nearby stores
     */
    private function getProductsFromStores($nearbyStores)
    {
        try {
            if ($nearbyStores->isEmpty()) {
                return collect();
            }

            $storeIds = $nearbyStores->pluck('id')->map(function ($id) {
                return (int) $id;
            });

            $products = Product::with(['category', 'store'])
                ->withCount(['reviews as approved_reviews_count' => function ($query) {
                    $query->where('is_approved', true);
                }])
                ->withAvg(['reviews as approved_reviews_avg_rating' => function ($query) {
                    $query->where('is_approved', true);
                }], 'rating')
                ->where('is_active', true)
                ->whereIn('store_id', $storeIds)
                ->orderBy('name')
                ->limit(50) // Limit for performance
                ->get();

            return $products->map(function ($product) {
                // Use eager loaded counts and averages
                $actualReviewCount = $product->approved_reviews_count ?? 0;
                $actualAverageRating = $product->approved_reviews_avg_rating ?? 0;
                
                return [
                    'id' => (string) $product->id,
                    'name' => $product->name,
                    'price' => (float) $product->price,
                    'originalPrice' => $product->original_price ? (float) $product->original_price : null,
                    'rating' => round($actualAverageRating, 1),
                    'reviews' => $actualReviewCount,
                    'image' => $product->image,
                    'images' => $product->images ?? [],
                    'store' => $product->store->name,
                    'category' => $product->category->name,
                    'badges' => $this->generateBadges($product),
                ];
            });
            
        } catch (\Exception $e) {
            \Log::error('Error getting products from stores', [
                'error' => $e->getMessage(),
                'store_count' => $nearbyStores->count()
            ]);
            return collect();
        }
    }

    /**
     * Get all products (fallback when no nearby stores)
     */
    private function getAllProducts()
    {
        try {
            $products = Product::with(['category', 'store'])
                ->withCount(['reviews as approved_reviews_count' => function ($query) {
                    $query->where('is_approved', true);
                }])
                ->withAvg(['reviews as approved_reviews_avg_rating' => function ($query) {
                    $query->where('is_approved', true);
                }], 'rating')
                ->where('is_active', true)
                ->orderBy('name')
                ->limit(50) // Limit for performance
                ->get();

            return $products->map(function ($product) {
                // Use eager loaded counts and averages
                $actualReviewCount = $product->approved_reviews_count ?? 0;
                $actualAverageRating = $product->approved_reviews_avg_rating ?? 0;
                
                return [
                    'id' => (string) $product->id,
                    'name' => $product->name,
                    'price' => (float) $product->price,
                    'originalPrice' => $product->original_price ? (float) $product->original_price : null,
                    'rating' => round($actualAverageRating, 1),
                    'reviews' => $actualReviewCount,
                    'image' => $product->image,
                    'images' => $product->images ?? [],
                    'store' => $product->store->name,
                    'category' => $product->category->name,
                    'badges' => $this->generateBadges($product),
                ];
            });
            
        } catch (\Exception $e) {
            \Log::error('Error getting all products', [
                'error' => $e->getMessage()
            ]);
            return collect();
        }
    }

    /**
     * Get all categories with product counts (cached)
     */
    private function getCategories()
    {
        try {
            return \Cache::remember('categories_active', 3600, function () {
                return Category::active()
                    ->ordered()
                    ->withCount(['products' => function ($query) {
                        $query->where('is_active', true);
                    }])
                    ->get()
                    ->map(function ($category) {
                        return [
                            'id' => (string) $category->id,
                            'name' => $category->name,
                            'product_count' => $category->products_count ?? 0,
                        ];
                    });
            });
            
        } catch (\Exception $e) {
            \Log::error('Error getting categories', [
                'error' => $e->getMessage()
            ]);
            return collect();
        }
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
