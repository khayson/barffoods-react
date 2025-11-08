<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\EasyPostService;
use Illuminate\Console\Command;

class FixBrokenShippingLabels extends Command
{
    protected $signature = 'shipping:fix-broken-labels {order_id?}';
    protected $description = 'Fix orders with broken shipping labels (shipment created but not saved)';

    public function handle()
    {
        $orderId = $this->argument('order_id');
        
        if ($orderId) {
            $this->fixSingleOrder($orderId);
        } else {
            $this->fixAllBrokenOrders();
        }
    }

    protected function fixSingleOrder($orderId)
    {
        $order = Order::find($orderId);
        
        if (!$order) {
            $this->error("Order #{$orderId} not found");
            return;
        }
        
        $this->info("Checking order #{$order->id} ({$order->order_number})...");
        
        if ($this->attemptFix($order)) {
            $this->info("✓ Successfully fixed order #{$order->id}");
        } else {
            $this->error("✗ Could not fix order #{$order->id}");
        }
    }

    protected function fixAllBrokenOrders()
    {
        // Find orders with rate_id but no tracking_code (indicates broken state)
        $brokenOrders = Order::whereNotNull('rate_id')
            ->whereNull('tracking_code')
            ->where('shipping_method', 'shipping')
            ->get();
        
        if ($brokenOrders->isEmpty()) {
            $this->info('No broken orders found!');
            return;
        }
        
        $this->info("Found {$brokenOrders->count()} broken orders");
        
        $fixed = 0;
        $failed = 0;
        
        foreach ($brokenOrders as $order) {
            $this->info("Processing order #{$order->id} ({$order->order_number})...");
            
            if ($this->attemptFix($order)) {
                $fixed++;
                $this->info("  ✓ Fixed");
            } else {
                $failed++;
                $this->error("  ✗ Failed");
            }
        }
        
        $this->info("\nSummary:");
        $this->info("Fixed: {$fixed}");
        $this->info("Failed: {$failed}");
    }

    protected function attemptFix(Order $order): bool
    {
        try {
            $easyPostService = app(EasyPostService::class);
            
            // Try to retrieve shipment using rate_id
            // The rate_id contains the shipment_id in its structure
            if (!$order->rate_id) {
                $this->warn("  No rate_id found");
                return false;
            }
            
            // Extract shipment_id from rate_id if possible
            // Rate IDs typically look like: rate_abc123 and belong to shipment shp_xyz789
            // We'll need to search for shipments or use a different approach
            
            $this->warn("  Manual intervention required - cannot automatically retrieve shipment");
            $this->warn("  Rate ID: {$order->rate_id}");
            $this->warn("  Please check EasyPost dashboard and manually update the order");
            
            return false;
            
        } catch (\Exception $e) {
            $this->error("  Error: " . $e->getMessage());
            return false;
        }
    }
}
