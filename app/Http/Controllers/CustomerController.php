<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Order;
use App\Models\WishlistItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Display the customer dashboard.
     */
    public function dashboard(): Response
    {
        $user = Auth::user();

        // Recent orders (last 5)
        $recentOrders = Order::with(['orderItems.store'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'created_at' => $order->created_at->format('M d, Y'),
                    'items_count' => $order->orderItems->count(),
                ];
            });

        // Order statistics
        $totalOrders = Order::where('user_id', $user->id)->count();
        $totalSpent = Order::where('user_id', $user->id)
            ->whereNotIn('status', ['pending_payment', 'payment_failed'])
            ->sum('total_amount');
        
        // Orders by status
        $ordersByStatus = Order::where('user_id', $user->id)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Wishlist count
        $wishlistCount = WishlistItem::where('user_id', $user->id)->count();

        // Pending orders (orders that are not delivered or cancelled)
        $pendingOrders = Order::where('user_id', $user->id)
            ->whereIn('status', ['pending_payment', 'confirmed', 'processing', 'shipped'])
            ->count();

        return Inertia::render('customer/dashboard', [
            'stats' => [
                'total_orders' => $totalOrders,
                'total_spent' => (float) $totalSpent,
                'wishlist_count' => $wishlistCount,
                'pending_orders' => $pendingOrders,
                'orders_by_status' => $ordersByStatus,
            ],
            'recent_orders' => $recentOrders,
        ]);
    }
}
