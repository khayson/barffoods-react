<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductReview extends Model
{
    protected $fillable = [
        'product_id',
        'user_id',
        'rating',
        'comment',
        'is_approved',
        'helpful_count',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_approved' => 'boolean',
    ];

    /**
     * Get the product that owns the review.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the user that owns the review.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the helpful votes for the review.
     */
    public function helpfulVotes(): HasMany
    {
        return $this->hasMany(ReviewHelpfulVote::class, 'review_id');
    }

    /**
     * Check if a user has voted helpful for this review.
     */
    public function isHelpfulByUser($userId): bool
    {
        return $this->helpfulVotes()
            ->where('user_id', $userId)
            ->where('is_helpful', true)
            ->exists();
    }

    /**
     * Get the count of helpful votes.
     */
    public function getHelpfulCountAttribute(): int
    {
        return $this->helpfulVotes()->where('is_helpful', true)->count();
    }

    /**
     * Scope for approved reviews.
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }
}
