<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AddressValidationService
{
    protected $easyPostService;

    public function __construct(EasyPostService $easyPostService)
    {
        $this->easyPostService = $easyPostService;
    }
    /**
     * Validate address using free APIs
     */
    public function validateAddress(array $addressData): array
    {
        $result = [
            'is_valid' => true,
            'errors' => [],
            'suggestions' => [],
            'coordinates' => null,
        ];

        try {
            // Basic validation first
            $this->validateBasicFormat($addressData, $result);
            
            if (!$result['is_valid']) {
                return $result;
            }

            // Try EasyPost verification first
            $easyPostResult = $this->easyPostService->verifyAddress($addressData);
            
            if ($easyPostResult['is_valid']) {
                $result['verified_address'] = $easyPostResult['verified_address'];
                $result['suggestions'] = array_merge($result['suggestions'], $easyPostResult['suggestions']);
                $result['verification_details'] = $easyPostResult['verification_details'];
            } else {
                // Fallback to free APIs if EasyPost fails
                $this->validateWithFreeAPI($addressData, $result);
            }

        } catch (\Exception $e) {
            Log::warning('Address validation error', [
                'address' => $addressData,
                'error' => $e->getMessage()
            ]);
            
            // If validation fails, still allow the address but log it
            $result['is_valid'] = true;
            $result['errors'][] = 'Address validation unavailable, but address accepted.';
        }

        return $result;
    }

    /**
     * Basic format validation
     */
    protected function validateBasicFormat(array $addressData, array &$result): void
    {
        // Check required fields
        $requiredFields = ['street_address', 'city', 'state', 'zip_code'];
        foreach ($requiredFields as $field) {
            if (empty($addressData[$field])) {
                $result['is_valid'] = false;
                $result['errors'][] = "Field '{$field}' is required.";
            }
        }

        if (!$result['is_valid']) {
            return;
        }

        // ZIP code format validation
        if (!preg_match('/^\d{5}(-\d{4})?$/', $addressData['zip_code'])) {
            $result['is_valid'] = false;
            $result['errors'][] = 'Invalid ZIP code format. Use format: 12345 or 12345-6789';
        }

        // Address length validation
        if (strlen($addressData['street_address']) < 5) {
            $result['is_valid'] = false;
            $result['errors'][] = 'Street address seems too short.';
        }

        if (strlen($addressData['city']) < 2) {
            $result['is_valid'] = false;
            $result['errors'][] = 'City name seems too short.';
        }

        if (strlen($addressData['state']) < 2) {
            $result['is_valid'] = false;
            $result['errors'][] = 'State name seems too short.';
        }
    }

    /**
     * Validate with free APIs (optional)
     */
    protected function validateWithFreeAPI(array $addressData, array &$result): void
    {
        // Option 1: Use Nominatim (OpenStreetMap) - Free
        $this->validateWithNominatim($addressData, $result);
        
        // Option 2: Use USPS API (free for basic validation)
        // $this->validateWithUSPS($addressData, $result);
    }

    /**
     * Validate using Nominatim (OpenStreetMap) - Free
     */
    protected function validateWithNominatim(array $addressData, array &$result): void
    {
        try {
            $fullAddress = $this->buildFullAddress($addressData);
            
            $response = Http::timeout(5)
                ->withoutVerifying()
                ->withHeaders(['User-Agent' => 'BarfFoods/1.0'])
                ->get('https://nominatim.openstreetmap.org/search', [
                'q' => $fullAddress,
                'format' => 'json',
                'limit' => 1,
                'countrycodes' => 'us', // Limit to US addresses
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (!empty($data)) {
                    $location = $data[0];
                    $result['coordinates'] = [
                        'latitude' => (float) $location['lat'],
                        'longitude' => (float) $location['lon'],
                    ];
                    
                    // Check if the found address matches reasonably well
                    $foundAddress = strtolower($location['display_name']);
                    $inputAddress = strtolower($fullAddress);
                    
                    // Simple similarity check
                    $similarity = similar_text($foundAddress, $inputAddress, $percent);
                    if ($percent < 60) {
                        $result['suggestions'][] = 'Address found but may not match exactly: ' . $location['display_name'];
                    }
                } else {
                    $result['suggestions'][] = 'Address not found in our database. Please verify the address.';
                }
            }
        } catch (\Exception $e) {
            Log::warning('Nominatim validation failed', [
                'address' => $addressData,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Build full address string
     */
    protected function buildFullAddress(array $addressData): string
    {
        $parts = [];
        
        if (!empty($addressData['street_address'])) {
            $parts[] = $addressData['street_address'];
        }
        if (!empty($addressData['city'])) {
            $parts[] = $addressData['city'];
        }
        if (!empty($addressData['state'])) {
            $parts[] = $addressData['state'];
        }
        if (!empty($addressData['zip_code'])) {
            $parts[] = $addressData['zip_code'];
        }
        
        return implode(', ', $parts);
    }

    /**
     * Check if address is within delivery zones (basic implementation)
     */
    public function isWithinDeliveryZone(array $addressData): bool
    {
        // Basic delivery zone check based on ZIP code ranges
        $zipCode = $addressData['zip_code'];
        
        // Remove any dashes from ZIP code
        $zipCode = str_replace('-', '', $zipCode);
        
        // Convert to integer for range checking
        $zipInt = (int) substr($zipCode, 0, 5);
        
        // Define delivery zones by ZIP code ranges (example for NYC area)
        $deliveryZones = [
            [10001, 10299], // Manhattan
            [10301, 10314], // Staten Island
            [10451, 10475], // Bronx
            [11001, 11005], // Queens
            [11201, 11256], // Brooklyn
        ];
        
        foreach ($deliveryZones as $zone) {
            if ($zipInt >= $zone[0] && $zipInt <= $zone[1]) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get address suggestions based on type and context
     */
    public function getSuggestions(string $query, string $type, array $context = []): array
    {
        try {
            switch ($type) {
                case 'street':
                    return $this->getStreetSuggestions($query, $context);
                case 'city':
                    return $this->getCitySuggestions($query, $context);
                case 'state':
                    return $this->getStateSuggestions($query, $context);
                case 'zip':
                    return $this->getZipSuggestions($query, $context);
                default:
                    return [];
            }
        } catch (\Exception $e) {
            Log::warning('Address suggestions failed', [
                'query' => $query,
                'type' => $type,
                'context' => $context,
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

    /**
     * Get street address suggestions
     */
    protected function getStreetSuggestions(string $query, array $context): array
    {
        try {
            // Use Nominatim for street suggestions
            $searchQuery = $query;
            if (!empty($context['city'])) {
                $searchQuery .= ', ' . $context['city'];
            }
            if (!empty($context['state'])) {
                $searchQuery .= ', ' . $context['state'];
            }

            $response = Http::timeout(5)
                ->withoutVerifying()
                ->withHeaders(['User-Agent' => 'BarfFoods/1.0'])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $searchQuery,
                    'format' => 'json',
                    'limit' => 10,
                    'addressdetails' => 1,
                    'countrycodes' => 'us',
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $suggestions = [];

                foreach ($data as $item) {
                    $address = $item['address'] ?? [];
                    $streetAddress = $this->buildStreetAddress($address);
                    
                             if (!empty($streetAddress)) {
                                 $suggestions[] = [
                                     'id' => 'street_' . md5($item['display_name'] . '_' . $item['place_id']),
                                     'street_address' => $streetAddress,
                                     'city' => $address['city'] ?? $address['town'] ?? $address['village'] ?? '',
                                     'state' => $address['state'] ?? '',
                                     'zip_code' => $address['postcode'] ?? '',
                                     'country' => $address['country'] ?? 'US',
                                     'formatted_address' => $item['display_name'],
                                 ];
                             }
                }

                return array_slice($suggestions, 0, 5);
            }

            return [];

        } catch (\Exception $e) {
            Log::warning('Street suggestions failed', [
                'query' => $query,
                'context' => $context,
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

    /**
     * Get city suggestions
     */
    protected function getCitySuggestions(string $query, array $context): array
    {
        try {
            $response = Http::timeout(5)
                ->withoutVerifying()
                ->withHeaders(['User-Agent' => 'BarfFoods/1.0'])
                ->get('https://nominatim.openstreetmap.org/search', [
                'q' => $query . ', US',
                'format' => 'json',
                'limit' => 10,
                'addressdetails' => 1,
                'featuretype' => 'city',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $cities = [];

                foreach ($data as $item) {
                    $address = $item['address'] ?? [];
                    $city = $address['city'] ?? $address['town'] ?? $address['village'] ?? '';
                    
                    if (!empty($city) && !in_array($city, $cities)) {
                        $cities[] = $city;
                    }
                }

                return array_slice($cities, 0, 5);
            }

            return [];

        } catch (\Exception $e) {
            Log::warning('City suggestions failed', [
                'query' => $query,
                'context' => $context,
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

    /**
     * Get state suggestions
     */
    protected function getStateSuggestions(string $query, array $context): array
    {
        // US States list for autocomplete
        $usStates = [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
            'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
            'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
            'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
            'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
            'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
            'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
        ];

        return array_values(array_filter($usStates, function($state) use ($query) {
            return stripos($state, $query) !== false;
        }));
    }

             /**
              * Helper to build a consistent street address from Nominatim response
              */
             protected function buildStreetAddress(array $address): string
             {
                 $parts = [];
                 if (!empty($address['house_number'])) {
                     $parts[] = $address['house_number'];
                 }
                 if (!empty($address['road'])) {
                     $parts[] = $address['road'];
                 }
                 if (!empty($address['neighbourhood']) && empty($address['road'])) { // Use neighbourhood if no road
                     $parts[] = $address['neighbourhood'];
                 }
                 return implode(' ', $parts);
             }

             /**
              * Get ZIP code suggestions
              */
             protected function getZipSuggestions(string $query, array $context): array
    {
        try {
            $searchQuery = $query;
            if (!empty($context['city'])) {
                $searchQuery .= ', ' . $context['city'];
            }
            if (!empty($context['state'])) {
                $searchQuery .= ', ' . $context['state'];
            }

            $response = Http::timeout(5)
                ->withoutVerifying()
                ->withHeaders(['User-Agent' => 'BarfFoods/1.0'])
                ->get('https://nominatim.openstreetmap.org/search', [
                'q' => $searchQuery,
                'format' => 'json',
                'limit' => 10,
                'addressdetails' => 1,
                'countrycodes' => 'us',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $zipCodes = [];

                foreach ($data as $item) {
                    $address = $item['address'] ?? [];
                    $zipCode = $address['postcode'] ?? '';
                    
                    if (!empty($zipCode) && !in_array($zipCode, $zipCodes)) {
                        $zipCodes[] = $zipCode;
                    }
                }

                return array_slice($zipCodes, 0, 5);
            }

            return [];

        } catch (\Exception $e) {
            Log::warning('ZIP suggestions failed', [
                'query' => $query,
                'context' => $context,
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }
}
