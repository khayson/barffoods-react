<?php

namespace App\Services;

use App\Models\SystemSetting;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\Log;

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
     * Validate cart items before calculation
     */
    protected function validateCartItems($cartItems, $allowEmpty = false): void
    {
        if (empty($cartItems)) {
            if (!$allowEmpty) {
                throw new \InvalidArgumentException('Cart items cannot be empty');
            }
            return; // Allow empty carts when explicitly permitted
        }

        if (!is_array($cartItems) && !is_object($cartItems)) {
            throw new \InvalidArgumentException('Cart items must be an array or collection');
        }

        foreach ($cartItems as $item) {
            // Validate item structure
            if (!isset($item['product']) || !isset($item['quantity'])) {
                throw new \InvalidArgumentException('Invalid cart item structure: missing product or quantity');
            }

            // Validate product data
            $product = is_array($item['product']) ? $item['product'] : $item['product']->toArray();
            
            if (!isset($product['id']) || !isset($product['price'])) {
                throw new \InvalidArgumentException('Invalid product data: missing id or price');
            }

            // Validate quantity
            if (!is_numeric($item['quantity']) || $item['quantity'] <= 0) {
                throw new \InvalidArgumentException('Invalid quantity: must be a positive number');
            }

            // Validate price
            if (!is_numeric($product['price']) || $product['price'] < 0) {
                throw new \InvalidArgumentException('Invalid product price: must be a non-negative number');
            }

            // Validate stock if available
            if (isset($product['stock_quantity']) && $item['quantity'] > $product['stock_quantity']) {
                Log::warning('Cart item quantity exceeds available stock', [
                    'product_id' => $product['id'],
                    'requested_quantity' => $item['quantity'],
                    'available_stock' => $product['stock_quantity'],
                ]);
            }
        }
    }

    /**
     * Calculate cart totals with system settings
     */
    public function calculateCartTotals($cartItems, $userId = null, $storeId = null)
    {
        // Handle empty cart gracefully
        if (empty($cartItems)) {
            return [
                'subtotal' => 0,
                'discount' => 0,
                'delivery_fee' => 0,
                'tax' => 0,
                'total' => 0,
                'discount_breakdown' => [],
                'applied_discounts' => [],
                'available_discounts' => $userId ? $this->discountService->getAvailableDiscounts($userId) : [],
            ];
        }

        // Validate cart items
        $this->validateCartItems($cartItems, true);

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
            if (!is_numeric($storeId) || $storeId <= 0) {
                throw new \InvalidArgumentException('Invalid store ID: must be a positive number');
            }

            $store = Store::find($storeId);
            if ($store && $store->delivery_fee) {
                if (!is_numeric($store->delivery_fee) || $store->delivery_fee < 0) {
                    Log::warning('Invalid delivery fee for store', [
                        'store_id' => $storeId,
                        'delivery_fee' => $store->delivery_fee,
                    ]);
                    return SystemSetting::get('global_delivery_fee', 4.99);
                }
                return $store->delivery_fee;
            }
        }
        
        // Fallback to global delivery fee
        $globalFee = SystemSetting::get('global_delivery_fee', 4.99);
        
        if (!is_numeric($globalFee) || $globalFee < 0) {
            Log::error('Invalid global delivery fee', ['fee' => $globalFee]);
            return 4.99; // Hard-coded fallback
        }
        
        return $globalFee;
    }

    /**
     * Calculate tax using system settings
     */
    private function calculateTax($taxableAmount)
    {
        if (!is_numeric($taxableAmount) || $taxableAmount < 0) {
            throw new \InvalidArgumentException('Invalid taxable amount: must be a non-negative number');
        }

        $taxRate = SystemSetting::get('global_tax_rate', 8.5);
        
        if (!is_numeric($taxRate) || $taxRate < 0 || $taxRate > 100) {
            Log::error('Invalid tax rate', ['tax_rate' => $taxRate]);
            $taxRate = 8.5; // Fallback to default
        }
        
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
