<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Store;

class StoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stores = [
            [
                'name' => 'Whole Foods Market - Downtown',
                'address' => '123 Main St, New York, NY 10001',
                'phone' => '(212) 555-0101',
                'latitude' => 40.7128,
                'longitude' => -74.0060,
                'delivery_radius' => 15,
                'min_order_amount' => 35.00,
                'delivery_fee' => 7.99,
                'is_active' => true,
            ],
            [
                'name' => 'Trader Joe\'s - Upper East Side',
                'address' => '456 Park Ave, New York, NY 10028',
                'phone' => '(212) 555-0202',
                'latitude' => 40.7736,
                'longitude' => -73.9566,
                'delivery_radius' => 12,
                'min_order_amount' => 25.00,
                'delivery_fee' => 5.99,
                'is_active' => true,
            ],
            [
                'name' => 'Safeway - Manhattan',
                'address' => '789 Broadway, New York, NY 10003',
                'phone' => '(212) 555-0303',
                'latitude' => 40.7328,
                'longitude' => -73.9925,
                'delivery_radius' => 20,
                'min_order_amount' => 30.00,
                'delivery_fee' => 6.99,
                'is_active' => true,
            ],
            [
                'name' => 'Kroger - Brooklyn',
                'address' => '321 Flatbush Ave, Brooklyn, NY 11225',
                'phone' => '(718) 555-0404',
                'latitude' => 40.6782,
                'longitude' => -73.9442,
                'delivery_radius' => 18,
                'min_order_amount' => 25.00,
                'delivery_fee' => 5.99,
                'is_active' => true,
            ],
            [
                'name' => 'Publix - Queens',
                'address' => '654 Northern Blvd, Queens, NY 11372',
                'phone' => '(718) 555-0505',
                'latitude' => 40.7282,
                'longitude' => -73.7949,
                'delivery_radius' => 22,
                'min_order_amount' => 30.00,
                'delivery_fee' => 6.99,
                'is_active' => true,
            ],
            [
                'name' => 'Wegmans - Staten Island',
                'address' => '987 Richmond Ave, Staten Island, NY 10314',
                'phone' => '(718) 555-0606',
                'latitude' => 40.5795,
                'longitude' => -74.1502,
                'delivery_radius' => 25,
                'min_order_amount' => 40.00,
                'delivery_fee' => 8.99,
                'is_active' => true,
            ],
            [
                'name' => 'Target - Midtown',
                'address' => '147 5th Ave, New York, NY 10010',
                'phone' => '(212) 555-0707',
                'latitude' => 40.7505,
                'longitude' => -73.9934,
                'delivery_radius' => 16,
                'min_order_amount' => 35.00,
                'delivery_fee' => 7.99,
                'is_active' => true,
            ],
            [
                'name' => 'Walmart - Bronx',
                'address' => '258 Grand Concourse, Bronx, NY 10451',
                'phone' => '(718) 555-0808',
                'latitude' => 40.8176,
                'longitude' => -73.9262,
                'delivery_radius' => 20,
                'min_order_amount' => 30.00,
                'delivery_fee' => 6.99,
                'is_active' => true,
            ],
            [
                'name' => 'Costco - Long Island',
                'address' => '369 Hempstead Turnpike, Westbury, NY 11590',
                'phone' => '(516) 555-0909',
                'latitude' => 40.7559,
                'longitude' => -73.5872,
                'delivery_radius' => 30,
                'min_order_amount' => 50.00,
                'delivery_fee' => 9.99,
                'is_active' => true,
            ],
            [
                'name' => 'Stop & Shop - Westchester',
                'address' => '741 Central Park Ave, Yonkers, NY 10704',
                'phone' => '(914) 555-1010',
                'latitude' => 40.9312,
                'longitude' => -73.8988,
                'delivery_radius' => 25,
                'min_order_amount' => 35.00,
                'delivery_fee' => 7.99,
                'is_active' => true,
            ],
        ];

        foreach ($stores as $store) {
            Store::create($store);
        }
    }
}
