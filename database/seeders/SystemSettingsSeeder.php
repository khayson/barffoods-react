<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Global delivery fee
        SystemSetting::set(
            'global_delivery_fee',
            4.99,
            'number',
            'Global delivery fee for all stores (fallback when store doesn\'t have custom fee)'
        );

        // Global tax rate
        SystemSetting::set(
            'global_tax_rate',
            8.5,
            'number',
            'Global tax rate percentage for all stores (fallback when store doesn\'t have custom rate)'
        );

        // Discount rules
        SystemSetting::set(
            'discount_rules',
            json_encode([
                'first_time_customer' => [
                    'enabled' => true,
                    'percentage' => 10,
                    'description' => '10% off for first-time customers'
                ],
                'bulk_order' => [
                    'enabled' => true,
                    'threshold' => 100,
                    'percentage' => 5,
                    'description' => '5% off for orders over $100'
                ]
            ]),
            'json',
            'Discount rules configuration'
        );

        // Payment methods
        SystemSetting::set(
            'payment_methods',
            json_encode([
                'paypal' => [
                    'enabled' => true,
                    'name' => 'PayPal',
                    'description' => 'Pay with PayPal account'
                ],
                'stripe' => [
                    'enabled' => true,
                    'name' => 'Stripe',
                    'description' => 'Pay with credit/debit card'
                ],
                'mastercard' => [
                    'enabled' => true,
                    'name' => 'Mastercard',
                    'description' => 'Pay with Mastercard'
                ],
                'bitcoin' => [
                    'enabled' => false,
                    'name' => 'Bitcoin',
                    'description' => 'Pay with Bitcoin'
                ]
            ]),
            'json',
            'Available payment methods'
        );

        // Store address for shipping
        SystemSetting::set(
            'store_address',
            json_encode([
                'street_address' => '123 Main Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip_code' => '10001',
                'country' => 'US',
                'company_name' => 'BarfFoods',
                'phone' => '+1 (555) 123-4567',
                'email' => 'orders@barffoods.com'
            ]),
            'json',
            'Store address used as shipping origin for all orders'
        );
    }
}