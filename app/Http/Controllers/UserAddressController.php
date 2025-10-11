<?php

namespace App\Http\Controllers;

use App\Models\UserAddress;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class UserAddressController extends Controller
{
    /**
     * Get user's addresses
     */
    public function index(): JsonResponse
    {
        $addresses = Auth::user()->addresses()->active()->get();
        
        return response()->json([
            'success' => true,
            'addresses' => $addresses
        ]);
    }

    /**
     * Store a new address
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
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
        ]);

        // If this is being set as default, unset other defaults
        if ($request->boolean('is_default')) {
            Auth::user()->addresses()->update(['is_default' => false]);
        }

        $address = Auth::user()->addresses()->create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Address created successfully',
            'address' => $address
        ], 201);
    }

    /**
     * Update an address
     */
    public function update(Request $request, UserAddress $address): JsonResponse
    {
        // Ensure user owns this address
        if ($address->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $request->validate([
            'type' => 'sometimes|in:home,work,other',
            'label' => 'nullable|string|max:255',
            'street_address' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'state' => 'sometimes|string|max:255',
            'zip_code' => 'sometimes|string|max:20',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'delivery_instructions' => 'nullable|string|max:1000',
            'is_default' => 'boolean',
        ]);

        // If this is being set as default, unset other defaults
        if ($request->boolean('is_default')) {
            Auth::user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        $address->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Address updated successfully',
            'address' => $address->fresh()
        ]);
    }

    /**
     * Delete an address
     */
    public function destroy(UserAddress $address): JsonResponse
    {
        // Ensure user owns this address
        if ($address->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $address->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Address deleted successfully'
        ]);
    }

    /**
     * Set default address
     */
    public function setDefault(UserAddress $address): JsonResponse
    {
        // Ensure user owns this address
        if ($address->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Unset other defaults
        Auth::user()->addresses()->update(['is_default' => false]);
        
        // Set this as default
        $address->update(['is_default' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Default address updated successfully',
            'address' => $address->fresh()
        ]);
    }
}
