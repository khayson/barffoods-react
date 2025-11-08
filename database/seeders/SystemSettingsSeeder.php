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
                'stripe' => [
                    'enabled' => true,
                    'name' => 'Stripe',
                    'description' => 'Pay securely with credit/debit card via Stripe'
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

        // Delivery zone validation setting
        SystemSetting::set(
            'delivery_zone_validation_enabled',
            false, // Set to false for testing - allows all addresses
            'boolean',
            'Enable/disable delivery zone validation for addresses'
        );

        // Delivery zones configuration
        SystemSetting::set(
            'delivery_zones',
            json_encode([
                [
                    'name' => 'Manhattan',
                    'min_zip' => 10001,
                    'max_zip' => 10299,
                    'delivery_fee' => 4.99,
                    'delivery_time' => '30-45 minutes'
                ],
                [
                    'name' => 'Brooklyn',
                    'min_zip' => 11201,
                    'max_zip' => 11256,
                    'delivery_fee' => 5.99,
                    'delivery_time' => '45-60 minutes'
                ],
                [
                    'name' => 'Queens',
                    'min_zip' => 11001,
                    'max_zip' => 11005,
                    'delivery_fee' => 6.99,
                    'delivery_time' => '60-75 minutes'
                ],
                [
                    'name' => 'Bronx',
                    'min_zip' => 10451,
                    'max_zip' => 10475,
                    'delivery_fee' => 6.99,
                    'delivery_time' => '60-75 minutes'
                ],
                [
                    'name' => 'Staten Island',
                    'min_zip' => 10301,
                    'max_zip' => 10314,
                    'delivery_fee' => 7.99,
                    'delivery_time' => '75-90 minutes'
                ]
            ]),
            'json',
            'Delivery zones configuration with ZIP code ranges and pricing'
        );

        // Default Map Location Settings
        SystemSetting::set(
            'default_map_location',
            json_encode([
                'latitude' => 40.7128,
                'longitude' => -74.0060,
                'address' => 'New York, NY',
                'zoom' => 13
            ]),
            'json',
            'Default map location used when user location is not available or not set'
        );

        // Contact Information
        SystemSetting::set(
            'contact_info',
            json_encode([
                'email' => 'support@grocerybazar.com',
                'phone' => '+1 (555) 123-4567',
                'address' => '123 Market Street, City, State 12345',
                'business_hours' => 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday - Sunday: 10:00 AM - 4:00 PM'
            ]),
            'json',
            'Contact information displayed on the contact page'
        );

        // About Page Team Information
        SystemSetting::set(
            'about_team',
            json_encode([
                [
                    'name' => 'Sarah Johnson',
                    'title' => 'FOUNDER AND PRINCIPAL',
                    'image' => null
                ],
                [
                    'name' => 'Michael Chen',
                    'title' => 'FOUNDER AND PRINCIPAL',
                    'image' => null
                ]
            ]),
            'json',
            'Team members displayed on the about page'
        );
    }
}