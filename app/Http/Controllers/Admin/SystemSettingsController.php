<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemSettingsController extends Controller
{
    /**
     * Display system settings page
     */
    public function index()
    {
        $settings = SystemSetting::getAll();
        
        // Parse JSON fields for frontend
        $parsedSettings = [
            'global_delivery_fee' => $settings['global_delivery_fee'] ?? 4.99,
            'global_tax_rate' => $settings['global_tax_rate'] ?? 8.5,
            'discount_rules' => isset($settings['discount_rules'])
                ? (is_string($settings['discount_rules']) ? json_decode($settings['discount_rules'], true) : (array) $settings['discount_rules'])
                : [],
            'payment_methods' => isset($settings['payment_methods'])
                ? (is_string($settings['payment_methods']) ? json_decode($settings['payment_methods'], true) : (array) $settings['payment_methods'])
                : [],
            'store_address' => isset($settings['store_address'])
                ? (is_string($settings['store_address']) ? json_decode($settings['store_address'], true) : (array) $settings['store_address'])
                : [
                'street_address' => '123 Main Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip_code' => '10001',
                'country' => 'US',
                'company_name' => 'BarfFoods',
                'phone' => '+1 (555) 123-4567',
                'email' => 'orders@barffoods.com'
            ],
        ];
        
        // Debug: Log the settings being sent to frontend
        \Log::info('SystemSettingsController::index - Settings being sent to frontend:', [
            'settings' => $parsedSettings
        ]);
        
        return Inertia::render('admin/system-settings', [
            'settings' => $parsedSettings,
        ]);
    }

    /**
     * Update system settings
     */
    public function update(Request $request)
    {
        $request->validate([
            'global_delivery_fee' => 'required|numeric|min:0',
            'global_tax_rate' => 'required|numeric|min:0|max:100',
            'discount_rules' => 'nullable|array',
            'payment_methods' => 'nullable|array',
            'store_address' => 'required|array',
            'store_address.street_address' => 'required|string|max:255',
            'store_address.city' => 'required|string|max:255',
            'store_address.state' => 'required|string|max:255',
            'store_address.zip_code' => 'required|string|max:20',
            'store_address.country' => 'required|string|max:255',
            'store_address.company_name' => 'required|string|max:255',
            'store_address.phone' => 'nullable|string|max:20',
            'store_address.email' => 'nullable|email|max:255',
        ]);

        // Update global delivery fee
        SystemSetting::set(
            'global_delivery_fee',
            $request->global_delivery_fee,
            'number',
            'Global delivery fee for all stores (fallback when store doesn\'t have custom fee)'
        );

        // Update global tax rate
        SystemSetting::set(
            'global_tax_rate',
            $request->global_tax_rate,
            'number',
            'Global tax rate percentage for all stores (fallback when store doesn\'t have custom rate)'
        );

        // Update discount rules
        SystemSetting::set(
            'discount_rules',
            json_encode($request->discount_rules ?? []),
            'json',
            'Discount rules configuration'
        );

        // Update payment methods
        SystemSetting::set(
            'payment_methods',
            json_encode($request->payment_methods ?? []),
            'json',
            'Available payment methods'
        );

        // Update store address
        SystemSetting::set(
            'store_address',
            json_encode($request->store_address ?? []),
            'json',
            'Store address used as shipping origin for all orders'
        );

        return redirect()->back()->with('success', 'System settings updated successfully!');
    }

    /**
     * Get system settings for API
     */
    public function getSettings()
    {
        return response()->json([
            'success' => true,
            'settings' => SystemSetting::getAll(),
        ]);
    }

    /**
     * Get system settings for frontend consumption (public API)
     */
    public function getPublicSettings()
    {
        $settings = SystemSetting::getAll();
        
        // Only return settings that are safe for public consumption
        $publicSettings = [
            'global_delivery_fee' => $settings['global_delivery_fee'] ?? 4.99,
            'global_tax_rate' => $settings['global_tax_rate'] ?? 8.5,
            'discount_rules' => $settings['discount_rules'] ?? [],
            'payment_methods' => $settings['payment_methods'] ?? [],
        ];

        return response()->json([
            'success' => true,
            'settings' => $publicSettings,
        ]);
    }
}