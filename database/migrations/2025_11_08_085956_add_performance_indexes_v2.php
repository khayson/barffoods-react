<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Orders table - composite indexes for common queries
        Schema::table('orders', function (Blueprint $table) {
            // Composite index for filtering orders by user and status
            if (!$this->indexExists('orders', 'orders_user_status_index')) {
                $table->index(['user_id', 'status'], 'orders_user_status_index');
            }
            // Index for date-based queries
            if (!$this->indexExists('orders', 'orders_created_at_index')) {
                $table->index('created_at', 'orders_created_at_index');
            }
            // Index for tracking queries
            if (!$this->indexExists('orders', 'orders_tracking_code_index')) {
                $table->index('tracking_code', 'orders_tracking_code_index');
            }
        });

        // Products table - composite indexes for filtering
        Schema::table('products', function (Blueprint $table) {
            // Composite index for category + active status (common filter)
            if (!$this->indexExists('products', 'products_category_active_index')) {
                $table->index(['category_id', 'is_active'], 'products_category_active_index');
            }
            // Composite index for store + active status
            if (!$this->indexExists('products', 'products_store_active_index')) {
                $table->index(['store_id', 'is_active'], 'products_store_active_index');
            }
            // Index for price-based sorting/filtering
            if (!$this->indexExists('products', 'products_price_index')) {
                $table->index('price', 'products_price_index');
            }
            // Index for rating-based sorting
            if (!$this->indexExists('products', 'products_rating_index')) {
                $table->index('average_rating', 'products_rating_index');
            }
        });

        // Cart items table
        Schema::table('cart_items', function (Blueprint $table) {
            if (!$this->indexExists('cart_items', 'cart_items_product_index')) {
                $table->index('product_id', 'cart_items_product_index');
            }
        });

        // Order items table
        Schema::table('order_items', function (Blueprint $table) {
            // Composite index for store filtering orders
            if (!$this->indexExists('order_items', 'order_items_store_status_index')) {
                $table->index(['store_id', 'status'], 'order_items_store_status_index');
            }
            if (!$this->indexExists('order_items', 'order_items_product_index')) {
                $table->index('product_id', 'order_items_product_index');
            }
        });

        // Payment transactions table
        Schema::table('payment_transactions', function (Blueprint $table) {
            if (!$this->indexExists('payment_transactions', 'payment_transactions_created_at_index')) {
                $table->index('created_at', 'payment_transactions_created_at_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Orders table
        Schema::table('orders', function (Blueprint $table) {
            if ($this->indexExists('orders', 'orders_user_status_index')) {
                $table->dropIndex('orders_user_status_index');
            }
            if ($this->indexExists('orders', 'orders_created_at_index')) {
                $table->dropIndex('orders_created_at_index');
            }
            if ($this->indexExists('orders', 'orders_tracking_code_index')) {
                $table->dropIndex('orders_tracking_code_index');
            }
        });

        // Products table
        Schema::table('products', function (Blueprint $table) {
            if ($this->indexExists('products', 'products_category_active_index')) {
                $table->dropIndex('products_category_active_index');
            }
            if ($this->indexExists('products', 'products_store_active_index')) {
                $table->dropIndex('products_store_active_index');
            }
            if ($this->indexExists('products', 'products_price_index')) {
                $table->dropIndex('products_price_index');
            }
            if ($this->indexExists('products', 'products_rating_index')) {
                $table->dropIndex('products_rating_index');
            }
        });

        // Cart items table
        Schema::table('cart_items', function (Blueprint $table) {
            if ($this->indexExists('cart_items', 'cart_items_product_index')) {
                $table->dropIndex('cart_items_product_index');
            }
        });

        // Order items table
        Schema::table('order_items', function (Blueprint $table) {
            if ($this->indexExists('order_items', 'order_items_store_status_index')) {
                $table->dropIndex('order_items_store_status_index');
            }
            if ($this->indexExists('order_items', 'order_items_product_index')) {
                $table->dropIndex('order_items_product_index');
            }
        });

        // Payment transactions table
        Schema::table('payment_transactions', function (Blueprint $table) {
            if ($this->indexExists('payment_transactions', 'payment_transactions_created_at_index')) {
                $table->dropIndex('payment_transactions_created_at_index');
            }
        });
    }

    /**
     * Check if an index exists on a table.
     */
    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();
        
        $result = DB::select(
            "SELECT COUNT(*) as count FROM information_schema.statistics 
             WHERE table_schema = ? AND table_name = ? AND index_name = ?",
            [$databaseName, $table, $index]
        );
        
        return $result[0]->count > 0;
    }
};
