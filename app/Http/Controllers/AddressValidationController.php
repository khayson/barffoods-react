<?php

namespace App\Http\Controllers;

use App\Services\AddressValidationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AddressValidationController extends Controller
{
    protected $addressValidationService;

    public function __construct(AddressValidationService $addressValidationService)
    {
        $this->addressValidationService = $addressValidationService;
    }

    /**
     * Validate an address
     */
    public function validate(Request $request): JsonResponse
    {
        $request->validate([
            'street_address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'zip_code' => 'required|string|max:20',
        ]);

        $addressData = $request->only(['street_address', 'city', 'state', 'zip_code']);
        $result = $this->addressValidationService->validateAddress($addressData);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Check if address is within delivery zone
     */
    public function checkDeliveryZone(Request $request): JsonResponse
    {
        $request->validate([
            'street_address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'zip_code' => 'required|string|max:20',
        ]);

        $addressData = $request->only(['street_address', 'city', 'state', 'zip_code']);
        $isWithinZone = $this->addressValidationService->isWithinDeliveryZone($addressData);

        return response()->json([
            'success' => true,
            'is_within_delivery_zone' => $isWithinZone,
            'message' => $isWithinZone 
                ? 'Address is within our delivery zone.' 
                : 'Address is outside our delivery zone.',
        ]);
    }

    /**
     * Get address suggestions
     */
    public function getSuggestions(Request $request): JsonResponse
    {
        $request->validate([
            'input' => 'required|string|min:3|max:100',
        ]);

        $suggestions = $this->addressValidationService->getAddressSuggestions($request->input);

        return response()->json([
            'success' => true,
            'suggestions' => $suggestions,
        ]);
    }
}
