<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Notification extends Model
{
    // For default Laravel DB notifications, table uses UUID and guarded by default
    protected $table = 'notifications';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $guarded = [];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // priority is stored inside data for DB notifications; scope omitted

    public function scopeForUser($query, int $userId)
    {
        return $query->where('notifiable_type', User::class)->where('notifiable_id', $userId);
    }

    public function markAsRead(): void
    {
        $this->update([
            'read_at' => now(),
        ]);
    }
}
