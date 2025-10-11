<?php

namespace App\Http\Controllers;

use App\Models\WishlistItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WishlistItemController extends Controller
{
    /**
     * Get user's wishlist items
     */
    public function index()
    {
        $wishlistItems = WishlistItem::with('product.store', 'product.category')
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
                        'store' => $item->product->store->name,
                        'category' => $item->product->category->name,
                        'inStock' => $item->product->stock_quantity > 0,
                    ],
                    'added_at' => $item->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'success' => true,
            'wishlist_items' => $wishlistItems,
            'count' => $wishlistItems->count()
        ]);
    }

    /**
     * Add product to wishlist
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|numeric|exists:products,id',
        ]);

        // Check if already in wishlist
        $existingItem = WishlistItem::where('user_id', Auth::id())
            ->where('product_id', $request->product_id)
            ->first();

        if ($existingItem) {
            return response()->json([
                'success' => false,
                'message' => 'Product is already in your wishlist.'
            ], 409);
        }

        $wishlistItem = WishlistItem::create([
            'user_id' => Auth::id(),
            'product_id' => $request->product_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product added to wishlist successfully.',
            'wishlist_item' => $wishlistItem
        ]);
    }

    /**
     * Remove product from wishlist
     */
    public function destroy($id)
    {
        $wishlistItem = WishlistItem::where('user_id', Auth::id())
            ->where('product_id', $id)
            ->first();

        if (!$wishlistItem) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found in wishlist.'
            ], 404);
        }

        $wishlistItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product removed from wishlist successfully.'
        ]);
    }

    /**
     * Check if product is in wishlist
     */
    public function check($productId)
    {
        $isInWishlist = WishlistItem::where('user_id', Auth::id())
            ->where('product_id', $productId)
            ->exists();

        return response()->json([
            'success' => true,
            'is_in_wishlist' => $isInWishlist
        ]);
    }
}
