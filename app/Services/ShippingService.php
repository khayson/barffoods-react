<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Log;

class ShippingService
{
    protected $easyPostService;

    public function __construct(EasyPostService $easyPostService)
    {
        $this->easyPostService = $easyPostService;
    }

    /**
     * Get delivery methods and carriers for checkout
     */
    public function getDeliveryMethods(array $customerAddress, array $cartItems = []): array
    {
        try {
            // Get store address
            $storeAddress = $this->getStoreAddress();
            
            // Calculate distance to determine delivery options
            $distance = $this->calculateDistance($storeAddress, $customerAddress);
            
            // Get delivery methods and carriers from EasyPost - NO MOCK DATA
            $deliveryMethods = [];
            $carriers = [];
            
            // Always provide Fast Delivery option (local delivery)
            $fastDeliveryCost = $this->calculateFastDeliveryCost($distance ?? 0);
            $deliveryMethods[] = [
                'id' => 'fast_delivery',
                'name' => 'Local Express',
                'type' => 'fast_delivery',
                'description' => 'Our local delivery service for faster delivery',
                'estimated_days' => '1-2 business days',
                'cost' => $fastDeliveryCost,
            ];
            
            if ($distance !== null) {
                // Get carriers from EasyPost
                $carriers = $this->getEasyPostCarriers($storeAddress, $customerAddress, $distance, $cartItems);
                
                // Only provide shipping method if carriers are available
                if (!empty($carriers)) {
                    $deliveryMethods[] = [
                        'id' => 'shipping',
                        'name' => 'Standard Shipping',
                        'type' => 'shipping',
                        'description' => 'Ship via EasyPost carriers',
                        'estimated_days' => '3-7 business days',
                    ];
                }
            }

            return [
                'delivery_methods' => $deliveryMethods,
                'carriers' => $carriers,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to get delivery methods', [
                'customer_address' => $customerAddress,
                'error' => $e->getMessage()
            ]);

            // NO FALLBACK DATA - Return error response
            throw new \Exception('Failed to get delivery methods: ' . $e->getMessage());
        }
    }

    /**
     * Calculate shipping rates for an order
     */
    public function calculateShippingRates(Order $order): array
    {
        try {
            // Get store address (from address)
            $storeAddress = $this->getStoreAddress();
            
            // Get customer address (to address)
            $customerAddress = $this->formatCustomerAddress($order);
            
            // Calculate parcel dimensions and weight
            $parcel = $this->calculateParcelDimensions($order);
            
            // Get rates from EasyPost
            $ratesResult = $this->easyPostService->getShippingRates(
                $storeAddress,
                $customerAddress,
                $parcel
            );
            
            if ($ratesResult['success']) {
                return [
                    'success' => true,
                    'rates' => $this->formatRatesForDisplay($ratesResult['rates']),
                    'shipment_id' => $ratesResult['shipment_id'],
                ];
            }
            
            return [
                'success' => false,
                'errors' => $ratesResult['errors'],
            ];
            
        } catch (\Exception $e) {
            Log::error('Shipping rate calculation failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'errors' => ['Shipping rate calculation failed'],
            ];
        }
    }

    /**
     * Create shipping label for an order
     */
    public function createShippingLabel(Order $order, string $rateId): array
    {
        try {
            // First get shipment ID by calculating rates
            $ratesResult = $this->calculateShippingRates($order);
            
            if (!$ratesResult['success']) {
                return $ratesResult;
            }
            
            $shipmentId = $ratesResult['shipment_id'];
            
            // Create the label
            $labelResult = $this->easyPostService->createLabel($shipmentId, $rateId);
            
            if ($labelResult['success']) {
                // Update order with tracking information
                $order->update([
                    'tracking_code' => $labelResult['tracking_code'],
                    'label_url' => $labelResult['label_url'],
                    'status' => 'confirmed',
                ]);
                
                Log::info('Shipping label created successfully', [
                    'order_id' => $order->id,
                    'tracking_code' => $labelResult['tracking_code'],
                ]);
            }
            
            return $labelResult;
            
        } catch (\Exception $e) {
            Log::error('Shipping label creation failed', [
                'order_id' => $order->id,
                'rate_id' => $rateId,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'errors' => ['Shipping label creation failed'],
            ];
        }
    }

    /**
     * Track shipment
     */
    public function trackShipment(string $trackingCode): array
    {
        return $this->easyPostService->trackShipment($trackingCode);
    }

    /**
     * Get store address for shipping from system settings
     */
    protected function getStoreAddress(): array
    {
        $storeAddress = SystemSetting::get('store_address', [
            'street_address' => '350 5th Ave',
            'city' => 'New York',
            'state' => 'NY',
            'zip_code' => '10118',
            'country' => 'US',
            'company_name' => 'BarfFoods',
            'phone' => '+1 (555) 123-4567',
            'email' => 'orders@barffoods.com'
        ]);

        // Return in standard format for distance calculation
        return [
            'street_address' => $storeAddress['street_address'],
            'city' => $storeAddress['city'],
            'state' => $storeAddress['state'],
            'zip_code' => $storeAddress['zip_code'],
            'country' => $storeAddress['country'],
            'company_name' => $storeAddress['company_name'] ?? 'BarfFoods',
            'phone' => $storeAddress['phone'] ?? '',
            'email' => $storeAddress['email'] ?? '',
        ];
    }

    /**
     * Format customer address for EasyPost
     */
    protected function formatCustomerAddress(Order $order): array
    {
        $address = $order->userAddress;
        
        if (!$address) {
            throw new \Exception('Order does not have a delivery address');
        }
        
        return [
            'street1' => $address->street_address,
            'city' => $address->city,
            'state' => $address->state,
            'zip' => $address->zip_code,
            'country' => 'US',
        ];
    }

    /**
     * Calculate parcel dimensions based on order items
     */
    protected function calculateParcelDimensions(Order $order): array
    {
        $totalWeight = 0;
        $maxLength = 0;
        $maxWidth = 0;
        $totalHeight = 0;
        
        foreach ($order->orderItems as $item) {
            // Default dimensions per item (should be stored in product table)
            $itemWeight = 8; // ounces per item
            $itemLength = 6;  // inches
            $itemWidth = 4;   // inches
            $itemHeight = 2;   // inches
            
            $totalWeight += $itemWeight * $item->quantity;
            $maxLength = max($maxLength, $itemLength);
            $maxWidth = max($maxWidth, $itemWidth);
            $totalHeight += $itemHeight * $item->quantity;
        }
        
        // Add packaging weight and dimensions
        $totalWeight += 2; // packaging weight
        $maxLength += 2;   // packaging length
        $maxWidth += 2;    // packaging width
        $totalHeight += 1; // packaging height
        
        return [
            'length' => $maxLength,
            'width' => $maxWidth,
            'height' => $totalHeight,
            'weight' => $totalWeight,
        ];
    }

    /**
     * Format rates for display
     */
    protected function formatRatesForDisplay(array $rates): array
    {
        $formattedRates = [];
        
        foreach ($rates as $rate) {
            $formattedRates[] = [
                'id' => $rate['id'],
                'service' => $rate['service'],
                'carrier' => $rate['carrier'],
                'rate' => $rate['rate'],
                'currency' => $rate['currency'],
                'retail_rate' => $rate['retail_rate'] ?? $rate['rate'],
                'list_rate' => $rate['list_rate'] ?? $rate['rate'],
                'delivery_days' => $rate['delivery_days'] ?? null,
                'delivery_date' => $rate['delivery_date'] ?? null,
                'delivery_date_guaranteed' => $rate['delivery_date_guaranteed'] ?? false,
            ];
        }
        
        // Sort by rate (cheapest first)
        usort($formattedRates, function($a, $b) {
            return $a['rate'] <=> $b['rate'];
        });
        
        return $formattedRates;
    }

    /**
     * Get available shipping methods
     */
    public function getAvailableShippingMethods(): array
    {
        return [
            'ground' => [
                'name' => 'Ground Shipping',
                'description' => 'Standard ground delivery',
                'estimated_days' => '3-5 business days',
                'base_cost' => 8.99,
            ],
            'express' => [
                'name' => 'Express Shipping',
                'description' => 'Fast express delivery',
                'estimated_days' => '1-2 business days',
                'base_cost' => 15.99,
            ],
            'overnight' => [
                'name' => 'Overnight Shipping',
                'description' => 'Next day delivery',
                'estimated_days' => '1 business day',
                'base_cost' => 25.99,
            ],
        ];
    }

    /**
     * Calculate package dimensions based on cart items
     */
    protected function calculateCartParcelDimensions(array $cartItems): array
    {
        $totalWeight = 0;
        $maxLength = 0;
        $maxWidth = 0;
        $totalHeight = 0;
        
        foreach ($cartItems as $item) {
            // Use real product dimensions from database with fallbacks
            $itemWeight = $item->product->weight ?? 8; // Default 8 oz per item
            $itemLength = $item->product->length ?? 6; // Default 6 inches
            $itemWidth = $item->product->width ?? 4;   // Default 4 inches  
            $itemHeight = $item->product->height ?? 2; // Default 2 inches
            
            
            $totalWeight += $itemWeight * $item->quantity;
            $maxLength = max($maxLength, $itemLength);
            $maxWidth = max($maxWidth, $itemWidth);
            $totalHeight += $itemHeight * $item->quantity;
        }
        
        // Add packaging weight and dimensions
        $totalWeight += 2; // packaging weight
        $maxLength += 2;   // packaging length
        $maxWidth += 2;    // packaging width
        $totalHeight += 1; // packaging height
        
        return [
            'length' => max($maxLength, 6), // Minimum 6 inches
            'width' => max($maxWidth, 4),   // Minimum 4 inches
            'height' => max($totalHeight, 2), // Minimum 2 inches
            'weight' => max($totalWeight, 4), // Minimum 4 oz
        ];
    }

    /**
     * Calculate distance between two addresses
     */
    protected function calculateDistance(array $fromAddress, array $toAddress): ?float
    {
        try {
            // Use EasyPost to get coordinates and calculate distance
            $fromResult = $this->easyPostService->verifyAddress($fromAddress);
            $toResult = $this->easyPostService->verifyAddress($toAddress);

            if (!$fromResult['is_valid'] || !$toResult['is_valid']) {
                return null;
            }

            // Extract coordinates from verification details
            $fromLat = $fromResult['verification_details']['details']['latitude'] ?? null;
            $fromLng = $fromResult['verification_details']['details']['longitude'] ?? null;
            $toLat = $toResult['verification_details']['details']['latitude'] ?? null;
            $toLng = $toResult['verification_details']['details']['longitude'] ?? null;

            // Use Haversine formula for distance calculation
            return $this->haversineDistance($fromLat, $fromLng, $toLat, $toLng);

        } catch (\Exception $e) {
            Log::warning('Distance calculation failed', [
                'from_address' => $fromAddress,
                'to_address' => $toAddress,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Calculate fast delivery cost based on distance
     */
    protected function calculateFastDeliveryCost(?float $distance): float
    {
        if ($distance === null) {
            return 12.99; // Default cost
        }

        // Fast delivery pricing: $8.99 base + $1.50 per mile
        $baseCost = 8.99;
        $perMileCost = 1.50;
        
        return $baseCost + ($distance * $perMileCost);
    }

    /**
     * Get EasyPost carriers with rates
     */
    protected function getEasyPostCarriers(array $fromAddress, array $toAddress, float $distance, array $cartItems = []): array
    {
        try {
            // Convert addresses to EasyPost format
            $fromAddressEasyPost = [
                'street1' => $fromAddress['street_address'],
                'city' => $fromAddress['city'],
                'state' => $fromAddress['state'],
                'zip' => $fromAddress['zip_code'],
                'country' => $fromAddress['country'] ?? 'US',
                'company' => $fromAddress['company_name'] ?? '',
                'phone' => $fromAddress['phone'] ?? '',
            ];

            $toAddressEasyPost = [
                'street1' => $toAddress['street_address'],
                'city' => $toAddress['city'],
                'state' => $toAddress['state'],
                'zip' => $toAddress['zip_code'],
                'country' => $toAddress['country'] ?? 'US',
            ];

            // Calculate package dimensions based on cart items
            $parcel = $this->calculateCartParcelDimensions($cartItems);
            
            // Create shipment data for EasyPost
            $shipmentData = [
                'from_address' => $fromAddressEasyPost,
                'to_address' => $toAddressEasyPost,
                'parcel' => $parcel
            ];

            $rates = $this->easyPostService->getRates($shipmentData);

            $carriers = [];
            foreach ($rates as $rate) {
                $carriers[] = [
                    'id' => $rate['id'],
                    'name' => $rate['carrier'],
                    'service' => $rate['service'],
                    'cost' => $rate['rate'],
                    'delivery_days' => $rate['delivery_days'] ?? '3-5',
                    'description' => $rate['service'] . ' via ' . $rate['carrier'],
                ];
            }

            return $carriers;

        } catch (\Exception $e) {
            Log::error('Failed to get EasyPost carriers', [
                'from_address' => $fromAddress,
                'to_address' => $toAddress,
                'error' => $e->getMessage()
            ]);

            // NO FALLBACK DATA - Return empty array if EasyPost fails
            return [];
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
}
