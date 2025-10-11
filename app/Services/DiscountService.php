<?php

namespace App\Services;

use App\Models\SystemSetting;
use App\Models\User;
use App\Models\Order;

class DiscountService
{
    /**
     * Calculate discount for a given order
     */
    public function calculateDiscount($subtotal, $userId = null, $orderData = [])
    {
        $discountRules = SystemSetting::get('discount_rules', []);
        $totalDiscount = 0;
        $appliedDiscounts = [];

        if (empty($discountRules)) {
            return [
                'total_discount' => 0,
                'applied_discounts' => [],
                'discount_breakdown' => []
            ];
        }

        // First-time customer discount
        if (isset($discountRules['first_time_customer']) && 
            $discountRules['first_time_customer']['enabled'] && 
            $userId) {
            
            $discount = $this->calculateFirstTimeCustomerDiscount($subtotal, $userId, $discountRules['first_time_customer']);
            if ($discount > 0) {
                $totalDiscount += $discount;
                $appliedDiscounts[] = [
                    'type' => 'first_time_customer',
                    'description' => $discountRules['first_time_customer']['description'],
                    'amount' => $discount
                ];
            }
        }

        // Bulk order discount
        if (isset($discountRules['bulk_order']) && 
            $discountRules['bulk_order']['enabled']) {
            
            $discount = $this->calculateBulkOrderDiscount($subtotal, $discountRules['bulk_order']);
            if ($discount > 0) {
                $totalDiscount += $discount;
                $appliedDiscounts[] = [
                    'type' => 'bulk_order',
                    'description' => $discountRules['bulk_order']['description'],
                    'amount' => $discount
                ];
            }
        }

        return [
            'total_discount' => $totalDiscount,
            'applied_discounts' => $appliedDiscounts,
            'discount_breakdown' => $this->getDiscountBreakdown($appliedDiscounts)
        ];
    }

    /**
     * Calculate first-time customer discount
     */
    private function calculateFirstTimeCustomerDiscount($subtotal, $userId, $rule)
    {
        // Check if user has any previous orders
        $hasPreviousOrders = Order::where('user_id', $userId)
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($hasPreviousOrders) {
            return 0; // Not a first-time customer
        }

        $percentage = $rule['percentage'] ?? 0;
        return $subtotal * ($percentage / 100);
    }

    /**
     * Calculate bulk order discount
     */
    private function calculateBulkOrderDiscount($subtotal, $rule)
    {
        $threshold = $rule['threshold'] ?? 0;
        $percentage = $rule['percentage'] ?? 0;

        if ($subtotal >= $threshold) {
            return $subtotal * ($percentage / 100);
        }

        return 0;
    }

    /**
     * Get discount breakdown for display
     */
    private function getDiscountBreakdown($appliedDiscounts)
    {
        $breakdown = [];
        
        foreach ($appliedDiscounts as $discount) {
            $breakdown[] = [
                'description' => $discount['description'],
                'amount' => $discount['amount'],
                'formatted_amount' => '$' . number_format($discount['amount'], 2)
            ];
        }

        return $breakdown;
    }

    /**
     * Get available discount rules for display
     */
    public function getAvailableDiscounts($subtotal, $userId = null)
    {
        $discountRules = SystemSetting::get('discount_rules', []);
        $availableDiscounts = [];

        if (empty($discountRules)) {
            return $availableDiscounts;
        }

        // Check first-time customer discount
        if (isset($discountRules['first_time_customer']) && 
            $discountRules['first_time_customer']['enabled'] && 
            $userId) {
            
            $hasPreviousOrders = Order::where('user_id', $userId)
                ->where('status', '!=', 'cancelled')
                ->exists();

            if (!$hasPreviousOrders) {
                $discount = $subtotal * (($discountRules['first_time_customer']['percentage'] ?? 0) / 100);
                $availableDiscounts[] = [
                    'type' => 'first_time_customer',
                    'description' => $discountRules['first_time_customer']['description'],
                    'discount_amount' => $discount,
                    'formatted_discount' => '$' . number_format($discount, 2)
                ];
            }
        }

        // Check bulk order discount
        if (isset($discountRules['bulk_order']) && 
            $discountRules['bulk_order']['enabled']) {
            
            $threshold = $discountRules['bulk_order']['threshold'] ?? 0;
            $percentage = $discountRules['bulk_order']['percentage'] ?? 0;
            
            if ($subtotal >= $threshold) {
                $discount = $subtotal * ($percentage / 100);
                $availableDiscounts[] = [
                    'type' => 'bulk_order',
                    'description' => $discountRules['bulk_order']['description'],
                    'discount_amount' => $discount,
                    'formatted_discount' => '$' . number_format($discount, 2)
                ];
            } else {
                $remaining = $threshold - $subtotal;
                $availableDiscounts[] = [
                    'type' => 'bulk_order',
                    'description' => $discountRules['bulk_order']['description'],
                    'discount_amount' => 0,
                    'formatted_discount' => '$0.00',
                    'remaining_for_discount' => $remaining,
                    'formatted_remaining' => '$' . number_format($remaining, 2)
                ];
            }
        }

        return $availableDiscounts;
    }
}
