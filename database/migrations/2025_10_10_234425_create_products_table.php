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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 8, 2);
            $table->decimal('original_price', 8, 2)->nullable(); // For sales
            $table->string('image')->nullable(); // Primary image (URL or emoji)
            $table->json('images')->nullable(); // Multiple images (up to 4 images)
            $table->foreignId('category_id')->constrained()->onDelete('restrict');
            $table->foreignId('store_id')->constrained()->onDelete('restrict');
            $table->integer('stock_quantity')->default(0);
            $table->boolean('is_active')->default(true);
            $table->decimal('average_rating', 3, 2)->default(0.00);
            $table->integer('review_count')->default(0);
            
            // Package dimensions for shipping calculations
            $table->decimal('weight', 8, 2)->nullable(); // ounces
            $table->decimal('length', 8, 2)->nullable(); // inches
            $table->decimal('width', 8, 2)->nullable();  // inches
            $table->decimal('height', 8, 2)->nullable(); // inches
            
            $table->timestamps();
            
            $table->index('category_id');
            $table->index('store_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
