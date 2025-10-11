<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnonymousCart extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'cart_data',
        'last_accessed_at',
    ];

    protected $casts = [
        'cart_data' => 'array',
        'last_accessed_at' => 'datetime',
    ];

    /**
     * Get or create anonymous cart for session
     */
    public static function getOrCreateForSession($sessionId)
    {
        $cart = self::where('session_id', $sessionId)->first();
        
        if (!$cart) {
            $cart = self::create([
                'session_id' => $sessionId,
                'cart_data' => [],
                'last_accessed_at' => now(),
            ]);
        } else {
            $cart->update(['last_accessed_at' => now()]);
        }
        
        return $cart;
    }

    /**
     * Add item to anonymous cart
     */
    public function addItem($productId, $quantity = 1)
    {
        $cartData = $this->cart_data ?? [];
        
        // Check if item already exists
        $existingIndex = null;
        foreach ($cartData as $index => $item) {
            if ($item['product_id'] == $productId) {
                $existingIndex = $index;
                break;
            }
        }
        
        if ($existingIndex !== null) {
            // Update existing item
            $cartData[$existingIndex]['quantity'] += $quantity;
        } else {
            // Add new item
            $cartData[] = [
                'product_id' => $productId,
                'quantity' => $quantity,
                'added_at' => now()->toISOString(),
            ];
        }
        
        $this->update(['cart_data' => $cartData]);
        return $this;
    }

    /**
     * Update item quantity in anonymous cart
     */
    public function updateItemQuantity($productId, $quantity)
    {
        $cartData = $this->cart_data ?? [];
        
        \Log::info('updateItemQuantity called', [
            'product_id' => $productId,
            'new_quantity' => $quantity,
            'current_cart_data' => $cartData
        ]);
        
        foreach ($cartData as $index => $item) {
            if ($item['product_id'] == $productId) {
                if ($quantity <= 0) {
                    unset($cartData[$index]);
                } else {
                    $cartData[$index]['quantity'] = $quantity;
                }
                break;
            }
        }
        
        \Log::info('updateItemQuantity after update', [
            'product_id' => $productId,
            'new_quantity' => $quantity,
            'updated_cart_data' => $cartData
        ]);
        
        $this->update(['cart_data' => array_values($cartData)]);
        return $this;
    }

    /**
     * Remove item from anonymous cart
     */
    public function removeItem($productId)
    {
        $cartData = $this->cart_data ?? [];
        
        $cartData = array_filter($cartData, function($item) use ($productId) {
            return $item['product_id'] != $productId;
        });
        
        $this->update(['cart_data' => array_values($cartData)]);
        return $this;
    }

    /**
     * Clear all items from anonymous cart
     */
    public function clear()
    {
        $this->update(['cart_data' => []]);
        return $this;
    }

    /**
     * Migrate anonymous cart to user cart
     */
    public function migrateToUser($userId)
    {
        $cartData = $this->cart_data ?? [];
        
        foreach ($cartData as $item) {
            // Check if user already has this product in cart
            $existingCartItem = CartItem::where('user_id', $userId)
                ->where('product_id', $item['product_id'])
                ->first();
            
            if ($existingCartItem) {
                // Update existing cart item
                $existingCartItem->update([
                    'quantity' => $existingCartItem->quantity + $item['quantity']
                ]);
            } else {
                // Create new cart item
                CartItem::create([
                    'user_id' => $userId,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }
        }
        
        // Delete anonymous cart after migration
        $this->delete();
    }
}