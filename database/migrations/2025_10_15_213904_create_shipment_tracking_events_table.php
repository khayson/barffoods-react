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
        Schema::create('shipment_tracking_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->string('tracking_code');
            $table->string('status'); // pre_transit, in_transit, out_for_delivery, delivered, returned, failure, cancelled, error
            $table->text('message');
            $table->string('location')->nullable(); // City, State, Zip
            $table->string('carrier')->nullable(); // USPS, FedEx, UPS, etc.
            $table->string('carrier_status_code')->nullable();
            $table->text('carrier_status_detail')->nullable();
            $table->timestamp('occurred_at'); // When event happened (from carrier)
            $table->string('source')->default('webhook'); // webhook, manual_check, admin
            $table->json('raw_data')->nullable(); // Full EasyPost response
            $table->timestamps();
            
            $table->index(['order_id', 'occurred_at']);
            $table->index('tracking_code');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipment_tracking_events');
    }
};
