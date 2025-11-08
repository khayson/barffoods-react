<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
        
        if (empty($cartData)) {
            \Log::info('No cart data to migrate', ['user_id' => $userId]);
            $this->delete();
            return;
        }
        
        \DB::beginTransaction();
        
        try {
            $migratedCount = 0;
            $skippedCount = 0;
            
            foreach ($cartData as $item) {
                // Validate item structure
                if (!isset($item['product_id']) || !isset($item['quantity'])) {
                    \Log::warning('Invalid cart item structure during migration', [
                        'user_id' => $userId,
                        'item' => $item
                    ]);
                    $skippedCount++;
                    continue;
                }
                
                // Verify product exists
                $product = Product::find($item['product_id']);
                if (!$product) {
                    \Log::warning('Product not found during cart migration', [
                        'user_id' => $userId,
                        'product_id' => $item['product_id']
                    ]);
                    $skippedCount++;
                    continue;
                }
                
                // Check if product is active
                if (!$product->is_active) {
                    \Log::info('Skipping inactive product during migration', [
                        'user_id' => $userId,
                        'product_id' => $item['product_id']
                    ]);
                    $skippedCount++;
                    continue;
                }
                
                // Check stock availability
                if ($product->stock_quantity < $item['quantity']) {
                    \Log::warning('Insufficient stock during cart migration', [
                        'user_id' => $userId,
                        'product_id' => $item['product_id'],
                        'requested' => $item['quantity'],
                        'available' => $product->stock_quantity
                    ]);
                    // Adjust quantity to available stock
                    $item['quantity'] = max(1, $product->stock_quantity);
                }
                
                // Check if user already has this product in cart
                $existingCartItem = CartItem::where('user_id', $userId)
                    ->where('product_id', $item['product_id'])
                    ->first();
                
                if ($existingCartItem) {
                    // Update existing cart item
                    $newQuantity = $existingCartItem->quantity + $item['quantity'];
                    
                    // Check if new quantity exceeds stock
                    if ($newQuantity > $product->stock_quantity) {
                        $newQuantity = $product->stock_quantity;
                        \Log::info('Adjusted merged quantity to available stock', [
                            'user_id' => $userId,
                            'product_id' => $item['product_id'],
                            'adjusted_quantity' => $newQuantity
                        ]);
                    }
                    
                    $existingCartItem->update(['quantity' => $newQuantity]);
                    $migratedCount++;
                } else {
                    // Create new cart item
                    CartItem::create([
                        'user_id' => $userId,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                    ]);
                    $migratedCount++;
                }
            }
            
            \DB::commit();
            
            \Log::info('Cart migration completed', [
                'user_id' => $userId,
                'migrated' => $migratedCount,
                'skipped' => $skippedCount
            ]);
            
            // Delete anonymous cart after successful migration
            $this->delete();
            
        } catch (\Exception $e) {
            \DB::rollBack();
            
            \Log::error('Cart migration failed', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }
}