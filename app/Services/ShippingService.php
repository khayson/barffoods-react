<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SystemSetting;
use App\Exceptions\Shipping\ShippingException;
use App\Jobs\RetryShippingLabelJob;
use App\Notifications\ShippingLabelCreatedNotification;
use Illuminate\Support\Facades\Log;

class ShippingService
{
    protected $easyPostService;
    protected $maxRetries = 3;
    protected $retryDelay = 1000; // milliseconds

    public function __construct(EasyPostService $easyPostService)
    {
        $this->easyPostService = $easyPostService;
    }

    /**
     * Execute a callable with retry logic and exponential backoff
     */
    protected function retryWithBackoff(callable $callback, string $operation)
    {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->maxRetries) {
            try {
                return $callback();
            } catch (\Exception $e) {
                $attempt++;
                $lastException = $e;

                if ($attempt >= $this->maxRetries) {
                    break;
                }

                // Exponential backoff: 1s, 2s, 4s
                $delay = $this->retryDelay * pow(2, $attempt - 1);
                
                Log::warning("Shipping operation failed, retrying", [
                    'operation' => $operation,
                    'attempt' => $attempt,
                    'max_retries' => $this->maxRetries,
                    'delay_ms' => $delay,
                    'error' => $e->getMessage(),
                ]);

                usleep($delay * 1000); // Convert to microseconds
            }
        }

        // All retries failed
        Log::error("Shipping operation failed after all retries", [
            'operation' => $operation,
            'attempts' => $attempt,
            'error' => $lastException->getMessage(),
        ]);

        throw new ShippingException(
            "Shipping operation '{$operation}' failed after {$attempt} attempts: " . $lastException->getMessage(),
            500,
            $lastException
        );
    }

    /**
     * Get delivery methods and carriers for checkout
     */
    public function getDeliveryMethods(array $customerAddress, array $cartItems = []): array
    {
        try {
            // Get store address
            $storeAddress = $this->getStoreAddress();
            
            // Calculate distance for local delivery cost (optional, fallback to 0 if fails)
            $distance = $this->calculateDistance($storeAddress, $customerAddress) ?? 0;
            
            // Get delivery methods and carriers from EasyPost - NO MOCK DATA
            $deliveryMethods = [];
            $carriers = [];
            
            // Always provide Fast Delivery option (local delivery)
            $fastDeliveryCost = $this->calculateFastDeliveryCost($distance);
            $deliveryMethods[] = [
                'id' => 'fast_delivery',
                'name' => 'Local Express',
                'type' => 'fast_delivery',
                'description' => 'Our local delivery service for faster delivery',
                'estimated_days' => '1-2 business days',
                'cost' => $fastDeliveryCost,
            ];
            
            // Always try to get EasyPost carriers (distance is not required for EasyPost)
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
     * Calculate shipping rates for an order (legacy method for single shipments)
     */
    public function calculateShippingRates(Order $order): array
    {
        try {
            // Create cache key based on order details
            $customerAddress = $this->formatCustomerAddress($order);
            $parcel = $this->calculateParcelDimensions($order);
            $cacheKey = 'shipping_rates_' . md5(json_encode([
                'zip' => $customerAddress['zip'] ?? '',
                'weight' => $parcel['weight'] ?? 0,
                'length' => $parcel['length'] ?? 0,
                'width' => $parcel['width'] ?? 0,
                'height' => $parcel['height'] ?? 0,
            ]));
            
            // Cache shipping rates for 15 minutes
            return \Cache::remember($cacheKey, 900, function () use ($order) {
                // Use retry logic for rate calculation
                return $this->retryWithBackoff(function () use ($order) {
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
                    
                    // Throw exception to trigger retry
                    throw new \Exception($ratesResult['error'] ?? 'Unknown error in rate calculation');
                }, 'calculate_shipping_rates');
            });
            
        } catch (ShippingException $e) {
            // Already logged and formatted by retryWithBackoff
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
            
        } catch (\Exception $e) {
            Log::error('Shipping rate calculation failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => 'Shipping rate calculation failed: ' . $e->getMessage(),
            ];
        }
    }


    /**
     * Create shipping label for an order (legacy method for single shipments)
     */
    public function createShippingLabel(Order $order, string $rateId): array
    {
        try {
            // Use retry logic for label creation
            $labelResult = $this->retryWithBackoff(function () use ($order, $rateId) {
                // Check if order already has a shipment_id
                if ($order->shipment_id) {
                    \Log::info('Using existing shipment ID for label creation', [
                        'order_id' => $order->id,
                        'shipment_id' => $order->shipment_id
                    ]);
                    $shipmentId = $order->shipment_id;
                    
                    // Get rates for the existing shipment
                    $ratesResult = $this->easyPostService->getRatesForShipment($shipmentId);
                    if (!$ratesResult['success']) {
                        throw new \Exception($ratesResult['error']);
                    }
                    $rates = $ratesResult['rates'];
                } else {
                    // Create new shipment and get rates
                    $ratesResult = $this->calculateShippingRates($order);
                    
                    if (!$ratesResult['success']) {
                        throw new \Exception($ratesResult['error']);
                    }
                    
                    $shipmentId = $ratesResult['shipment_id'];
                    $rates = $ratesResult['rates'];
                    
                    // Store the shipment_id for future use (set directly to bypass guarded)
                    $order->shipment_id = $shipmentId;
                    $order->save();
                }
                
                // Find a matching rate or use the first available rate
                $selectedRate = null;
                foreach ($rates as $rate) {
                    if ($rate['id'] === $rateId) {
                        $selectedRate = $rate;
                        break;
                    }
                }
                
                // If the original rate ID doesn't exist, use the first available rate
                if (!$selectedRate && !empty($rates)) {
                    $selectedRate = $rates[0];
                    \Log::warning('Original rate ID not found, using first available rate', [
                        'order_id' => $order->id,
                        'original_rate_id' => $rateId,
                        'new_rate_id' => $selectedRate['id']
                    ]);
                }
                
                if (!$selectedRate) {
                    throw new \Exception('No shipping rates available for this order');
                }
                
                // Create the label using the selected rate
                $labelResult = $this->easyPostService->createLabel($shipmentId, $selectedRate['id']);
                
                \Log::info('EasyPost label creation result', [
                    'order_id' => $order->id,
                    'success' => $labelResult['success'],
                    'has_tracking_code' => isset($labelResult['tracking_code']) && !empty($labelResult['tracking_code']),
                    'has_label_url' => isset($labelResult['label_url']) && !empty($labelResult['label_url']),
                    'tracking_code' => $labelResult['tracking_code'] ?? 'null',
                    'label_url' => $labelResult['label_url'] ?? 'null',
                ]);
                
                if (!$labelResult['success']) {
                    throw new \Exception($labelResult['error'] ?? 'Label creation failed');
                }
                
                return $labelResult;
            }, 'create_shipping_label');
            
            // If successful, update the order
            if ($labelResult['success']) {
                // Calculate estimated delivery date from days
                $estimatedDeliveryDate = null;
                if (isset($labelResult['estimated_delivery_date']) && is_numeric($labelResult['estimated_delivery_date'])) {
                    $estimatedDeliveryDate = now()->addDays($labelResult['estimated_delivery_date']);
                }
                
                // Refresh order to get latest version
                $order->refresh();
                
                // Update order with tracking information - retry on optimistic locking failure
                $maxRetries = 3;
                $retryCount = 0;
                $updateResult = false;
                
                while (!$updateResult && $retryCount < $maxRetries) {
                    try {
                        // Set attributes directly (bypasses mass assignment protection for guarded fields)
                        $order->tracking_code = $labelResult['tracking_code'];
                        $order->label_url = $labelResult['label_url'];
                        $order->tracker_id = $labelResult['tracker_id'];
                        $order->carrier = $labelResult['carrier'] ?? $order->carrier;
                        $order->service = $labelResult['service'] ?? $order->service;
                        $order->estimated_delivery_date = $estimatedDeliveryDate;
                        $order->delivery_status = 'pre_transit';
                        $order->last_tracking_update = now();
                        $order->status = 'processing';
                        
                        // Save with optimistic locking check
                        $updateResult = $order->save();
                        
                        if ($updateResult) {
                            Log::info('Successfully updated order with tracking information', [
                                'order_id' => $order->id,
                                'tracking_code' => $labelResult['tracking_code'],
                                'label_url' => $labelResult['label_url'],
                                'retry_count' => $retryCount
                            ]);
                            
                            // Send shipping label created notification
                            try {
                                if ($order->user) {
                                    $order->user->notify(new ShippingLabelCreatedNotification($order));
                                    
                                    Log::info('Shipping label notification sent', [
                                        'order_id' => $order->id,
                                        'tracking_code' => $labelResult['tracking_code']
                                    ]);
                                }
                            } catch (\Exception $e) {
                                Log::error('Failed to send shipping label notification', [
                                    'order_id' => $order->id,
                                    'error' => $e->getMessage()
                                ]);
                            }
                        } else {
                            // Update returned false - increment retry and try again
                            $retryCount++;
                            if ($retryCount < $maxRetries) {
                                Log::warning('Order update returned false, retrying...', [
                                    'order_id' => $order->id,
                                    'retry' => $retryCount,
                                    'tracking_code' => $labelResult['tracking_code'],
                                ]);
                                $order->refresh(); // Refresh before retry
                                usleep(100000); // Wait 100ms before retry
                            } else {
                                Log::error('Order update failed after all retries (returned false)', [
                                    'order_id' => $order->id,
                                    'tracking_code' => $labelResult['tracking_code'],
                                    'label_url' => $labelResult['label_url'],
                                ]);
                            }
                        }
                    } catch (\Exception $e) {
                        $retryCount++;
                        if ($retryCount < $maxRetries) {
                            Log::warning('Order update threw exception, retrying...', [
                                'order_id' => $order->id,
                                'retry' => $retryCount,
                                'error' => $e->getMessage()
                            ]);
                            $order->refresh(); // Refresh before retry
                            usleep(100000); // Wait 100ms before retry
                        } else {
                            Log::error('Failed to update order with tracking information after retries', [
                                'order_id' => $order->id,
                                'tracking_code' => $labelResult['tracking_code'],
                                'label_url' => $labelResult['label_url'],
                                'error' => $e->getMessage()
                            ]);
                        }
                    }
                }
                
                // Create initial tracking event
                \App\Models\ShipmentTrackingEvent::create([
                    'order_id' => $order->id,
                    'tracking_code' => $labelResult['tracking_code'],
                    'status' => 'pre_transit',
                    'message' => 'Shipping label created',
                    'carrier' => $labelResult['carrier'] ?? $order->carrier,
                    'occurred_at' => now(),
                    'source' => 'label_creation',
                ]);
                
                Log::info('Shipping label created successfully', [
                    'order_id' => $order->id,
                    'tracking_code' => $labelResult['tracking_code'],
                    'tracker_id' => $labelResult['tracker_id'],
                ]);
            }
            
            return $labelResult;
            
        } catch (ShippingException $e) {
            // Already logged and formatted by retryWithBackoff
            $labelResult = [
                'success' => false,
                'error' => $e->getMessage(),
            ];

            // Queue job to retry label creation
            Log::info('Queueing retry job for failed shipping label', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'rate_id' => $rateId,
            ]);

            RetryShippingLabelJob::dispatch($order->id, $rateId)
                ->delay(now()->addMinutes(5)); // First retry after 5 minutes
            
            return $labelResult;
            
        } catch (\Exception $e) {
            Log::error('Shipping label creation failed', [
                'order_id' => $order->id,
                'rate_id' => $rateId,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => 'Shipping label creation failed: ' . $e->getMessage(),
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
        // First try to get structured address from userAddress relationship
        $address = $order->userAddress;
        
        if ($address) {
            return [
                'street1' => $address->street_address,
                'city' => $address->city,
                'state' => $address->state,
                'zip' => $address->zip_code,
                'country' => 'US',
            ];
        }
        
        // Fallback: parse the delivery_address string
        if ($order->delivery_address) {
            return $this->parseDeliveryAddressString($order->delivery_address);
        }
        
        throw new \Exception('Order does not have a delivery address');
    }
    
    /**
     * Parse delivery address string into structured format
     */
    protected function parseDeliveryAddressString(string $addressString): array
    {
        // Try to parse common address formats
        // Format: "Street Address, City, State ZIP"
        // Example: "East Huron River Service Drive, Ann Arbor, Michigan 48105"
        
        $parts = explode(',', $addressString);
        
        if (count($parts) >= 3) {
            $street1 = trim($parts[0]);
            $city = trim($parts[1]);
            
            // Parse state and ZIP from the last part
            $stateZip = trim($parts[2]);
            $stateZipParts = explode(' ', $stateZip);
            
            if (count($stateZipParts) >= 2) {
                $zip = array_pop($stateZipParts); // Last part is ZIP
                $state = implode(' ', $stateZipParts); // Everything else is state
                
                return [
                    'street1' => $street1,
                    'city' => $city,
                    'state' => $state,
                    'zip' => $zip,
                    'country' => 'US',
                ];
            }
        }
        
        // If parsing fails, throw an error
        throw new \Exception('Unable to parse delivery address: ' . $addressString);
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
            // Handle both array and object formats
            $product = is_array($item) ? $item['product'] : $item->product;
            $quantity = is_array($item) ? $item['quantity'] : $item->quantity;
            
            // Use real product dimensions from database with fallbacks
            $itemWeight = (is_array($product) ? ($product['weight'] ?? 8) : ($product->weight ?? 8)); // Default 8 oz per item
            $itemLength = (is_array($product) ? ($product['length'] ?? 6) : ($product->length ?? 6)); // Default 6 inches
            $itemWidth = (is_array($product) ? ($product['width'] ?? 4) : ($product->width ?? 4));   // Default 4 inches  
            $itemHeight = (is_array($product) ? ($product['height'] ?? 2) : ($product->height ?? 2)); // Default 2 inches
            
            $totalWeight += $itemWeight * $quantity;
            $maxLength = max($maxLength, $itemLength);
            $maxWidth = max($maxWidth, $itemWidth);
            $totalHeight += $itemHeight * $quantity;
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
     * Calculate distance between two US addresses using ZIP code lookup
     * 
     * This method:
     * 1. First tries to get cached distance from zip_code_distances table
     * 2. If not cached, calculates using ZIP code coordinates
     * 3. Caches the result for future lookups
     * 4. Falls back to null if ZIP codes not found in database
     */
    protected function calculateDistance(array $fromAddress, array $toAddress): ?float
    {
        try {
            $fromZip = $fromAddress['zip_code'] ?? null;
            $toZip = $toAddress['zip_code'] ?? null;

            if (!$fromZip || !$toZip) {
                Log::warning('Missing ZIP codes for distance calculation', [
                    'from_address' => $fromAddress,
                    'to_address' => $toAddress,
                ]);
                return null;
            }

            // Try to get cached distance first
            $distance = \App\Models\ZipCodeDistance::getDistance($fromZip, $toZip);

            if ($distance !== null) {
                return $distance;
            }

            // If not cached, calculate and cache it
            $distance = \App\Models\ZipCodeDistance::calculateAndCache($fromZip, $toZip);

            if ($distance !== null) {
                return $distance;
            }

            // If ZIP codes not in database, log warning
            Log::warning('ZIP codes not found in database', [
                'from_zip' => $fromZip,
                'to_zip' => $toZip,
                'note' => 'Import ZIP code database using: php artisan db:seed --class=ZipCodeSeeder',
            ]);

            return null;

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
     * Calculate fast delivery cost based on distance using zone-based flat rates
     * 
     * Zone-based pricing for predictable costs:
     * - Local Zone (0-5 miles): $8.99
     * - Metro Zone (5-15 miles): $14.99
     * - Regional Zone (15-30 miles): $24.99
     * - Extended Zone (30+ miles): $39.99
     * - Unknown distance: $12.99 (fallback)
     */
    protected function calculateFastDeliveryCost(?float $distance): float
    {
        // If distance calculation fails, use reasonable fallback
        if ($distance === null) {
            return 12.99; // Fallback cost
        }

        // Zone-based flat rate pricing
        if ($distance <= 5) {
            return 8.99;  // Local zone (0-5 miles)
        } elseif ($distance <= 15) {
            return 14.99; // Metro zone (5-15 miles)
        } elseif ($distance <= 30) {
            return 24.99; // Regional zone (15-30 miles)
        } else {
            return 39.99; // Extended zone (30+ miles)
        }
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
                'error' => $e->getMessage(),
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
