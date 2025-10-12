<?php

namespace App\Services;

use App\Models\SystemSetting;
use App\Models\Store;
use App\Models\User;

class CartCalculationService
{
    protected $discountService;
    protected $distanceService;

    public function __construct(DiscountService $discountService, DistanceService $distanceService)
    {
        $this->discountService = $discountService;
        $this->distanceService = $distanceService;
    }

    /**
     * Calculate cart totals with system settings
     */
    public function calculateCartTotals($cartItems, $userId = null, $storeId = null)
    {
        // Calculate subtotal
        $subtotal = $this->calculateSubtotal($cartItems);
        
        // Calculate discount
        $discountData = $this->discountService->calculateDiscount($subtotal, $userId);
        $discount = $discountData['total_discount'];
        
        // Calculate delivery fee (fallback for local delivery)
        $deliveryFee = $this->calculateDeliveryFee($storeId);
        
        // Calculate tax
        $tax = $this->calculateTax($subtotal - $discount);
        
        // Calculate final total (without shipping - shipping calculated at checkout)
        $total = $subtotal - $discount + $deliveryFee + $tax;

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'delivery_fee' => $deliveryFee,
            'tax' => $tax,
            'total' => $total,
            'discount_breakdown' => $discountData['discount_breakdown'],
            'applied_discounts' => $discountData['applied_discounts'],
            'available_discounts' => $this->discountService->getAvailableDiscounts($subtotal, $userId)
        ];
    }

    /**
     * Calculate subtotal from cart items
     */
    private function calculateSubtotal($cartItems)
    {
        $subtotal = 0;
        
        foreach ($cartItems as $item) {
            $subtotal += $item['quantity'] * $item['product']['price'];
        }
        
        return $subtotal;
    }

    /**
     * Calculate delivery fee using system settings
     */
    private function calculateDeliveryFee($storeId = null)
    {
        if ($storeId) {
            $store = Store::find($storeId);
            if ($store && $store->delivery_fee) {
                return $store->delivery_fee;
            }
        }
        
        // Fallback to global delivery fee
        return SystemSetting::get('global_delivery_fee', 4.99);
    }

    /**
     * Calculate tax using system settings
     */
    private function calculateTax($taxableAmount)
    {
        $taxRate = SystemSetting::get('global_tax_rate', 8.5);
        return $taxableAmount * ($taxRate / 100);
    }

    /**
     * Get system settings for frontend
     */
    public function getSystemSettings()
    {
        return [
            'global_delivery_fee' => SystemSetting::get('global_delivery_fee', 4.99),
            'global_tax_rate' => SystemSetting::get('global_tax_rate', 8.5),
            'discount_rules' => SystemSetting::get('discount_rules', []),
            'payment_methods' => SystemSetting::get('payment_methods', [])
        ];
    }

    /**
     * Get available payment methods
     */
    public function getAvailablePaymentMethods()
    {
        $paymentMethods = SystemSetting::get('payment_methods', []);
        $availableMethods = [];

        foreach ($paymentMethods as $key => $method) {
            if ($method['enabled']) {
                $availableMethods[] = [
                    'key' => $key,
                    'name' => $method['name'],
                    'description' => $method['description']
                ];
            }
        }

        return $availableMethods;
    }
}
