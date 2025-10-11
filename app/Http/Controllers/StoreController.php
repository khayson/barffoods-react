<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Store;
use App\Models\SystemSetting;

class StoreController extends Controller
{
    /**
     * Get all active stores
     */
    public function index()
    {
        $stores = Store::active()->get();
        
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

        $stores = Store::selectRaw("
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
