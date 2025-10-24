<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WishlistShareController extends Controller
{
    /**
     * Generate or regenerate share token for authenticated user
     */
    public function generateToken(Request $request)
    {
        $user = $request->user();
        
        // Generate a unique token
        $token = Str::random(32);
        
        $user->update([
            'wishlist_share_token' => $token,
            'is_wishlist_public' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Share link generated successfully!',
            'share_token' => $token,
            'share_url' => url("/wishlist/shared/{$token}"),
            'is_public' => true,
        ]);
    }

    /**
     * Toggle wishlist privacy (public/private)
     */
    public function togglePrivacy(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'is_public' => 'required|boolean',
        ]);

        // If making public and no token exists, generate one
        if ($request->is_public && !$user->wishlist_share_token) {
            $user->wishlist_share_token = Str::random(32);
        }

        $user->update([
            'is_wishlist_public' => $request->is_public,
        ]);

        return response()->json([
            'success' => true,
            'message' => $request->is_public 
                ? 'Your wishlist is now public!' 
                : 'Your wishlist is now private!',
            'is_public' => $user->is_wishlist_public,
            'share_token' => $user->wishlist_share_token,
            'share_url' => $user->wishlist_share_token 
                ? url("/wishlist/shared/{$user->wishlist_share_token}") 
                : null,
        ]);
    }

    /**
     * Get current share settings
     */
    public function getSettings(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'is_public' => $user->is_wishlist_public,
            'share_token' => $user->wishlist_share_token,
            'share_url' => $user->wishlist_share_token 
                ? url("/wishlist/shared/{$user->wishlist_share_token}") 
                : null,
        ]);
    }

    /**
     * View shared wishlist (public route)
     */
    public function show(string $token)
    {
        // Find user by share token
        $user = User::where('wishlist_share_token', $token)->first();

        // Check if user exists and wishlist is public
        if (!$user || !$user->is_wishlist_public) {
            abort(404, 'This wishlist is not available or has been set to private.');
        }

        // Get wishlist items with product details
        $wishlistItems = WishlistItem::where('user_id', $user->id)
            ->with(['product.store', 'product.category'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product' => [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'slug' => $item->product->slug,
                        'description' => $item->product->description,
                        'price' => $item->product->price,
                        'image' => $item->product->image,
                        'images' => $item->product->images,
                        'store' => $item->product->store->name,
                        'store_id' => $item->product->store_id,
                        'category' => $item->product->category->name,
                        'category_id' => $item->product->category_id,
                        'inStock' => $item->product->stock_quantity > 0,
                        'stock_quantity' => $item->product->stock_quantity,
                    ],
                    'added_at' => $item->created_at->toISOString(),
                ];
            });

        return Inertia::render('wishlist-shared', [
            'owner' => [
                'name' => $user->name,
                'avatar' => $user->avatar,
            ],
            'wishlistItems' => $wishlistItems,
            'itemCount' => $wishlistItems->count(),
        ]);
    }
}

