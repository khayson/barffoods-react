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
    public function index(Request $request)
    {
        $query = Product::with(['category', 'store'])
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
        
        $products = $query->orderBy('name')->get();
        
        // Format products for frontend
        $formattedProducts = $products->map(function ($product) {
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
        
        return response()->json([
            'products' => $formattedProducts,
            'stores' => Store::active()->get()->map(function ($store) {
                return [
                    'id' => (string) $store->id,
                    'name' => $store->name,
                    'address' => $store->address,
                ];
            }),
            'categories' => Category::active()->ordered()->get()->map(function ($category) {
                return [
                    'id' => (string) $category->id,
                    'name' => $category->name,
                    'product_count' => $category->products()->where('is_active', true)->count(),
                ];
            })
        ])->header('Cache-Control', 'no-cache, no-store, must-revalidate')
          ->header('Pragma', 'no-cache')
          ->header('Expires', '0');
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
            'store' => [
                'id' => (string) $product->store->id,
                'name' => $product->store->name,
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