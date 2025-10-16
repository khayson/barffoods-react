<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportUSZipCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:zips 
                            {file : Path to CSV file with ZIP codes}
                            {--batch=1000 : Batch size for database inserts}
                            {--truncate : Clear existing ZIP codes before import}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import US ZIP codes from CSV file (SimpleMaps format)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $file = $this->argument('file');
        $batchSize = $this->option('batch');
        $truncate = $this->option('truncate');

        // Validate file exists
        if (!file_exists($file)) {
            $this->error("❌ File not found: {$file}");
            return 1;
        }

        // Show file info
        $fileSize = filesize($file);
        $this->info("📁 File: {$file}");
        $this->info("📊 Size: " . $this->formatBytes($fileSize));

        // Truncate if requested
        if ($truncate) {
            $this->warn("🗑️  Clearing existing ZIP codes...");
            DB::table('zip_codes')->truncate();
            DB::table('zip_code_distances')->truncate();
            $this->info("✅ Cleared existing data");
        }

        // Open file
        $handle = fopen($file, 'r');
        if (!$handle) {
            $this->error("❌ Could not open file: {$file}");
            return 1;
        }

        // Read header
        $header = fgetcsv($handle);
        if (!$header) {
            $this->error("❌ Could not read CSV header");
            fclose($handle);
            return 1;
        }

        $this->info("📋 CSV Header: " . implode(', ', $header));
        $this->info("🔄 Expected format: zip, lat, lng, city, state_id, state_name, county_name, timezone");

        // Validate header format
        $expectedColumns = ['zip', 'lat', 'lng', 'city', 'state_id', 'state_name'];
        $missingColumns = array_diff($expectedColumns, $header);
        if (!empty($missingColumns)) {
            $this->error("❌ Missing required columns: " . implode(', ', $missingColumns));
            $this->error("Expected columns: " . implode(', ', $expectedColumns));
            fclose($handle);
            return 1;
        }

        // Get column indices
        $zipIndex = array_search('zip', $header);
        $latIndex = array_search('lat', $header);
        $lngIndex = array_search('lng', $header);
        $cityIndex = array_search('city', $header);
        $stateIdIndex = array_search('state_id', $header);
        $stateNameIndex = array_search('state_name', $header);
        $countyIndex = array_search('county_name', $header);

        $this->info("🚀 Starting import...");
        $this->newLine();

        // Import data
        $batch = [];
        $count = 0;
        $skipped = 0;
        $startTime = microtime(true);

        $progressBar = $this->output->createProgressBar();
        $progressBar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %message%');

        while (($row = fgetcsv($handle)) !== false) {
            try {
                $data = $this->parseRow($row, [
                    'zip' => $zipIndex,
                    'lat' => $latIndex,
                    'lng' => $lngIndex,
                    'city' => $cityIndex,
                    'state_id' => $stateIdIndex,
                    'state_name' => $stateNameIndex,
                    'county' => $countyIndex,
                ]);

                if ($data) {
                    $batch[] = $data;
                    $count++;

                    if (count($batch) >= $batchSize) {
                        $this->insertBatch($batch);
                        $batch = [];
                        $progressBar->setMessage("Imported {$count} ZIP codes...");
                        $progressBar->advance($batchSize);
                    }
                } else {
                    $skipped++;
                }
            } catch (\Exception $e) {
                $skipped++;
                if ($skipped <= 5) { // Only show first 5 errors
                    $this->warn("⚠️  Error parsing row: " . $e->getMessage());
                }
            }
        }

        // Insert remaining batch
        if (!empty($batch)) {
            $this->insertBatch($batch);
            $progressBar->advance(count($batch));
        }

        $progressBar->finish();
        fclose($handle);

        $endTime = microtime(true);
        $duration = round($endTime - $startTime, 2);

        $this->newLine(2);
        $this->info("✅ Import completed successfully!");
        $this->info("📊 Statistics:");
        $this->info("   • Imported: {$count} ZIP codes");
        $this->info("   • Skipped: {$skipped} rows");
        $this->info("   • Duration: {$duration} seconds");
        $this->info("   • Rate: " . round($count / $duration, 0) . " ZIP codes/second");

        // Show sample data
        $this->newLine();
        $this->info("📋 Sample imported data:");
        $sample = DB::table('zip_codes')->limit(5)->get();
        foreach ($sample as $zip) {
            $this->line("   • {$zip->zip_code} - {$zip->city}, {$zip->state}");
        }

        $this->newLine();
        $this->info("💡 Next steps:");
        $this->info("   • Test distance calculation: php artisan tinker");
        $this->info("   • Check checkout with different ZIP codes");
        $this->info("   • Monitor performance in production");

        return 0;
    }

    /**
     * Parse a CSV row into database format
     */
    protected function parseRow(array $row, array $indices): ?array
    {
        $zip = trim($row[$indices['zip']] ?? '');
        $lat = $row[$indices['lat']] ?? null;
        $lng = $row[$indices['lng']] ?? null;
        $city = trim($row[$indices['city']] ?? '');
        $stateId = trim($row[$indices['state_id']] ?? '');
        $stateName = trim($row[$indices['state_name']] ?? '');
        $county = trim($row[$indices['county']] ?? '');

        // Validate required fields
        if (empty($zip) || empty($city) || empty($stateId)) {
            return null;
        }

        // Clean ZIP code (5 digits only)
        $zip = preg_replace('/[^0-9]/', '', $zip);
        if (strlen($zip) !== 5) {
            return null;
        }

        // Validate coordinates
        $lat = is_numeric($lat) ? (float) $lat : null;
        $lng = is_numeric($lng) ? (float) $lng : null;
        
        if ($lat === null || $lng === null) {
            return null;
        }

        // Validate coordinate ranges
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            return null;
        }

        return [
            'zip_code' => $zip,
            'city' => $city,
            'state' => $stateId,
            'county' => $county ?: null,
            'latitude' => $lat,
            'longitude' => $lng,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Insert batch of ZIP codes
     */
    protected function insertBatch(array $batch): void
    {
        try {
            DB::table('zip_codes')->insertOrIgnore($batch);
        } catch (\Exception $e) {
            $this->error("❌ Database error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Format bytes to human readable format
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     *    php artisan import:zips uszips.csv
     *    php artisan import:zips uszips.csv --truncate
     *    php artisan import:zips uszips.csv --batch=500
     */

}