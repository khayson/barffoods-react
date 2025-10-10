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
        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['customer', 'admin', 'support'])->default('customer'); // Role in this conversation
            $table->timestamp('joined_at')->useCurrent(); // When they joined the conversation
            $table->timestamp('last_read_at')->nullable(); // Last time they read messages
            $table->boolean('is_active')->default(true); // Whether they're still active in the conversation
            $table->timestamps();
            
            $table->unique(['conversation_id', 'user_id']); // Prevent duplicate participants
            $table->index(['user_id', 'is_active']);
            $table->index(['conversation_id', 'role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_participants');
    }
};
