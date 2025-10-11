<?php

namespace App\Services;

use App\Models\UserAddress;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AddressService
{
    protected $addressValidationService;

    public function __construct(AddressValidationService $addressValidationService)
    {
        $this->addressValidationService = $addressValidationService;
    }
    /**
     * Get user's addresses with default first
     */
    public function getUserAddresses(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return UserAddress::where('user_id', $userId)
            ->active()
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get user's default address
     */
    public function getDefaultAddress(int $userId): ?UserAddress
    {
        return UserAddress::where('user_id', $userId)
            ->active()
            ->default()
            ->first();
    }

    /**
     * Create a new address with validation
     */
    public function createAddress(array $data): UserAddress
    {
        return DB::transaction(function () use ($data) {
            // Validate address using the validation service
            $validationResult = $this->addressValidationService->validateAddress($data);
            
            if (!$validationResult['is_valid']) {
                throw new \Exception('Address validation failed: ' . implode(', ', $validationResult['errors']));
            }
            
            // Check delivery zone
            if (!$this->addressValidationService->isWithinDeliveryZone($data)) {
                throw new \Exception('Address is outside our delivery zone.');
            }
            
            // If this is being set as default, unset other defaults
            if ($data['is_default'] ?? false) {
                UserAddress::where('user_id', $data['user_id'])
                    ->update(['is_default' => false]);
            }

            $address = UserAddress::create($data);
            
            Log::info('Address created successfully', [
                'user_id' => $data['user_id'],
                'address_id' => $address->id,
                'address' => $this->buildFullAddress($data),
                'validation_suggestions' => $validationResult['suggestions'] ?? []
            ]);
            
            return $address;
        });
    }


    /**
     * Build full address string
     */
    protected function buildFullAddress(array $data): string
    {
        $parts = [];
        
        if (!empty($data['street_address'])) {
            $parts[] = $data['street_address'];
        }
        if (!empty($data['city'])) {
            $parts[] = $data['city'];
        }
        if (!empty($data['state'])) {
            $parts[] = $data['state'];
        }
        if (!empty($data['zip_code'])) {
            $parts[] = $data['zip_code'];
        }
        
        return implode(', ', $parts);
    }

    /**
     * Update an address
     */
    public function updateAddress(UserAddress $address, array $data): UserAddress
    {
        return DB::transaction(function () use ($address, $data) {
            // If this is being set as default, unset other defaults
            if ($data['is_default'] ?? false) {
                UserAddress::where('user_id', $address->user_id)
                    ->where('id', '!=', $address->id)
                    ->update(['is_default' => false]);
            }

            $address->update($data);
            return $address->fresh();
        });
    }

    /**
     * Set default address
     */
    public function setDefaultAddress(UserAddress $address): UserAddress
    {
        return DB::transaction(function () use ($address) {
            // Unset other defaults
            UserAddress::where('user_id', $address->user_id)
                ->update(['is_default' => false]);
            
            // Set this as default
            $address->update(['is_default' => true]);
            
            return $address->fresh();
        });
    }

    /**
     * Soft delete an address
     */
    public function deleteAddress(UserAddress $address): bool
    {
        return $address->update(['is_active' => false]);
    }

    /**
     * Validate address data
     */
    public function validateAddressData(array $data): array
    {
        $rules = [
            'type' => 'required|in:home,work,other',
            'label' => 'nullable|string|max:255',
            'street_address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'zip_code' => 'required|string|max:20',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'delivery_instructions' => 'nullable|string|max:1000',
            'is_default' => 'boolean',
        ];

        return validator($data, $rules)->validate();
    }

    /**
     * Format address for display
     */
    public function formatAddress(UserAddress $address): string
    {
        $parts = [
            $address->street_address,
            $address->city,
            $address->state,
            $address->zip_code
        ];

        return implode(', ', array_filter($parts));
    }

    /**
     * Get address types with labels
     */
    public function getAddressTypes(): array
    {
        return [
            'home' => 'Home',
            'work' => 'Work',
            'other' => 'Other'
        ];
    }
}
