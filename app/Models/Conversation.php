<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    protected $fillable = [
        'subject',
        'status',
        'priority',
        'notes',
        'last_message_at',
        'assigned_to',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    /**
     * Get the messages for the conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    /**
     * Get the participants in the conversation.
     */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot(['role', 'joined_at', 'last_read_at', 'is_active'])
            ->withTimestamps();
    }

    /**
     * Get the assigned admin for the conversation.
     */
    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the customer in the conversation.
     */
    public function customer(): BelongsToMany
    {
        return $this->participants()->wherePivot('role', 'customer');
    }

    /**
     * Get the admins in the conversation.
     */
    public function admins(): BelongsToMany
    {
        return $this->participants()->wherePivot('role', 'admin');
    }

    /**
     * Get the latest message in the conversation.
     */
    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latest();
    }

    /**
     * Scope for open conversations.
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    /**
     * Scope for in-progress conversations.
     */
    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    /**
     * Scope for resolved conversations.
     */
    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    /**
     * Scope for conversations assigned to a specific admin.
     */
    public function scopeAssignedTo($query, $adminId)
    {
        return $query->where('assigned_to', $adminId);
    }

    /**
     * Scope for conversations with a specific priority.
     */
    public function scopeWithPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }
}
