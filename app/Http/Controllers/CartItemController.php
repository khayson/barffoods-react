<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\AnonymousCart;
use App\Services\CartCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class CartItemController extends Controller
{
    protected $cartCalculationService;

    public function __construct(CartCalculationService $cartCalculationService)
    {
        $this->cartCalculationService = $cartCalculationService;
    }

    /**
     * Show cart page
     */
    public function show()
    {
        \Log::info('Cart show page accessed', [
            'is_authenticated' => Auth::check(),
            'session_id' => Session::getId(),
            'user_id' => Auth::id(),
        ]);
        
        if (Auth::check()) {
            $cartItems = $this->getAuthenticatedUserCartItems();
        } else {
            $cartItems = $this->getAnonymousCartItems();
            \Log::info('Anonymous cart items retrieved', [
                'session_id' => Session::getId(),
                'items_count' => $cartItems->count(),
                'items' => $cartItems->toArray(),
            ]);
        }

        // Group items by store
        $groupedItems = $this->groupItemsByStore($cartItems);
        $totalItems = $cartItems->sum('quantity');
        $subtotal = $cartItems->sum('total_price');
        $storeCount = $groupedItems->count();

        // Calculate totals with system settings
        $calculations = $this->cartCalculationService->calculateCartTotals(
            $cartItems->toArray(), 
            Auth::id()
        );

        return Inertia::render('cart/show', [
            'cartItems' => $cartItems,
            'groupedItems' => $groupedItems,
            'totalItems' => $totalItems,
            'subtotal' => $subtotal,
            'calculations' => $calculations,
            'storeCount' => $storeCount,
            'isAuthenticated' => Auth::check(),
            'isMultiStore' => $storeCount > 1,
        ]);
    }

    /**
     * Get cart calculations API endpoint
     */
    public function getCalculations(Request $request)
    {
        if (Auth::check()) {
            $cartItems = $this->getAuthenticatedUserCartItems();
        } else {
            $cartItems = $this->getAnonymousCartItems();
        }

        $calculations = $this->cartCalculationService->calculateCartTotals(
            $cartItems->toArray(), 
            Auth::id()
        );

        return response()->json([
            'success' => true,
            'calculations' => $calculations,
            'system_settings' => $this->cartCalculationService->getSystemSettings(),
            'available_payment_methods' => $this->cartCalculationService->getAvailablePaymentMethods()
        ]);
    }

    /**
     * Get authenticated user's cart items
     */
    private function getAuthenticatedUserCartItems()
    {
        return CartItem::with('product.store', 'product.category')
            ->where('user_id', Auth::id())
            ->get()
            ->map(function ($item) {
                return [
                    'id' => (string) $item->id,
                    'product' => [
                        'id' => (string) $item->product->id,
                        'name' => $item->product->name,
                        'price' => $item->product->price,
                        'originalPrice' => $item->product->original_price,
                        'image' => $item->product->image,
                        'store' => [
                            'id' => (string) $item->product->store->id,
                            'name' => $item->product->store->name,
                        ],
                        'category' => [
                            'id' => (string) $item->product->category->id,
                            'name' => $item->product->category->name,
                        ],
                        'inStock' => $item->product->stock_quantity > 0,
                        'stockQuantity' => $item->product->stock_quantity,
                    ],
                    'quantity' => $item->quantity,
                    'total_price' => $item->total_price,
                    'added_at' => $item->created_at->format('Y-m-d H:i:s'),
                ];
            });
    }

    /**
     * Get anonymous user's cart items
     */
    public function getAnonymousCartItems()
    {
        $sessionId = Session::getId();
        $anonymousCart = AnonymousCart::getOrCreateForSession($sessionId);
        
        $cartItems = collect();
        
        if (!empty($anonymousCart->cart_data)) {
            foreach ($anonymousCart->cart_data as $item) {
                $product = Product::with('store', 'category')->find($item['product_id']);
                
                if ($product) {
                    $cartItems->push([
                        'id' => 'anonymous_' . $item['product_id'] . '_' . $item['added_at'],
                        'product' => [
                            'id' => (string) $product->id,
                            'name' => $product->name,
                            'price' => $product->price,
                            'originalPrice' => $product->original_price,
                            'image' => $product->image,
                            'store' => [
                                'id' => (string) $product->store->id,
                                'name' => $product->store->name,
                            ],
                            'category' => [
                                'id' => (string) $product->category->id,
                                'name' => $product->category->name,
                            ],
                            'inStock' => $product->stock_quantity > 0,
                            'stockQuantity' => $product->stock_quantity,
                        ],
                        'quantity' => $item['quantity'],
                        'total_price' => $product->price * $item['quantity'],
                        'added_at' => $item['added_at'],
                    ]);
                }
            }
        }

        return $cartItems;
    }

    /**
     * Group cart items by store
     */
    private function groupItemsByStore($cartItems)
    {
        return $cartItems->groupBy('product.store.name')->map(function ($items, $storeName) {
            return [
                'storeName' => $storeName,
                'storeId' => $items->first()['product']['store']['id'],
                'items' => $items,
                'itemCount' => $items->count(),
                'totalQuantity' => $items->sum('quantity'),
                'totalPrice' => $items->sum('total_price'),
            ];
        });
    }

    /**
     * Get user's cart items
     */
    public function index()
    {
        if (Auth::check()) {
            return $this->getAuthenticatedUserCart();
        } else {
            return $this->getAnonymousCart();
        }
    }

    /**
     * Get authenticated user's cart
     */
    private function getAuthenticatedUserCart()
    {
        $cartItems = CartItem::with('product.store', 'product.category')
            ->where('user_id', Auth::id())
            ->get()
            ->map(function ($item) {
                return [
                    'id' => (string) $item->id,
                    'product' => [
                        'id' => (string) $item->product->id,
                        'name' => $item->product->name,
                        'price' => $item->product->price,
                        'originalPrice' => $item->product->original_price,
                        'image' => $item->product->image,
                        'store' => [
                            'id' => (string) $item->product->store->id,
                            'name' => $item->product->store->name,
                        ],
                        'category' => [
                            'id' => (string) $item->product->category->id,
                            'name' => $item->product->category->name,
                        ],
                        'inStock' => $item->product->stock_quantity > 0,
                        'stockQuantity' => $item->product->stock_quantity,
                    ],
                    'quantity' => $item->quantity,
                    'total_price' => $item->total_price,
                    'added_at' => $item->created_at->format('Y-m-d H:i:s'),
                ];
            });

        $totalItems = $cartItems->sum('quantity');
        $totalPrice = $cartItems->sum('total_price');

        return response()->json([
            'success' => true,
            'cart_items' => $cartItems->toArray(),
            'total_items' => $totalItems,
            'total_price' => $totalPrice,
            'count' => $cartItems->count()
        ]);
    }

    /**
     * Get anonymous user's cart
     */
    public function getAnonymousCart()
    {
        $sessionId = Session::getId();
        $anonymousCart = AnonymousCart::getOrCreateForSession($sessionId);
        
        $cartItems = collect();
        
        if (!empty($anonymousCart->cart_data)) {
            foreach ($anonymousCart->cart_data as $item) {
                $product = Product::with('store', 'category')->find($item['product_id']);
                
                if ($product) {
                    $cartItems->push([
                        'id' => 'anonymous_' . $item['product_id'] . '_' . $item['added_at'],
                        'product' => [
                            'id' => (string) $product->id,
                            'name' => $product->name,
                            'price' => $product->price,
                            'originalPrice' => $product->original_price,
                            'image' => $product->image,
                            'store' => [
                                'id' => (string) $product->store->id,
                                'name' => $product->store->name,
                            ],
                            'category' => [
                                'id' => (string) $product->category->id,
                                'name' => $product->category->name,
                            ],
                            'inStock' => $product->stock_quantity > 0,
                            'stockQuantity' => $product->stock_quantity,
                        ],
                        'quantity' => $item['quantity'],
                        'total_price' => $product->price * $item['quantity'],
                        'added_at' => $item['added_at'],
                    ]);
                }
            }
        }

        $totalItems = $cartItems->sum('quantity');
        $totalPrice = $cartItems->sum('total_price');

        \Log::info('Anonymous cart data returned', [
            'session_id' => $sessionId,
            'cart_items_count' => $cartItems->count(),
            'total_items' => $totalItems,
            'total_price' => $totalPrice,
            'cart_items' => $cartItems->toArray()
        ]);

        return response()->json([
            'success' => true,
            'cart_items' => $cartItems->toArray(),
            'total_items' => $totalItems,
            'total_price' => $totalPrice,
            'count' => $cartItems->count()
        ]);
    }

    /**
     * Add product to cart
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|numeric|exists:products,id',
            'quantity' => 'required|integer|min:1|max:99',
        ]);

        if (Auth::check()) {
            return $this->addToAuthenticatedUserCart($request);
        } else {
            return $this->addToAnonymousCart($request);
        }
    }

    /**
     * Add to authenticated user's cart
     */
    private function addToAuthenticatedUserCart(Request $request)
    {
        $product = Product::findOrFail($request->product_id);

        // Check if product is in stock
        if ($product->stock_quantity < $request->quantity) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient stock. Only ' . $product->stock_quantity . ' items available.'
            ], 422);
        }

        // Check if already in cart
        $existingItem = CartItem::where('user_id', Auth::id())
            ->where('product_id', $request->product_id)
            ->first();

        if ($existingItem) {
            // Update quantity
            $newQuantity = $existingItem->quantity + $request->quantity;
            
            if ($newQuantity > $product->stock_quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient stock. Only ' . $product->stock_quantity . ' items available.'
                ], 422);
            }

            $existingItem->update(['quantity' => $newQuantity]);
            
            return response()->json([
                'success' => true,
                'message' => 'Cart updated successfully.',
                'cart_item' => $existingItem
            ]);
        }

        // Create new cart item
        $cartItem = CartItem::create([
            'user_id' => Auth::id(),
            'product_id' => $request->product_id,
            'quantity' => $request->quantity,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product added to cart successfully.',
            'cart_item' => $cartItem
        ]);
    }

    /**
     * Add to anonymous user's cart
     */
    public function addToAnonymousCart(Request $request)
    {
        $product = Product::findOrFail($request->product_id);

        // Check if product is in stock
        if ($product->stock_quantity < $request->quantity) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient stock. Only ' . $product->stock_quantity . ' items available.'
            ], 422);
        }

        $sessionId = Session::getId();
        $anonymousCart = AnonymousCart::getOrCreateForSession($sessionId);
        
        // Check if already in cart
        $cartData = $anonymousCart->cart_data ?? [];
        $existingIndex = null;
        
        foreach ($cartData as $index => $item) {
            if ($item['product_id'] == $request->product_id) {
                $existingIndex = $index;
                break;
            }
        }

        if ($existingIndex !== null) {
            // Update existing item
            $newQuantity = $cartData[$existingIndex]['quantity'] + $request->quantity;
            
            if ($newQuantity > $product->stock_quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient stock. Only ' . $product->stock_quantity . ' items available.'
                ], 422);
            }
            
            $cartData[$existingIndex]['quantity'] = $newQuantity;
        } else {
            // Add new item
            $cartData[] = [
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
                'added_at' => now()->toISOString(),
            ];
        }

        $anonymousCart->update(['cart_data' => $cartData]);

        return response()->json([
            'success' => true,
            'message' => 'Product added to cart successfully.',
        ]);
    }

    /**
     * Update cart item quantity
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1|max:99',
        ]);

        if (Auth::check()) {
            return $this->updateAuthenticatedUserCartItem($request, $id);
        } else {
            return $this->updateAnonymousCartItem($request, $id);
        }
    }

    /**
     * Update authenticated user's cart item
     */
    private function updateAuthenticatedUserCartItem(Request $request, $id)
    {
        $cartItem = CartItem::where('user_id', Auth::id())
            ->where('id', $id)
            ->first();

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Cart item not found.'
            ], 404);
        }

        $product = $cartItem->product;

        // Check stock
        if ($request->quantity > $product->stock_quantity) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient stock. Only ' . $product->stock_quantity . ' items available.'
            ], 422);
        }

        $cartItem->update(['quantity' => $request->quantity]);

        return response()->json([
            'success' => true,
            'message' => 'Cart item updated successfully.',
            'cart_item' => $cartItem
        ]);
    }

    /**
     * Update anonymous user's cart item
     */
    public function updateAnonymousCartItem(Request $request, $id)
    {
        \Log::info('updateAnonymousCartItem called', [
            'id' => $id,
            'quantity' => $request->quantity,
            'session_id' => Session::getId()
        ]);
        
        // Extract product ID from anonymous cart item ID format: anonymous_{product_id}_{added_at}
        $parts = explode('_', $id);
        if (count($parts) < 3 || $parts[0] !== 'anonymous') {
            \Log::error('Invalid cart item ID format', ['id' => $id, 'parts' => $parts]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid cart item ID format.'
            ], 400);
        }
        
        $productId = $parts[1];
        \Log::info('Extracted product ID', ['product_id' => $productId]);
        
        $sessionId = Session::getId();
        $anonymousCart = AnonymousCart::getOrCreateForSession($sessionId);
        
        $product = Product::find($productId);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.'
            ], 404);
        }

        // Check stock
        if ($request->quantity > $product->stock_quantity) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient stock. Only ' . $product->stock_quantity . ' items available.'
            ], 422);
        }

        $anonymousCart->updateItemQuantity($productId, $request->quantity);

        \Log::info('Cart item updated successfully', [
            'product_id' => $productId,
            'new_quantity' => $request->quantity,
            'cart_data' => $anonymousCart->cart_data
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cart item updated successfully.',
        ]);
    }

    /**
     * Remove product from cart
     */
    public function destroy($id)
    {
        if (Auth::check()) {
            return $this->removeFromAuthenticatedUserCart($id);
        } else {
            return $this->removeFromAnonymousCart($id);
        }
    }

    /**
     * Remove from authenticated user's cart
     */
    private function removeFromAuthenticatedUserCart($id)
    {
        $cartItem = CartItem::where('user_id', Auth::id())
            ->where('id', $id)
            ->first();

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Cart item not found.'
            ], 404);
        }

        $cartItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product removed from cart successfully.'
        ]);
    }

    /**
     * Remove from anonymous user's cart
     */
    public function removeFromAnonymousCart($id)
    {
        // Extract product ID from anonymous cart item ID format: anonymous_{product_id}_{added_at}
        $parts = explode('_', $id);
        if (count($parts) < 3 || $parts[0] !== 'anonymous') {
            return response()->json([
                'success' => false,
                'message' => 'Invalid cart item ID format.'
            ], 400);
        }
        
        $productId = $parts[1];
        
        $sessionId = Session::getId();
        $anonymousCart = AnonymousCart::getOrCreateForSession($sessionId);
        
        $anonymousCart->removeItem($productId);

        return response()->json([
            'success' => true,
            'message' => 'Product removed from cart successfully.'
        ]);
    }

    /**
     * Clear entire cart
     */
    public function clear()
    {
        if (Auth::check()) {
            return $this->clearAuthenticatedUserCart();
        } else {
            return $this->clearAnonymousCart();
        }
    }

    /**
     * Clear authenticated user's cart
     */
    private function clearAuthenticatedUserCart()
    {
        CartItem::where('user_id', Auth::id())->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared successfully.'
        ]);
    }

    /**
     * Clear anonymous user's cart
     */
    public function clearAnonymousCart()
    {
        $sessionId = Session::getId();
        $anonymousCart = AnonymousCart::getOrCreateForSession($sessionId);
        
        $anonymousCart->clear();

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared successfully.'
        ]);
    }
}
