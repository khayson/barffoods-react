<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Display the admin dashboard.
     */
    public function dashboard(): Response
    {
        // Get date ranges
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();

        // Total counts
        $totalOrders = Order::count();
        $totalProducts = Product::count();
        $totalCustomers = User::where('role', 'customer')->count();
        $totalStores = Store::count();
        $totalCategories = Category::count();

        // Revenue calculations (exclude pending_payment and payment_failed)
        $totalRevenue = Order::whereNotIn('status', ['pending_payment', 'payment_failed'])->sum('total_amount');
        $monthlyRevenue = Order::whereNotIn('status', ['pending_payment', 'payment_failed'])
            ->whereBetween('created_at', [$startOfMonth, now()])
            ->sum('total_amount');
        $lastMonthRevenue = Order::whereNotIn('status', ['pending_payment', 'payment_failed'])
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('total_amount');

        // Calculate revenue growth
        $revenueGrowth = $lastMonthRevenue > 0 
            ? (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 
            : 0;

        // Orders this month
        $monthlyOrders = Order::whereBetween('created_at', [$startOfMonth, now()])->count();
        $lastMonthOrders = Order::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();
        $ordersGrowth = $lastMonthOrders > 0 
            ? (($monthlyOrders - $lastMonthOrders) / $lastMonthOrders) * 100 
            : 0;

        // Recent orders
        $recentOrders = Order::with(['user', 'orderItems.store'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($order) {
                // Get store info from order items
                $storeNames = $order->orderItems
                    ->pluck('store.name')
                    ->unique()
                    ->filter()
                    ->take(2)
                    ->join(', ');
                
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->user->name ?? 'Guest',
                    'store_name' => $storeNames ?: 'N/A',
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'created_at' => $order->created_at->format('M d, Y H:i'),
                ];
            });

        // Low stock products
        $lowStockProducts = Product::where('stock_quantity', '>', 0)
            ->where('stock_quantity', '<', 10)
            ->orderBy('stock_quantity', 'asc')
            ->limit(5)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'stock_quantity' => $product->stock_quantity,
                    'image' => $product->images[0] ?? $product->image ?? '📦',
                ];
            });

        // Sales chart data (last 7 days)
        $salesChartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $sales = Order::whereNotIn('status', ['pending_payment', 'payment_failed'])
                ->whereDate('created_at', $date)
                ->sum('total_amount');
            $salesChartData[] = [
                'date' => $date->format('M d'),
                'sales' => (float) $sales,
            ];
        }

        // Orders by status
        $ordersByStatus = Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->status => $item->count];
            });

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_orders' => $totalOrders,
                'total_products' => $totalProducts,
                'total_customers' => $totalCustomers,
                'total_stores' => $totalStores,
                'total_categories' => $totalCategories,
                'total_revenue' => (float) $totalRevenue,
                'monthly_revenue' => (float) $monthlyRevenue,
                'revenue_growth' => round($revenueGrowth, 1),
                'monthly_orders' => $monthlyOrders,
                'orders_growth' => round($ordersGrowth, 1),
            ],
            'recent_orders' => $recentOrders,
            'low_stock_products' => $lowStockProducts,
            'sales_chart_data' => $salesChartData,
            'orders_by_status' => $ordersByStatus,
        ]);
    }

    /**
     * Display the admin notifications page.
     */
    public function notifications(): Response
    {
        // Limit to 20 most recent notifications for dashboard
        $notifications = Notification::orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        // Get active users (limited for dropdown)
        $users = User::select('id', 'name', 'email', 'role')
            ->where('is_active', true)
            ->orderBy('name')
            ->limit(100)
            ->get();

        return Inertia::render('admin/notifications', [
            'notifications' => $notifications,
            'users' => $users,
        ]);
    }
}
