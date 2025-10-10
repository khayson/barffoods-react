<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'user_id',
        'content',
        'type',
        'attachment_path',
        'attachment_name',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    /**
     * Get the conversation that owns the message.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the user who sent the message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the read status for this message.
     */
    public function reads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }

    /**
     * Check if a specific user has read this message.
     */
    public function isReadBy($userId): bool
    {
        return $this->reads()->where('user_id', $userId)->exists();
    }

    /**
     * Mark message as read by a specific user.
     */
    public function markAsReadBy($userId): void
    {
        $this->reads()->firstOrCreate(['user_id' => $userId]);
        $this->update(['is_read' => true, 'read_at' => now()]);
    }

    /**
     * Scope for unread messages.
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for messages by type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for messages in a specific conversation.
     */
    public function scopeInConversation($query, $conversationId)
    {
        return $query->where('conversation_id', $conversationId);
    }

    /**
     * Scope for messages from a specific user.
     */
    public function scopeFromUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
