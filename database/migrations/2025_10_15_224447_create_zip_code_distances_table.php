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
        Schema::create('zip_code_distances', function (Blueprint $table) {
            $table->id();
            $table->string('from_zip', 5)->index()->comment('From ZIP code');
            $table->string('to_zip', 5)->index()->comment('To ZIP code');
            $table->decimal('distance_miles', 8, 2)->comment('Distance in miles');
            $table->timestamps();
            
            // Composite unique index for fast lookups
            $table->unique(['from_zip', 'to_zip']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zip_code_distances');
    }
};
