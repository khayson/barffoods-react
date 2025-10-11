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
        Schema::create('anonymous_carts', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->unique();
            $table->json('cart_data'); // Store cart items as JSON
            $table->timestamp('last_accessed_at')->nullable();
            $table->timestamps();
            
            $table->index('session_id');
            $table->index('last_accessed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anonymous_carts');
    }
};