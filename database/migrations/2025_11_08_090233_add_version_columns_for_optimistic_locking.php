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
        // Add version column to orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('version')->default(0)->after('updated_at');
        });

        // Add version column to products table
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('version')->default(0)->after('updated_at');
        });

        // Add version column to payment_transactions table
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('version')->default(0)->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('version');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('version');
        });

        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropColumn('version');
        });
    }
};
