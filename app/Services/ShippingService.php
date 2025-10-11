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
            'street_address' => '123 Main Street',
            'city' => 'New York',
            'state' => 'NY',
            'zip_code' => '10001',
            'country' => 'US',
            'company_name' => 'BarfFoods',
            'phone' => '+1 (555) 123-4567',
            'email' => 'orders@barffoods.com'
        ]);

        // Convert to EasyPost format
        return [
            'street1' => $storeAddress['street_address'],
            'city' => $storeAddress['city'],
            'state' => $storeAddress['state'],
            'zip' => $storeAddress['zip_code'],
            'country' => $storeAddress['country'],
            'company' => $storeAddress['company_name'] ?? 'BarfFoods',
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
}
