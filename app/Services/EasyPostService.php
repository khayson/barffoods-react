<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EasyPostService
{
    protected $apiKey;
    protected $baseUrl;
    protected $testMode;

    public function __construct()
    {
        $this->apiKey = config('services.easypost.api_key');
        $this->baseUrl = config('services.easypost.base_url');
        $this->testMode = config('services.easypost.test_mode');
    }

    /**
     * Check if EasyPost is properly configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->baseUrl);
    }

    /**
     * Get HTTP client with proper configuration
     */
    protected function getHttpClient()
    {
        $client = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(config('services.easypost.timeout', 30));

        // Only disable SSL verification in development if explicitly configured
        if (!config('services.easypost.verify_ssl', true)) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    /**
     * Verify address using EasyPost Address Verification API
     */
    public function verifyAddress(array $addressData): array
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('EasyPost is not properly configured. Please set EASYPOST_API_KEY in your environment.');
            }

            $response = $this->getHttpClient()->post($this->baseUrl . '/addresses', [
                'verify' => ['delivery'],
                'street1' => $addressData['street_address'],
                'city' => $addressData['city'],
                'state' => $addressData['state'],
                'zip' => $addressData['zip_code'],
                'country' => 'US',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'is_valid' => true,
                    'verified_address' => [
                        'street1' => $data['street1'] ?? $addressData['street_address'],
                        'street2' => $data['street2'] ?? '',
                        'city' => $data['city'] ?? $addressData['city'],
                        'state' => $data['state'] ?? $addressData['state'],
                        'zip' => $data['zip'] ?? $addressData['zip_code'],
                        'country' => $data['country'] ?? 'US',
                    ],
                    'verification_details' => $data['verifications']['delivery'] ?? null,
                    'suggestions' => $this->extractSuggestions($data),
                ];
            }

            return [
                'is_valid' => false,
                'error' => 'Address verification failed: ' . ($response->json()['error']['message'] ?? 'Unknown error'),
                'raw_response' => $response->json(),
            ];

        } catch (\Exception $e) {
            Log::error('EasyPost address verification failed', [
                'address' => $addressData,
                'error' => $e->getMessage()
            ]);

            return [
                'is_valid' => false,
                'error' => 'Address verification service unavailable: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get shipping rates for a shipment
     */
    public function getShippingRates(array $fromAddress, array $toAddress, array $parcel): array
    {
        try {
            // Create from address
            if (!$this->isConfigured()) {
                throw new \Exception('EasyPost is not properly configured. Please set EASYPOST_API_KEY in your environment.');
            }

            // Convert fromAddress format to EasyPost format
            $easyPostFromAddress = [
                'street1' => $fromAddress['street_address'],
                'city' => $fromAddress['city'],
                'state' => $fromAddress['state'],
                'zip' => $fromAddress['zip_code'],
                'country' => $fromAddress['country'],
                'company' => $fromAddress['company_name'] ?? null,
                'phone' => $fromAddress['phone'] ?? null,
                'email' => $fromAddress['email'] ?? null,
            ];
            
            $fromAddressResponse = $this->getHttpClient()->post($this->baseUrl . '/addresses', $easyPostFromAddress);

            if (!$fromAddressResponse->successful()) {
                throw new \Exception('Failed to create from address');
            }
            $fromAddressData = $fromAddressResponse->json();

            // Create to address
            $toAddressResponse = $this->getHttpClient()->post($this->baseUrl . '/addresses', $toAddress);

            if (!$toAddressResponse->successful()) {
                throw new \Exception('Failed to create to address');
            }
            $toAddressData = $toAddressResponse->json();

            // Create parcel
            $parcelResponse = $this->getHttpClient()->post($this->baseUrl . '/parcels', $parcel);

            if (!$parcelResponse->successful()) {
                throw new \Exception('Failed to create parcel');
            }
            $parcelData = $parcelResponse->json();

            // Create shipment with full address and parcel objects (EasyPost API format)
            $shipmentResponse = $this->getHttpClient()->post($this->baseUrl . '/shipments', [
                'shipment' => [
                    'to_address' => $toAddress,
                    'from_address' => $easyPostFromAddress,
                    'parcel' => $parcel,
                ]
            ]);

            if ($shipmentResponse->successful()) {
                $shipmentData = $shipmentResponse->json();
                
                return [
                    'success' => true,
                    'rates' => $shipmentData['rates'] ?? [],
                    'shipment_id' => $shipmentData['id'],
                ];
            }

            return [
                'success' => false,
                'error' => 'Failed to get shipping rates: ' . ($shipmentResponse->json()['error']['message'] ?? 'Unknown error'),
                'raw_response' => $shipmentResponse->json(),
            ];

        } catch (\Exception $e) {
            Log::error('EasyPost shipping rates failed', [
                'from_address' => $fromAddress,
                'to_address' => $toAddress,
                'parcel' => $parcel,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Shipping rates service unavailable: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Create shipping label
     */
    public function createLabel(string $shipmentId, string $rateId): array
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('EasyPost is not properly configured. Please set EASYPOST_API_KEY in your environment.');
            }

            $response = $this->getHttpClient()->post($this->baseUrl . '/shipments/' . $shipmentId . '/buy', [
                'rate' => ['id' => $rateId],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'label_url' => $data['postage_label']['label_url'] ?? null,
                    'tracking_code' => $data['tracking_code'] ?? null,
                    'shipment_id' => $data['id'],
                    'tracker_id' => $data['tracker']['id'] ?? null,
                    'carrier' => $data['selected_rate']['carrier'] ?? null,
                    'service' => $data['selected_rate']['service'] ?? null,
                    'estimated_delivery_date' => $data['selected_rate']['est_delivery_days'] ?? null,
                ];
            }

            return [
                'success' => false,
                'error' => 'Failed to create shipping label: ' . ($response->json()['error']['message'] ?? 'Unknown error'),
                'raw_response' => $response->json(),
            ];

        } catch (\Exception $e) {
            Log::error('EasyPost label creation failed', [
                'shipment_id' => $shipmentId,
                'rate_id' => $rateId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Label creation service unavailable: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Track shipment
     */
    public function trackShipment(string $trackingCode): array
    {
        try {
            if (!$this->isConfigured()) {
                throw new \Exception('EasyPost is not properly configured. Please set EASYPOST_API_KEY in your environment.');
            }

            $response = $this->getHttpClient()->get($this->baseUrl . '/trackers/' . $trackingCode);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'tracking_details' => $data['tracking_details'] ?? [],
                    'status' => $data['status'] ?? 'unknown',
                    'carrier' => $data['carrier'] ?? 'unknown',
                ];
            }

            return [
                'success' => false,
                'error' => 'Failed to track shipment: ' . ($response->json()['error']['message'] ?? 'Unknown error'),
                'raw_response' => $response->json(),
            ];

        } catch (\Exception $e) {
            Log::error('EasyPost tracking failed', [
                'tracking_code' => $trackingCode,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Tracking service unavailable: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Extract suggestions from EasyPost response
     */
    protected function extractSuggestions(array $data): array
    {
        $suggestions = [];
        
        if (isset($data['verifications']['delivery']['details'])) {
            $details = $data['verifications']['delivery']['details'];
            
            if (isset($details['suggestions'])) {
                foreach ($details['suggestions'] as $suggestion) {
                    $suggestions[] = [
                        'type' => $suggestion['type'] ?? 'unknown',
                        'message' => $suggestion['message'] ?? '',
                        'suggestion' => $suggestion['suggestion'] ?? '',
                    ];
                }
            }
        }
        
        return $suggestions;
    }

    /**
     * Format address for EasyPost API
     */
    public function formatAddressForAPI(array $addressData): array
    {
        return [
            'street1' => $addressData['street_address'],
            'city' => $addressData['city'],
            'state' => $addressData['state'],
            'zip' => $addressData['zip_code'],
            'country' => 'US',
        ];
    }

    /**
     * Get shipping rates from EasyPost
     */
    public function getRates(array $shipmentData): array
    {
        try {
            // Create addresses
            $fromAddress = $this->createAddress($shipmentData['from_address']);
            $toAddress = $this->createAddress($shipmentData['to_address']);
            
            // Create parcel
            $parcel = $this->createParcel($shipmentData['parcel']);
            
            
            // Create shipment
            $shipment = $this->createShipment($fromAddress, $toAddress, $parcel);
            
            // Get rates
            $response = $this->getHttpClient()->get($this->baseUrl . '/shipments/' . $shipment['id'] . '/rates');

            if ($response->successful()) {
                $data = $response->json();
                $rates = [];
                
                foreach ($data['rates'] as $rate) {
                    $rates[] = [
                        'id' => $rate['id'],
                        'carrier' => $rate['carrier'],
                        'service' => $rate['service'],
                        'rate' => (float) $rate['rate'],
                        'delivery_days' => $rate['delivery_days'] ?? null,
                        'delivery_date' => $rate['delivery_date'] ?? null,
                    ];
                }
                
                return $rates;
            }

            throw new \Exception('Failed to get rates from EasyPost');

        } catch (\Exception $e) {
            Log::error('EasyPost getRates failed', [
                'shipment_data' => $shipmentData,
                'error' => $e->getMessage()
            ]);

            // NO FALLBACK DATA - Return empty array if EasyPost fails
            return [];
        }
    }

    /**
     * Create address in EasyPost
     */
    protected function createAddress(array $addressData): array
    {
        $response = $this->getHttpClient()->post($this->baseUrl . '/addresses', [
            'street1' => $addressData['street_address'] ?? $addressData['street1'],
            'city' => $addressData['city'],
            'state' => $addressData['state'],
            'zip' => $addressData['zip_code'] ?? $addressData['zip'],
            'country' => $addressData['country'] ?? 'US',
            'company' => $addressData['company'] ?? '',
            'phone' => $addressData['phone'] ?? '',
        ]);

        if ($response->successful()) {
            return $response->json();
        }

        throw new \Exception('Failed to create address in EasyPost');
    }

    /**
     * Create parcel in EasyPost
     */
    protected function createParcel(array $parcelData): array
    {
        $response = $this->getHttpClient()->post($this->baseUrl . '/parcels', [
            'length' => $parcelData['length'],
            'width' => $parcelData['width'],
            'height' => $parcelData['height'],
            'weight' => $parcelData['weight'],
        ]);

        if ($response->successful()) {
            return $response->json();
        }

        throw new \Exception('Failed to create parcel in EasyPost');
    }

    /**
     * Create shipment in EasyPost
     */
    protected function createShipment(array $fromAddress, array $toAddress, array $parcel): array
    {
        $requestData = [
            'shipment' => [
                'from_address' => $fromAddress,
                'to_address' => $toAddress,
                'parcel' => $parcel,
            ]
        ];
        
        
        $response = $this->getHttpClient()->post($this->baseUrl . '/shipments', $requestData);

        if ($response->successful()) {
            $result = $response->json();
            return $result;
        }

        Log::error('Failed to create shipment in EasyPost', [
            'from_address_id' => $fromAddress['id'],
            'to_address_id' => $toAddress['id'],
            'parcel_id' => $parcel['id'],
            'status' => $response->status(),
            'response' => $response->body()
        ]);
        throw new \Exception('Failed to create shipment in EasyPost');
    }

    /**
     * Format parcel for EasyPost API
     */
    public function formatParcelForAPI(array $parcelData): array
    {
        return [
            'length' => $parcelData['length'] ?? 10, // inches
            'width' => $parcelData['width'] ?? 8,    // inches
            'height' => $parcelData['height'] ?? 4,   // inches
            'weight' => $parcelData['weight'] ?? 1,   // ounces
        ];
    }
}
