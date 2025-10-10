<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationParticipant extends Model
{
    protected $fillable = [
        'conversation_id',
        'user_id',
        'role',
        'joined_at',
        'last_read_at',
        'is_active',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'last_read_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Get the conversation that owns the participant.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the user that owns the participant.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for active participants.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for participants with a specific role.
     */
    public function scopeWithRole($query, $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope for customers.
     */
    public function scopeCustomers($query)
    {
        return $query->where('role', 'customer');
    }

    /**
     * Scope for admins.
     */
    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }
}
