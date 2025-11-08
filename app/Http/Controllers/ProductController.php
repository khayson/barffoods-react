<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Store;
use App\Models\Category;
use App\Models\SystemSetting;

class ProductController extends Controller
{
    /**
     * Display the customer products page
     */
    public function browse(Request $request)
    {
        // Cache categories for 1 hour (they don't change often)
        $categories = \Cache::remember('categories_active', 3600, function () {
            return Category::where('is_active', true)
                ->orderBy('sort_order')
                ->withCount(['products' => function ($query) {
                    $query->where('is_active', true);
                }])
                ->get()
                ->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'icon' => $category->icon,
                        'products_count' => $category->products_count,
                    ];
                });
        });

        // Cache stores for 1 hour
        $stores = \Cache::remember('stores_active', 3600, function () {
            return Store::where('is_active', true)
                ->orderBy('name')
                ->withCount(['products' => function ($query) {
                    $query->where('is_active', true);
                }])
                ->get()
                ->map(function ($store) {
                    return [
                        'id' => $store->id,
                        'name' => $store->name,
                        'address' => $store->address,
                        'products_count' => $store->products_count,
                    ];
                });
        });

        // Cache products for 30 minutes (they change more frequently)
        $products = \Cache::remember('products_browse', 1800, function () {
            return Product::with(['category', 'store'])
                ->withCount('reviews')
                ->withAvg('reviews', 'rating')
                ->where('is_active', true)
                ->get()
                ->map(function ($product) {
                    // Use eager loaded counts and averages
                    $actualReviewCount = $product->reviews_count ?? 0;
                    $actualAverageRating = $product->reviews_avg_rating ?? 0;
                    
                    return [
                        'id' => (string) $product->id,
                        'name' => $product->name,
                        'price' => $product->price,
                        'originalPrice' => $product->original_price,
                        'rating' => $actualAverageRating,
                        'reviews' => $actualReviewCount,
                        'image' => $product->images[0] ?? $product->image ?? '📦',
                        'images' => $product->images ?? [],
                        'store' => $product->store->name,
                        'category' => $product->category->name,
                        'badges' => $this->generateBadges($product),
                    ];
                });
        });

        return Inertia::render('products/index', [
            'categories' => $categories,
            'stores' => $stores,
            'products' => $products,
            'filters' => [
                'search' => $request->input('search', ''),
                'category_id' => $request->input('category_id'),
                'store_id' => $request->input('store_id'),
            ],
        ]);
    }

    public function index(Request $request)
    {
        try {
            $query = Product::with(['category', 'store'])
                ->withCount(['reviews as approved_reviews_count' => function ($q) {
                    $q->where('is_approved', true);
                }])
                ->withAvg(['reviews as approved_reviews_avg_rating' => function ($q) {
                    $q->where('is_approved', true);
                }], 'rating')
                ->where('is_active', true);
                
            // Filter by store
            if ($request->has('store_id')) {
                $query->where('store_id', $request->input('store_id'));
            }
            
            // Filter by category
            if ($request->has('category_id')) {
                $query->where('category_id', $request->input('category_id'));
            }
            
            // Search
            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->input('search') . '%');
            }
            
            // Pagination
            $perPage = $request->get('per_page', 20);
            $products = $query->orderBy('name')->paginate($perPage);
            
            // Format products for frontend
            $formattedProducts = $products->getCollection()->map(function ($product) {
                // Use eager loaded counts and averages
                $actualReviewCount = $product->approved_reviews_count ?? 0;
                $actualAverageRating = $product->approved_reviews_avg_rating ?? 0;
                
                // Null checks for relationships
                if (!$product->store || !$product->category) {
                    \Log::warning('Product missing store or category', [
                        'product_id' => $product->id,
                        'has_store' => $product->store !== null,
                        'has_category' => $product->category !== null
                    ]);
                    return null;
                }
                
                return [
                    'id' => (string) $product->id,
                    'name' => $product->name,
                    'price' => (float) $product->price,
                    'originalPrice' => $product->original_price ? (float) $product->original_price : null,
                    'rating' => round($actualAverageRating, 1),
                    'reviews' => $actualReviewCount,
                    'image' => $product->image,
                    'store' => $product->store->name,
                    'category' => $product->category->name,
                    'badges' => $this->generateBadges($product),
                ];
            })->filter(); // Remove null values
            
            return response()->json([
                'products' => [
                    'data' => $formattedProducts->values(), // Re-index array
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ],
                'stores' => Store::active()->limit(50)->get()->map(function ($store) {
                    return [
                        'id' => (string) $store->id,
                        'name' => $store->name,
                        'address' => $store->address,
                    ];
                }),
                'categories' => Category::active()->ordered()->limit(50)->get()->map(function ($category) {
                    return [
                        'id' => (string) $category->id,
                        'name' => $category->name,
                        'product_count' => $category->products()->where('is_active', true)->count(),
                    ];
                })
            ])->header('Cache-Control', 'no-cache, no-store, must-revalidate')
              ->header('Pragma', 'no-cache')
              ->header('Expires', '0');
              
        } catch (\Exception $e) {
            \Log::error('Product index API error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to load products',
                'message' => $e->getMessage(),
                'products' => [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 20,
                    'total' => 0,
                ],
                'stores' => [],
                'categories' => []
            ], 500);
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

    public function show($id)
    {
        $product = Product::with(['category', 'store', 'reviews.user'])
            ->where('is_active', true)
            ->findOrFail($id);
        
        // Calculate actual review count and average rating
        $actualReviewCount = $product->reviews()->approved()->count();
        $actualAverageRating = $product->reviews()->approved()->avg('rating') ?? 0;

        // Format product for frontend
        $formattedProduct = [
            'id' => (string) $product->id,
            'name' => $product->name,
            'price' => $product->price,
            'original_price' => $product->original_price,
            'rating' => $actualAverageRating,
            'reviews' => $actualReviewCount,
            'image' => $product->image,
            'images' => $product->images ?? [], // Multiple images array
            'store' => [
                'id' => (string) $product->store->id,
                'name' => $product->store->name,
                'image' => $product->store->image,
                'address' => $product->store->address,
                'delivery_fee' => $product->store->delivery_fee,
                'min_order_amount' => $product->store->min_order_amount,
                'delivery_radius' => $product->store->delivery_radius,
            ],
            'category' => [
                'id' => (string) $product->category->id,
                'name' => $product->category->name,
            ],
            'description' => $product->description,
            'specifications' => $this->generateSpecifications($product),
            'badges' => $this->generateBadges($product),
            'inStock' => $product->stock_quantity > 0,
            'stock_quantity' => $product->stock_quantity,
            'weight' => $product->weight,
            'length' => $product->length,
            'width' => $product->width,
            'height' => $product->height,
        ];
        
        // If this is an API request, return JSON
        if (request()->wantsJson() || request()->is('api/*')) {
            return response()->json([
                'success' => true,
                'product' => $formattedProduct
            ]);
        }
        
        // Format reviews (only approved ones)
        $formattedReviews = $product->reviews()
            ->approved()
            ->with(['user', 'helpfulVotes'])
            ->get()
            ->map(function ($review) {
                $userId = auth()->id();
                $isHelpfulByUser = $userId ? $review->isHelpfulByUser($userId) : false;
                
                return [
                    'id' => (string) $review->id,
                    'user' => ['name' => $review->user->name],
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'date' => $review->created_at->format('Y-m-d'),
                    'helpful' => $review->helpful_count,
                    'is_helpful_by_user' => $isHelpfulByUser,
                    'verified' => true, // Default value
                ];
            });
        
        // Get shipping options from system settings
        $shippingOptions = SystemSetting::get('shipping_options', [
            'standard' => [
                'name' => 'Standard Delivery',
                'description' => '3-5 business days',
                'price' => 0,
                'enabled' => true
            ],
            'express' => [
                'name' => 'Express Delivery',
                'description' => '1-2 business days',
                'price' => 5.99,
                'enabled' => true
            ],
            'same_day' => [
                'name' => 'Same Day Delivery',
                'description' => 'Order before 2 PM',
                'price' => 9.99,
                'enabled' => true
            ]
        ]);

        return Inertia::render('products/show', [
            'product' => $formattedProduct,
            'reviews' => $formattedReviews,
            'averageRating' => $actualAverageRating,
            'totalReviews' => $actualReviewCount,
            'shippingOptions' => $shippingOptions
        ]);
    }

    /**
     * Generate specifications for a product
     */
    private function generateSpecifications($product)
    {
        $specs = [];
        
        if ($product->store) {
            $specs[] = ['key' => 'Store', 'value' => $product->store->name];
        }
        
        if ($product->category) {
            $specs[] = ['key' => 'Category', 'value' => $product->category->name];
        }
        
        $specs[] = ['key' => 'Stock', 'value' => $product->stock_quantity . ' available'];
        
        if ($product->original_price && $product->original_price > $product->price) {
            $discount = round((($product->original_price - $product->price) / $product->original_price) * 100);
            $specs[] = ['key' => 'Discount', 'value' => $discount . '% off'];
        }
        
        return $specs;
    }
}