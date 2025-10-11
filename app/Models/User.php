<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'is_active',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Check if user is a customer
     */
    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    /**
     * Get the customer profile relationship
     */
    public function customerProfile()
    {
        return $this->hasOne(CustomerProfile::class);
    }

    /**
     * Get the conversations the user participates in.
     */
    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot(['role', 'joined_at', 'last_read_at', 'is_active'])
            ->withTimestamps();
    }

    /**
     * Get the messages sent by the user.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the addresses for the user.
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(UserAddress::class);
    }

    /**
     * Get the default address for the user.
     */
    public function defaultAddress(): HasOne
    {
        return $this->hasOne(UserAddress::class)->where('is_default', true);
    }

    /**
     * Get conversations assigned to this admin.
     */
    public function assignedConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'assigned_to');
    }

    /**
     * Get the message reads by this user.
     */
    public function messageReads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }

    /**
     * Get conversations where user is a customer.
     */
    public function customerConversations(): BelongsToMany
    {
        return $this->conversations()->wherePivot('role', 'customer');
    }

    /**
     * Get conversations where user is an admin.
     */
    public function adminConversations(): BelongsToMany
    {
        return $this->conversations()->wherePivot('role', 'admin');
    }

    /**
     * Get the cart items for the user.
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Get the orders for the user.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }



    /**
     * Get the wishlist items for the user.
     */
    public function wishlistItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class);
    }

    /**
     * Get the product reviews for the user.
     */
    public function productReviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }
}
