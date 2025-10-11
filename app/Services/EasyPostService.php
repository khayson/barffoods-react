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
     * Verify address using EasyPost Address Verification API
     */
    public function verifyAddress(array $addressData): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/addresses', [
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
                'errors' => ['Address verification failed'],
                'raw_response' => $response->json(),
            ];

        } catch (\Exception $e) {
            Log::error('EasyPost address verification failed', [
                'address' => $addressData,
                'error' => $e->getMessage()
            ]);

            return [
                'is_valid' => false,
                'errors' => ['Address verification service unavailable'],
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
            $fromAddressResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/addresses', $fromAddress);

            if (!$fromAddressResponse->successful()) {
                throw new \Exception('Failed to create from address');
            }
            $fromAddressData = $fromAddressResponse->json();

            // Create to address
            $toAddressResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/addresses', $toAddress);

            if (!$toAddressResponse->successful()) {
                throw new \Exception('Failed to create to address');
            }
            $toAddressData = $toAddressResponse->json();

            // Create parcel
            $parcelResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/parcels', $parcel);

            if (!$parcelResponse->successful()) {
                throw new \Exception('Failed to create parcel');
            }
            $parcelData = $parcelResponse->json();

            // Create shipment
            $shipmentResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/shipments', [
                'to_address' => $toAddressData['id'],
                'from_address' => $fromAddressData['id'],
                'parcel' => $parcelData['id'],
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
                'errors' => ['Failed to get shipping rates'],
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
                'errors' => ['Shipping rates service unavailable'],
            ];
        }
    }

    /**
     * Create shipping label
     */
    public function createLabel(string $shipmentId, string $rateId): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/shipments/' . $shipmentId . '/buy', [
                'rate' => ['id' => $rateId],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'label_url' => $data['postage_label']['label_url'] ?? null,
                    'tracking_code' => $data['tracking_code'] ?? null,
                    'shipment_id' => $data['id'],
                ];
            }

            return [
                'success' => false,
                'errors' => ['Failed to create shipping label'],
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
                'errors' => ['Label creation service unavailable'],
            ];
        }
    }

    /**
     * Track shipment
     */
    public function trackShipment(string $trackingCode): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->get($this->baseUrl . '/trackers/' . $trackingCode);

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
                'errors' => ['Failed to track shipment'],
                'raw_response' => $response->json(),
            ];

        } catch (\Exception $e) {
            Log::error('EasyPost tracking failed', [
                'tracking_code' => $trackingCode,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'errors' => ['Tracking service unavailable'],
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
