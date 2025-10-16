<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ZipCode;
use Illuminate\Support\Facades\DB;

class ZipCodeSeeder extends Seeder
{
    /**
     * Seed sample US ZIP codes with coordinates
     * 
     * This includes major US cities for testing.
     * For production, import complete US ZIP code database from:
     * - SimpleMaps: https://simplemaps.com/data/us-zips (Free: 41,000+ ZIP codes)
     * - GeoNames: http://download.geonames.org/export/zip/US.zip (Free: All US ZIP codes)
     */
    public function run(): void
    {
        $zipCodes = [
            // New York, NY
            ['zip_code' => '10001', 'city' => 'New York', 'state' => 'NY', 'county' => 'New York', 'latitude' => 40.7506, 'longitude' => -73.9971, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '10002', 'city' => 'New York', 'state' => 'NY', 'county' => 'New York', 'latitude' => 40.7158, 'longitude' => -73.9862, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '10003', 'city' => 'New York', 'state' => 'NY', 'county' => 'New York', 'latitude' => 40.7310, 'longitude' => -73.9896, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '10016', 'city' => 'New York', 'state' => 'NY', 'county' => 'New York', 'latitude' => 40.7450, 'longitude' => -73.9761, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '10036', 'city' => 'New York', 'state' => 'NY', 'county' => 'New York', 'latitude' => 40.7587, 'longitude' => -73.9884, 'created_at' => now(), 'updated_at' => now()],
            
            // Los Angeles, CA
            ['zip_code' => '90001', 'city' => 'Los Angeles', 'state' => 'CA', 'county' => 'Los Angeles', 'latitude' => 33.9731, 'longitude' => -118.2479, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '90002', 'city' => 'Los Angeles', 'state' => 'CA', 'county' => 'Los Angeles', 'latitude' => 33.9499, 'longitude' => -118.2467, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '90003', 'city' => 'Los Angeles', 'state' => 'CA', 'county' => 'Los Angeles', 'latitude' => 33.9642, 'longitude' => -118.2728, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '90012', 'city' => 'Los Angeles', 'state' => 'CA', 'county' => 'Los Angeles', 'latitude' => 34.0629, 'longitude' => -118.2416, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '90210', 'city' => 'Beverly Hills', 'state' => 'CA', 'county' => 'Los Angeles', 'latitude' => 34.0901, 'longitude' => -118.4065, 'created_at' => now(), 'updated_at' => now()],
            
            // Chicago, IL
            ['zip_code' => '60601', 'city' => 'Chicago', 'state' => 'IL', 'county' => 'Cook', 'latitude' => 41.8856, 'longitude' => -87.6212, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '60602', 'city' => 'Chicago', 'state' => 'IL', 'county' => 'Cook', 'latitude' => 41.8830, 'longitude' => -87.6290, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '60603', 'city' => 'Chicago', 'state' => 'IL', 'county' => 'Cook', 'latitude' => 41.8803, 'longitude' => -87.6290, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '60614', 'city' => 'Chicago', 'state' => 'IL', 'county' => 'Cook', 'latitude' => 41.9242, 'longitude' => -87.6537, 'created_at' => now(), 'updated_at' => now()],
            
            // Houston, TX
            ['zip_code' => '77001', 'city' => 'Houston', 'state' => 'TX', 'county' => 'Harris', 'latitude' => 29.7604, 'longitude' => -95.3698, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '77002', 'city' => 'Houston', 'state' => 'TX', 'county' => 'Harris', 'latitude' => 29.7589, 'longitude' => -95.3677, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '77003', 'city' => 'Houston', 'state' => 'TX', 'county' => 'Harris', 'latitude' => 29.7463, 'longitude' => -95.3547, 'created_at' => now(), 'updated_at' => now()],
            
            // Phoenix, AZ
            ['zip_code' => '85001', 'city' => 'Phoenix', 'state' => 'AZ', 'county' => 'Maricopa', 'latitude' => 33.4484, 'longitude' => -112.0740, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '85002', 'city' => 'Phoenix', 'state' => 'AZ', 'county' => 'Maricopa', 'latitude' => 33.4652, 'longitude' => -112.0773, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '85003', 'city' => 'Phoenix', 'state' => 'AZ', 'county' => 'Maricopa', 'latitude' => 33.4484, 'longitude' => -112.0740, 'created_at' => now(), 'updated_at' => now()],
            
            // Philadelphia, PA
            ['zip_code' => '19101', 'city' => 'Philadelphia', 'state' => 'PA', 'county' => 'Philadelphia', 'latitude' => 39.9526, 'longitude' => -75.1652, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '19102', 'city' => 'Philadelphia', 'state' => 'PA', 'county' => 'Philadelphia', 'latitude' => 39.9526, 'longitude' => -75.1652, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '19103', 'city' => 'Philadelphia', 'state' => 'PA', 'county' => 'Philadelphia', 'latitude' => 39.9526, 'longitude' => -75.1652, 'created_at' => now(), 'updated_at' => now()],
            
            // San Antonio, TX
            ['zip_code' => '78201', 'city' => 'San Antonio', 'state' => 'TX', 'county' => 'Bexar', 'latitude' => 29.4241, 'longitude' => -98.4936, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '78202', 'city' => 'San Antonio', 'state' => 'TX', 'county' => 'Bexar', 'latitude' => 29.4252, 'longitude' => -98.4946, 'created_at' => now(), 'updated_at' => now()],
            
            // San Diego, CA
            ['zip_code' => '92101', 'city' => 'San Diego', 'state' => 'CA', 'county' => 'San Diego', 'latitude' => 32.7157, 'longitude' => -117.1611, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '92102', 'city' => 'San Diego', 'state' => 'CA', 'county' => 'San Diego', 'latitude' => 32.7081, 'longitude' => -117.1289, 'created_at' => now(), 'updated_at' => now()],
            
            // Dallas, TX
            ['zip_code' => '75201', 'city' => 'Dallas', 'state' => 'TX', 'county' => 'Dallas', 'latitude' => 32.7767, 'longitude' => -96.7970, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '75202', 'city' => 'Dallas', 'state' => 'TX', 'county' => 'Dallas', 'latitude' => 32.7831, 'longitude' => -96.7902, 'created_at' => now(), 'updated_at' => now()],
            
            // San Jose, CA
            ['zip_code' => '95101', 'city' => 'San Jose', 'state' => 'CA', 'county' => 'Santa Clara', 'latitude' => 37.3382, 'longitude' => -121.8863, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '95102', 'city' => 'San Jose', 'state' => 'CA', 'county' => 'Santa Clara', 'latitude' => 37.3337, 'longitude' => -121.8907, 'created_at' => now(), 'updated_at' => now()],
            
            // Austin, TX
            ['zip_code' => '78701', 'city' => 'Austin', 'state' => 'TX', 'county' => 'Travis', 'latitude' => 30.2672, 'longitude' => -97.7431, 'created_at' => now(), 'updated_at' => now()],
            ['zip_code' => '78702', 'city' => 'Austin', 'state' => 'TX', 'county' => 'Travis', 'latitude' => 30.2642, 'longitude' => -97.7186, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('zip_codes')->insert($zipCodes);

        $this->command->info('✅ Seeded ' . count($zipCodes) . ' US ZIP codes');
        $this->command->info('💡 For production, import complete US ZIP code database:');
        $this->command->info('   - SimpleMaps: https://simplemaps.com/data/us-zips');
        $this->command->info('   - GeoNames: http://download.geonames.org/export/zip/US.zip');
        $this->command->info('   - ImportUSZipCodes: php artisan import:zips uszips.csv');
    }
}
