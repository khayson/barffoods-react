<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Store;
use App\Models\SystemSetting;

class StoreController extends Controller
{
    /**
     * Display the customer stores page
     */
    public function browse()
    {
        $stores = Store::where('is_active', true)
            ->where(function ($query) {
                // Exclude stores with invalid coordinates (0, 0)
                $query->whereRaw('(latitude != 0 OR longitude != 0)');
            })
            ->orderBy('name')
            ->withCount(['products' => function ($query) {
                $query->where('is_active', true);
            }])
            ->get()
            ->map(function ($store) {
                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'image' => $store->image,
                    'address' => $store->address,
                    'phone' => $store->phone,
                    'latitude' => (float) $store->latitude,
                    'longitude' => (float) $store->longitude,
                    'delivery_radius' => (float) $store->delivery_radius,
                    'min_order_amount' => (float) $store->min_order_amount,
                    'delivery_fee' => (float) $store->delivery_fee,
                    'products_count' => $store->products_count,
                ];
            });

        // Get default map location from system settings
        $defaultMapLocation = SystemSetting::get('default_map_location');
        $defaultMapLocation = is_string($defaultMapLocation) ? json_decode($defaultMapLocation, true) : $defaultMapLocation;

        return Inertia::render('stores/index', [
            'stores' => $stores,
            'defaultMapLocation' => $defaultMapLocation,
        ]);
    }

    /**
     * Display a single store details page
     */
    public function show($id)
    {
        $store = Store::where('is_active', true)
            ->withCount(['products' => function ($query) {
                $query->where('is_active', true);
            }])
            ->findOrFail($id);

        // Check if store has valid coordinates
        if ($store->latitude == 0 && $store->longitude == 0) {
            abort(404, 'Store location is not yet available. Please check back later.');
        }

        // Get store products
        $products = $store->products()
            ->where('is_active', true)
            ->with(['category'])
            ->get()
            ->map(function ($product) use ($store) {
                $actualReviewCount = $product->reviews()->approved()->count();
                $actualAverageRating = $product->reviews()->approved()->avg('rating') ?? 0;
                
                return [
                    'id' => (string) $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'originalPrice' => $product->original_price,
                    'rating' => $actualAverageRating,
                    'reviews' => $actualReviewCount,
                    'image' => $product->images[0] ?? $product->image ?? '📦',
                    'images' => $product->images ?? [],
                    'store' => $store->name,
                    'category' => $product->category->name,
                    'stock_quantity' => $product->stock_quantity,
                    'inStock' => $product->stock_quantity > 0,
                ];
            });

        return Inertia::render('stores/show', [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'image' => $store->image,
                'address' => $store->address,
                'phone' => $store->phone,
                'latitude' => (float) $store->latitude,
                'longitude' => (float) $store->longitude,
                'delivery_radius' => (float) $store->delivery_radius,
                'min_order_amount' => (float) $store->min_order_amount,
                'delivery_fee' => (float) $store->delivery_fee,
                'products_count' => $store->products_count,
                'is_active' => $store->is_active,
            ],
            'products' => $products,
        ]);
    }

    /**
     * Get all active stores (API endpoint)
     */
    public function index()
    {
        $stores = Store::active()
            ->where(function ($query) {
                // Exclude stores with invalid coordinates (0, 0)
                $query->whereRaw('(latitude != 0 OR longitude != 0)');
            })
            ->get();
        
        return response()->json($stores);
    }

    /**
     * Get nearby stores based on user location
     */
    public function getNearbyStores(Request $request)
    {
        $userLat = $request->input('latitude', 40.7128);
        $userLng = $request->input('longitude', -74.0060);
        $radius = $request->input('radius', 25); // miles

        $stores = Store::where('is_active', true)
        ->where(function ($query) {
            // Exclude stores with invalid coordinates (0, 0)
            $query->whereRaw('(latitude != 0 OR longitude != 0)');
        })
        ->selectRaw("
            *, 
            (3959 * acos(cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude)))) AS distance
        ", [$userLat, $userLng, $userLat])
        ->having('distance', '<', $radius)
        ->orderBy('distance')
        ->limit(10)
        ->get();

        return response()->json($stores->map(function ($store) {
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
        }));
    }

    /**
     * Calculate delivery details for a store
     */
    public function calculateDelivery(Request $request)
    {
        $storeId = $request->input('store_id');
        $userLat = $request->input('user_latitude');
        $userLng = $request->input('user_longitude');

        $store = Store::find($storeId);
        
        if (!$store) {
            return response()->json(['error' => 'Store not found'], 404);
        }
        
        // Calculate distance
        $distance = $this->calculateDistance(
            $userLat, $userLng, 
            $store->latitude, $store->longitude
        );

        // Calculate delivery time (base time + distance factor)
        $baseTime = 30; // minutes
        $timePerMile = 5; // minutes
        $deliveryTime = $baseTime + ($distance * $timePerMile);

        // Calculate delivery fee (base fee + distance fee)
        // Use store's delivery fee, fallback to global setting
        $baseFee = $store->delivery_fee ?? SystemSetting::get('global_delivery_fee', 4.99);
        $distanceFee = max(0, ($distance - 5) * 2); // $2 per mile after 5 miles
        $totalFee = $baseFee + $distanceFee;

        return response()->json([
            'distance' => round($distance, 1),
            'delivery_time' => round($deliveryTime),
            'delivery_fee' => round($totalFee, 2),
            'min_order' => $store->min_order_amount
        ]);
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 3959; // miles

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng/2) * sin($dLng/2);

        $c = 2 * atan2(sqrt($a), sqrt(1-$a));

        return $earthRadius * $c;
    }
}
