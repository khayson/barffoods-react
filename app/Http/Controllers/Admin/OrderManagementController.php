<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderManagementController extends Controller
{
    /**
     * Display a listing of orders
     */
    public function index(Request $request)
    {
        $query = Order::with(['user', 'store', 'orderGroup', 'orderItems.product']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by store
        if ($request->has('store_id') && $request->store_id !== 'all') {
            $query->where('store_id', $request->store_id);
        }

        // Filter by multi-store orders
        if ($request->has('multi_store') && $request->multi_store === 'true') {
            $query->whereNotNull('order_group_id');
        }

        // Search by order number
        if ($request->has('search') && $request->search) {
            $query->where('order_number', 'like', '%' . $request->search . '%');
        }

        $orders = $query->orderBy('priority', 'desc')->orderBy('created_at', 'desc')->paginate(20);

        // Get stores for filter dropdown
        $stores = \App\Models\Store::select('id', 'name')->get();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'stores' => $stores,
            'filters' => $request->only(['status', 'store_id', 'multi_store', 'search'])
        ]);
    }

    /**
     * Display order groups (multi-store orders)
     */
    public function groups(Request $request)
    {
        $query = OrderGroup::with(['user', 'orders.store', 'orders.orderItems.product']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by group number
        if ($request->has('search') && $request->search) {
            $query->where('group_number', 'like', '%' . $request->search . '%');
        }

        $orderGroups = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('admin/orders/groups', [
            'orderGroups' => $orderGroups,
            'filters' => $request->only(['status', 'search'])
        ]);
    }

    /**
     * Display the specified order group
     */
    public function showGroup($id)
    {
        $orderGroup = OrderGroup::with([
            'user',
            'userAddress',
            'orders.store',
            'orders.orderItems.product',
            'orders.paymentTransactions',
            'orders.statusHistory'
        ])->findOrFail($id);

        return Inertia::render('admin/orders/group-show', [
            'orderGroup' => $orderGroup
        ]);
    }

    /**
     * Update order status
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,preparing,delivered,cancelled'
        ]);

        $order = Order::findOrFail($id);
        $order->update(['status' => $request->status]);

        // Create status history entry
        $order->statusHistory()->create([
            'status' => $request->status,
            'note' => 'Status updated by admin',
            'created_by' => Auth::id()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully'
        ]);
    }

    /**
     * Update order group status
     */
    public function updateGroupStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,processing,shipped,delivered,cancelled'
        ]);

        $orderGroup = OrderGroup::findOrFail($id);
        $orderGroup->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Order group status updated successfully'
        ]);
    }

    /**
     * Update order priority
     */
    public function updatePriority(Request $request, $id)
    {
        $request->validate([
            'priority' => 'required|integer|min:0|max:10'
        ]);

        $order = Order::findOrFail($id);
        $order->update(['priority' => $request->priority]);

        return response()->json([
            'success' => true,
            'message' => 'Order priority updated successfully'
        ]);
    }

    /**
     * Bulk update order priorities
     */
    public function bulkUpdatePriority(Request $request)
    {
        $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|exists:orders,id',
            'orders.*.priority' => 'required|integer|min:0|max:10'
        ]);

        foreach ($request->orders as $orderData) {
            Order::where('id', $orderData['id'])
                ->update(['priority' => $orderData['priority']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order priorities updated successfully'
        ]);
    }

    /**
     * Mark order as ready for delivery
     */
    public function markAsReady(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $order->update([
            'is_ready_for_delivery' => true,
            'ready_at' => now()
        ]);

        // Simple notification - no complex coordination logic
        // Admin controls each store independently
        
        return response()->json([
            'success' => true,
            'message' => 'Order marked as ready for delivery'
        ]);
    }

    /**
     * Get order group readiness status
     */
    public function getGroupReadiness($id)
    {
        $orderGroup = OrderGroup::with('orders.store')->findOrFail($id);
        
        $readiness = [
            'group_id' => $orderGroup->id,
            'delivery_preference' => $orderGroup->delivery_preference,
            'all_ready' => $orderGroup->orders->every('is_ready_for_delivery', true),
            'stores' => $orderGroup->orders->map(function($order) {
                return [
                    'order_id' => $order->id,
                    'store_name' => $order->store->name,
                    'is_ready' => $order->is_ready_for_delivery,
                    'ready_at' => $order->ready_at,
                    'priority' => $order->priority
                ];
            })
        ];

        return response()->json($readiness);
    }
}
