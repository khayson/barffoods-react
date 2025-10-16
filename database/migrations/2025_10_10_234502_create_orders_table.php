<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->foreignId('user_address_id')->nullable()->constrained('user_addresses')->onDelete('set null');
            $table->enum('status', ['pending_payment', 'payment_failed', 'confirmed', 'processing', 'shipped', 'delivered', 'refunded'])->default('pending_payment');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax', 8, 2)->default(0.00);
            $table->decimal('delivery_fee', 8, 2)->default(0.00);
            $table->text('delivery_address');
            $table->enum('shipping_method', ['shipping', 'fast_delivery'])->default('fast_delivery');
            $table->string('tracking_code')->nullable();
            $table->text('label_url')->nullable();
            $table->string('carrier')->nullable();
            $table->string('service')->nullable();
            $table->decimal('shipping_cost', 8, 2)->nullable();
            $table->string('rate_id')->nullable()->comment('EasyPost rate ID for label creation');
            $table->string('tracker_id')->nullable()->comment('EasyPost tracker ID');
            $table->string('estimated_delivery_date')->nullable();
            $table->string('delivery_status')->nullable()->comment('Latest tracking status from carrier');
            $table->timestamp('last_tracking_update')->nullable();
            $table->boolean('is_ready_for_delivery')->default(false)->comment('All stores have prepared their items');
            $table->timestamp('ready_at')->nullable()->comment('When all stores marked items as ready');
            $table->enum('shipping_preference', ['wait_for_all', 'ship_as_ready', 'ship_in_batches'])->default('wait_for_all')->comment('Customer shipping preference');
            $table->decimal('additional_shipping_cost', 8, 2)->default(0.00)->comment('Additional shipping cost for faster delivery');
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('status');
            $table->index('order_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
