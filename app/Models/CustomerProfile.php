<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'date_of_birth',
        'gender',
        'default_address_id',
        'preferred_store_id',
        'dietary_preferences',
        'allergies',
        'notification_preferences',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'dietary_preferences' => 'array',
        'allergies' => 'array',
        'notification_preferences' => 'array',
    ];

    /**
     * Get the user that owns the profile
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
