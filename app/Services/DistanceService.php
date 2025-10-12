<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DistanceService
{
    protected $easyPostService;

    public function __construct(EasyPostService $easyPostService)
    {
        $this->easyPostService = $easyPostService;
    }

    /**
     * Calculate distance between two addresses
     */
    public function calculateDistance(array $fromAddress, array $toAddress): ?float
    {
        try {
            // Try EasyPost first for accurate distance calculation
            $distance = $this->calculateDistanceWithEasyPost($fromAddress, $toAddress);
            
            if ($distance !== null) {
                return $distance;
            }

            // Fallback to simple ZIP code distance calculation
            return $this->calculateDistanceByZipCode($fromAddress, $toAddress);

        } catch (\Exception $e) {
            Log::error('Distance calculation failed', [
                'from_address' => $fromAddress,
                'to_address' => $toAddress,
                'error' => $e->getMessage()
            ]);

            // Return null if all methods fail
            return null;
        }
    }

    /**
     * Calculate distance using EasyPost API
     */
    protected function calculateDistanceWithEasyPost(array $fromAddress, array $toAddress): ?float
    {
        try {
            // Create addresses in EasyPost
            $fromAddressResult = $this->easyPostService->verifyAddress($fromAddress);
            $toAddressResult = $this->easyPostService->verifyAddress($toAddress);

            if (!$fromAddressResult['is_valid'] || !$toAddressResult['is_valid']) {
                return null;
            }

            // Calculate distance between coordinates
            $fromCoords = $fromAddressResult['verified_address'];
            $toCoords = $toAddressResult['verified_address'];

            // Use Haversine formula for distance calculation
            return $this->haversineDistance(
                $fromCoords['latitude'] ?? null,
                $fromCoords['longitude'] ?? null,
                $toCoords['latitude'] ?? null,
                $toCoords['longitude'] ?? null
            );

        } catch (\Exception $e) {
            Log::warning('EasyPost distance calculation failed', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Calculate distance using ZIP code approximation
     */
    protected function calculateDistanceByZipCode(array $fromAddress, array $toAddress): ?float
    {
        try {
            $fromZip = $fromAddress['zip_code'] ?? $fromAddress['zip'] ?? null;
            $toZip = $toAddress['zip_code'] ?? $toAddress['zip'] ?? null;

            if (!$fromZip || !$toZip) {
                return null;
            }

            // Get coordinates for ZIP codes using a free service
            $fromCoords = $this->getZipCodeCoordinates($fromZip);
            $toCoords = $this->getZipCodeCoordinates($toZip);

            if (!$fromCoords || !$toCoords) {
                return null;
            }

            return $this->haversineDistance(
                $fromCoords['lat'],
                $fromCoords['lng'],
                $toCoords['lat'],
                $toCoords['lng']
            );

        } catch (\Exception $e) {
            Log::warning('ZIP code distance calculation failed', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get coordinates for a ZIP code using free API
     */
    protected function getZipCodeCoordinates(string $zipCode): ?array
    {
        try {
            // Use Nominatim (OpenStreetMap) - free service
            $response = Http::timeout(5)->get('https://nominatim.openstreetmap.org/search', [
                'postalcode' => $zipCode,
                'countrycodes' => 'us',
                'format' => 'json',
                'limit' => 1,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (!empty($data)) {
                    return [
                        'lat' => (float) $data[0]['lat'],
                        'lng' => (float) $data[0]['lon'],
                    ];
                }
            }

            return null;

        } catch (\Exception $e) {
            Log::warning('ZIP code coordinates lookup failed', [
                'zip_code' => $zipCode,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Calculate distance using Haversine formula
     */
    protected function haversineDistance(?float $lat1, ?float $lng1, ?float $lat2, ?float $lng2): ?float
    {
        if ($lat1 === null || $lng1 === null || $lat2 === null || $lng2 === null) {
            return null;
        }

        $earthRadius = 3959; // Earth's radius in miles
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng/2) * sin($dLng/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }

    /**
     * Get suggested shipping method based on distance and weight
     */
    public function getSuggestedShippingMethod(float $distance, float $weight = 1.0): array
    {
        // Define shipping method rules
        $shippingMethods = [
            'ground' => [
                'name' => 'Ground Shipping',
                'max_distance' => 100,
                'max_weight' => 70,
                'base_cost' => 8.99,
                'cost_per_mile' => 0.05,
                'delivery_days' => '3-5',
                'description' => 'Standard ground delivery'
            ],
            'express' => [
                'name' => 'Express Shipping',
                'max_distance' => 500,
                'max_weight' => 70,
                'base_cost' => 15.99,
                'cost_per_mile' => 0.08,
                'delivery_days' => '1-2',
                'description' => 'Fast express delivery'
            ],
            'overnight' => [
                'name' => 'Overnight Shipping',
                'max_distance' => 1000,
                'max_weight' => 70,
                'base_cost' => 25.99,
                'cost_per_mile' => 0.12,
                'delivery_days' => '1',
                'description' => 'Next day delivery'
            ]
        ];

        // Find suitable methods based on distance and weight
        $suitableMethods = [];
        
        foreach ($shippingMethods as $key => $method) {
            if ($distance <= $method['max_distance'] && $weight <= $method['max_weight']) {
                $cost = $method['base_cost'] + ($distance * $method['cost_per_mile']);
                
                $suitableMethods[$key] = [
                    'id' => $key,
                    'name' => $method['name'],
                    'cost' => round($cost, 2),
                    'delivery_days' => $method['delivery_days'],
                    'description' => $method['description'],
                    'suggested' => false
                ];
            }
        }

        // Sort by cost (cheapest first)
        uasort($suitableMethods, function($a, $b) {
            return $a['cost'] <=> $b['cost'];
        });

        // Mark the first (cheapest) as suggested
        if (!empty($suitableMethods)) {
            $firstKey = array_key_first($suitableMethods);
            $suitableMethods[$firstKey]['suggested'] = true;
        }

        return $suitableMethods;
    }

    /**
     * Get estimated shipping cost range for cart display
     */
    public function getEstimatedShippingRange(array $cartItems, ?int $userId = null): array
    {
        try {
            // Get store address
            $storeAddress = $this->getStoreAddress();
            
            // Estimate customer location (use default or last known address)
            $customerAddress = $this->getEstimatedCustomerAddress($userId);
            
            if (!$customerAddress) {
                // Return default range if no customer address
                return [
                    'min_cost' => 8.99,
                    'max_cost' => 25.99,
                    'estimated_cost' => 15.99,
                    'message' => 'Shipping calculated at checkout'
                ];
            }

            // Calculate distance
            $distance = $this->calculateDistance($storeAddress, $customerAddress);
            
            if ($distance === null) {
                // Return default range if distance calculation fails
                return [
                    'min_cost' => 8.99,
                    'max_cost' => 25.99,
                    'estimated_cost' => 15.99,
                    'message' => 'Shipping calculated at checkout'
                ];
            }

            // Calculate weight
            $weight = $this->calculateCartWeight($cartItems);

            // Get shipping methods
            $shippingMethods = $this->getSuggestedShippingMethod($distance, $weight);

            if (empty($shippingMethods)) {
                return [
                    'min_cost' => 8.99,
                    'max_cost' => 25.99,
                    'estimated_cost' => 15.99,
                    'message' => 'Shipping calculated at checkout'
                ];
            }

            $costs = array_column($shippingMethods, 'cost');
            
            return [
                'min_cost' => min($costs),
                'max_cost' => max($costs),
                'estimated_cost' => $shippingMethods[array_key_first($shippingMethods)]['cost'],
                'distance' => round($distance, 1),
                'message' => 'Shipping calculated at checkout'
            ];

        } catch (\Exception $e) {
            Log::error('Shipping range estimation failed', [
                'cart_items' => $cartItems,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);

            return [
                'min_cost' => 8.99,
                'max_cost' => 25.99,
                'estimated_cost' => 15.99,
                'message' => 'Shipping calculated at checkout'
            ];
        }
    }

    /**
     * Get store address from system settings
     */
    protected function getStoreAddress(): array
    {
        $storeAddress = SystemSetting::get('store_address', [
            'street_address' => '123 Main Street',
            'city' => 'New York',
            'state' => 'NY',
            'zip_code' => '10001',
            'country' => 'US'
        ]);

        return [
            'street_address' => $storeAddress['street_address'],
            'city' => $storeAddress['city'],
            'state' => $storeAddress['state'],
            'zip_code' => $storeAddress['zip_code'],
            'country' => $storeAddress['country'],
        ];
    }

    /**
     * Get estimated customer address
     */
    protected function getEstimatedCustomerAddress(?int $userId): ?array
    {
        if (!$userId) {
            return null;
        }

        try {
            // Try to get user's default address
            $user = \App\Models\User::find($userId);
            if ($user && $user->defaultAddress) {
                $address = $user->defaultAddress;
                return [
                    'street_address' => $address->street_address,
                    'city' => $address->city,
                    'state' => $address->state,
                    'zip_code' => $address->zip_code,
                    'country' => 'US',
                ];
            }

            return null;

        } catch (\Exception $e) {
            Log::warning('Failed to get customer address for shipping estimation', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Calculate total weight of cart items
     */
    protected function calculateCartWeight(array $cartItems): float
    {
        $totalWeight = 0;
        
        foreach ($cartItems as $item) {
            // Default weight per item (should be stored in product table)
            $itemWeight = 8; // ounces per item
            $totalWeight += $itemWeight * $item['quantity'];
        }
        
        // Add packaging weight
        $totalWeight += 2; // packaging weight
        
        return $totalWeight;
    }
}
