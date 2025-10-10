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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Who sent the message
            $table->text('content'); // Message content
            $table->enum('type', ['text', 'image', 'file', 'system'])->default('text');
            $table->string('attachment_path')->nullable(); // For file/image attachments
            $table->string('attachment_name')->nullable(); // Original filename
            $table->boolean('is_read')->default(false); // Quick read status
            $table->timestamp('read_at')->nullable(); // When it was read
            $table->timestamps();
            
            $table->index(['conversation_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['is_read', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
