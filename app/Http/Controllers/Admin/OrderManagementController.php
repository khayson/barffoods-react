<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\OrderStatusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderManagementController extends Controller
{
    protected OrderStatusService $orderStatusService;

    public function __construct(OrderStatusService $orderStatusService)
    {
        $this->orderStatusService = $orderStatusService;
    }
    /**
     * Display a listing of orders
     */
    public function index(Request $request)
    {
        $query = Order::with(['user', 'orderItems.product', 'orderItems.store']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by store (through order items)
        if ($request->has('store_id') && $request->store_id !== 'all') {
            $query->whereHas('orderItems', function($itemQuery) use ($request) {
                $itemQuery->where('store_id', $request->store_id);
            });
        }

        // Search by order number or customer name
        if ($request->has('search') && $request->search) {
            $query->where(function($q) use ($request) {
                $q->where('order_number', 'like', '%' . $request->search . '%')
                  ->orWhereHas('user', function($userQuery) use ($request) {
                      $userQuery->where('name', 'like', '%' . $request->search . '%')
                               ->orWhere('email', 'like', '%' . $request->search . '%');
                  });
            });
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(20);

        // Transform orders to include store information
        $orders->getCollection()->transform(function ($order) {
            $order->store_names = $order->orderItems->pluck('store.name')->unique()->values()->toArray();
            $order->is_multi_store = $order->orderItems->pluck('store.name')->unique()->count() > 1;
            return $order;
        });

        // Get stores for filter dropdown
        $stores = \App\Models\Store::select('id', 'name')->get();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'stores' => $stores,
            'filters' => $request->only(['status', 'store_id', 'search'])
        ]);
    }


    /**
     * Update order status using OrderStatusService
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:confirmed,processing,shipped,delivered',
            'notes' => 'nullable|string|max:500'
        ]);

        try {
            $order = Order::findOrFail($id);
            
            // Use OrderStatusService for proper validation and history creation
            $this->orderStatusService->updateOrderStatus(
                $order, 
                $request->status, 
                $request->notes,
                Auth::user()->name ?? 'Admin'
            );

            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully',
                'order' => $order->fresh(['statusHistory'])
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available status transitions for an order
     */
    public function getAvailableTransitions($id)
    {
        $order = Order::findOrFail($id);
        $availableTransitions = $this->orderStatusService->getAvailableTransitions($order->status);

        return response()->json([
            'current_status' => $order->status,
            'available_transitions' => $availableTransitions
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
     * Show order details
     */
    public function show($id)
    {
        $order = Order::with([
            'user',
            'orderItems.product',
            'orderItems.store',
            'paymentTransactions',
            'statusHistory'
        ])->findOrFail($id);

        // Structure progress data using both order status and status history
        $progressData = $this->getOrderProgressData($order);

        return Inertia::render('admin/orders/show', [
            'order' => $order,
            'progressData' => $progressData
        ]);
    }

    /**
     * Get structured progress data based on individual item statuses
     */
    private function getOrderProgressData($order)
    {
        // Define progress steps based on item statuses
        $progressSteps = [
            'pending' => [
                'step' => 0,
                'label' => 'Pending',
                'percentage' => 20,
                'description' => 'Items are being prepared'
            ],
            'ready' => [
                'step' => 1,
                'label' => 'Ready',
                'percentage' => 40,
                'description' => 'Items are ready for collection'
            ],
            'collected' => [
                'step' => 2,
                'label' => 'Collected',
                'percentage' => 60,
                'description' => 'Items collected from stores'
            ],
            'packaged' => [
                'step' => 3,
                'label' => 'Packaged',
                'percentage' => 80,
                'description' => 'Items packaged for delivery'
            ],
            'shipped' => [
                'step' => 4,
                'label' => 'Shipped',
                'percentage' => 100,
                'description' => 'Items shipped to customer'
            ],
            'delivered' => [
                'step' => 5,
                'label' => 'Delivered',
                'percentage' => 100,
                'description' => 'Items delivered to customer'
            ]
        ];

        // Calculate progress based on item statuses
        $itemStatuses = $order->orderItems->pluck('status')->toArray();
        $totalItems = count($itemStatuses);
        
        if ($totalItems === 0) {
            return [
                'currentStatus' => 'pending',
                'currentStep' => 0,
                'currentPercentage' => 20,
                'completedSteps' => ['pending' => true, 'ready' => false, 'collected' => false, 'packaged' => false, 'shipped' => false],
                'statusHistory' => collect([]),
                'progressSteps' => $progressSteps,
                'itemStatusCounts' => [],
                'overallProgress' => 'No items found'
            ];
        }

        // Count items by status
        $statusCounts = array_count_values($itemStatuses);
        $itemStatusCounts = [];
        foreach ($progressSteps as $status => $stepData) {
            $itemStatusCounts[$status] = $statusCounts[$status] ?? 0;
        }

        // Determine overall progress based on item statuses
        $statusValues = ['pending' => 0, 'ready' => 1, 'collected' => 2, 'packaged' => 3, 'shipped' => 4, 'delivered' => 5];
        
        // Calculate weighted average of item statuses
        $totalWeight = 0;
        $weightedSum = 0;
        
        foreach ($itemStatuses as $status) {
            $weight = $statusValues[$status] ?? 0;
            $weightedSum += $weight;
            $totalWeight += 1;
        }
        
        $averageStep = $totalWeight > 0 ? $weightedSum / $totalWeight : 0;
        $currentStep = round($averageStep);
        
        // Determine which steps are completed
        $completedSteps = [];
        foreach ($progressSteps as $status => $stepData) {
            $completedSteps[$status] = $stepData['step'] <= $currentStep;
        }

        // Get current status based on most advanced item status
        $currentStatus = 'pending';
        $maxStep = -1;
        foreach ($itemStatuses as $status) {
            $step = $statusValues[$status] ?? 0;
            if ($step > $maxStep) {
                $maxStep = $step;
                $currentStatus = $status;
            }
        }

        $currentStepData = $progressSteps[$currentStatus] ?? $progressSteps['pending'];

        // Get status history for timeline
        $statusHistory = $order->statusHistory->sortBy('created_at')->values();

        return [
            'currentStatus' => $currentStatus,
            'currentStep' => $currentStep,
            'currentPercentage' => $currentStepData['percentage'],
            'completedSteps' => $completedSteps,
            'statusHistory' => $statusHistory,
            'progressSteps' => $progressSteps,
            'itemStatusCounts' => $statusCounts,
            'totalItems' => $totalItems,
            'overallProgress' => $this->getOverallProgressDescription($statusCounts, $totalItems)
        ];
    }

    /**
     * Get overall progress description based on item statuses
     */
    private function getOverallProgressDescription($statusCounts, $totalItems)
    {
        if ($statusCounts['delivered'] ?? 0 === $totalItems) {
            return "All items delivered";
        } elseif ($statusCounts['shipped'] ?? 0 === $totalItems) {
            return "All items shipped";
        } elseif ($statusCounts['packaged'] ?? 0 === $totalItems) {
            return "All items packaged";
        } elseif ($statusCounts['collected'] ?? 0 === $totalItems) {
            return "All items collected";
        } elseif ($statusCounts['ready'] ?? 0 === $totalItems) {
            return "All items ready";
        } elseif ($statusCounts['pending'] ?? 0 === $totalItems) {
            return "All items pending";
        } else {
            // Mixed statuses - show the most advanced status
            $statusOrder = ['delivered' => 5, 'shipped' => 4, 'packaged' => 3, 'collected' => 2, 'ready' => 1, 'pending' => 0];
            $maxStatus = 'pending';
            $maxValue = -1;
            
            foreach ($statusCounts as $status => $count) {
                if ($count > 0 && ($statusOrder[$status] ?? 0) > $maxValue) {
                    $maxValue = $statusOrder[$status];
                    $maxStatus = $status;
                }
            }
            
            $completedCount = 0;
            foreach ($statusCounts as $status => $count) {
                if (($statusOrder[$status] ?? 0) >= $statusOrder[$maxStatus]) {
                    $completedCount += $count;
                }
            }
            
            return "{$completedCount}/{$totalItems} items {$maxStatus}";
        }
    }

    /**
     * Download order items as CSV
     */
    public function downloadCsv($id)
    {
        $order = Order::with(['orderItems.product', 'orderItems.store'])->findOrFail($id);

        $filename = "order_{$order->order_number}_items.csv";
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($order) {
            $file = fopen('php://output', 'w');
            
            // CSV Headers
            fputcsv($file, [
                'Item Name',
                'Store',
                'Status',
                'Quantity',
                'Unit Price',
                'Tax',
                'Total Amount'
            ]);

            // CSV Data
            foreach ($order->orderItems as $item) {
                $tax = $item->total_price * 0.1; // 10% tax
                $status = 'Ready'; // Default status, can be made dynamic later
                
                fputcsv($file, [
                    $item->product->name,
                    $item->store->name,
                    $status,
                    $item->quantity,
                    number_format($item->unit_price, 2),
                    number_format($tax, 2),
                    number_format($item->total_price, 2)
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Update the status of a specific order item
     */
    public function updateItemStatus(Request $request, $orderId, $itemId)
    {
        $request->validate([
            'status' => 'required|in:pending,ready,collected,packaged,shipped,delivered'
        ]);

        $orderItem = OrderItem::where('order_id', $orderId)
            ->where('id', $itemId)
            ->firstOrFail();

        $order = $orderItem->order()->with('paymentTransactions')->first();

        // Validate payment status before allowing item status changes
        $paymentStatus = $this->getOrderPaymentStatus($order);
        if ($paymentStatus === 'failed' || $paymentStatus === 'refunded') {
            \Log::warning("Item status update blocked due to payment status", [
                'order_id' => $orderId,
                'item_id' => $itemId,
                'attempted_status' => $request->status,
                'payment_status' => $paymentStatus,
                'updated_by' => auth()->user()->name ?? 'Admin'
            ]);
            
            return redirect()->back()->with('error', 'Cannot update item status: Payment is ' . $paymentStatus);
        }

        $oldStatus = $orderItem->status;
        $orderItem->update(['status' => $request->status]);

        // Auto-update overall order status based on item statuses
        $this->updateOverallOrderStatus($orderId);

        // Log the status change
        \Log::info("Order item status updated", [
            'order_id' => $orderId,
            'item_id' => $itemId,
            'old_status' => $oldStatus,
            'new_status' => $request->status,
            'updated_by' => auth()->user()->name ?? 'Admin'
        ]);

        // Return back to the same page without full refresh
        return redirect()->back();
    }

    /**
     * Automatically update overall order status based on item statuses
     */
    private function updateOverallOrderStatus($orderId)
    {
        $order = Order::with(['orderItems', 'paymentTransactions'])->findOrFail($orderId);
        $itemStatuses = $order->orderItems->pluck('status')->toArray();
        $totalItems = count($itemStatuses);
        
        if ($totalItems === 0) {
            return;
        }

        // Count items by status
        $statusCounts = array_count_values($itemStatuses);
        
        // Determine overall order status based on item statuses
        $newOrderStatus = $this->determineOrderStatusFromItems($statusCounts, $totalItems);
        
        // Enforce transaction status validation
        if (!$this->validateOrderStatusTransition($order, $newOrderStatus)) {
            \Log::warning("Order status transition blocked due to payment status", [
                'order_id' => $orderId,
                'current_order_status' => $order->status,
                'attempted_status' => $newOrderStatus,
                'payment_status' => $this->getOrderPaymentStatus($order),
                'updated_by' => 'System (Auto)'
            ]);
            return;
        }
        
        // Only update if the status has changed
        if ($order->status !== $newOrderStatus) {
            $oldOrderStatus = $order->status;
            $order->update(['status' => $newOrderStatus]);
            
            \Log::info("Order status auto-updated", [
                'order_id' => $orderId,
                'old_order_status' => $oldOrderStatus,
                'new_order_status' => $newOrderStatus,
                'item_status_counts' => $statusCounts,
                'payment_status' => $this->getOrderPaymentStatus($order),
                'updated_by' => 'System (Auto)'
            ]);
        }
    }

    /**
     * Determine overall order status based on item statuses
     */
    private function determineOrderStatusFromItems($statusCounts, $totalItems)
    {
        // If all items are delivered
        if (($statusCounts['delivered'] ?? 0) === $totalItems) {
            return 'delivered';
        }
        
        // If all items are shipped
        if (($statusCounts['shipped'] ?? 0) === $totalItems) {
            return 'shipped';
        }
        
        // If all items are packaged or beyond
        $packagedAndBeyond = ($statusCounts['packaged'] ?? 0) + ($statusCounts['shipped'] ?? 0) + ($statusCounts['delivered'] ?? 0);
        if ($packagedAndBeyond === $totalItems) {
            return 'shipped';
        }
        
        // If all items are collected or beyond
        $collectedAndBeyond = ($statusCounts['collected'] ?? 0) + ($statusCounts['packaged'] ?? 0) + ($statusCounts['shipped'] ?? 0) + ($statusCounts['delivered'] ?? 0);
        if ($collectedAndBeyond === $totalItems) {
            return 'processing';
        }
        
        // If all items are ready or beyond
        $readyAndBeyond = ($statusCounts['ready'] ?? 0) + ($statusCounts['collected'] ?? 0) + ($statusCounts['packaged'] ?? 0) + ($statusCounts['shipped'] ?? 0) + ($statusCounts['delivered'] ?? 0);
        if ($readyAndBeyond === $totalItems) {
            return 'processing';
        }
        
        // If any items are beyond pending, mark as processing
        $beyondPending = ($statusCounts['ready'] ?? 0) + ($statusCounts['collected'] ?? 0) + ($statusCounts['packaged'] ?? 0) + ($statusCounts['shipped'] ?? 0) + ($statusCounts['delivered'] ?? 0);
        if ($beyondPending > 0) {
            return 'processing';
        }
        
        // All items are pending
        return 'confirmed';
    }

    /**
     * Validate order status transition based on payment status
     */
    private function validateOrderStatusTransition(Order $order, string $newStatus): bool
    {
        $paymentStatus = $this->getOrderPaymentStatus($order);
        
        // Define allowed transitions based on payment status
        $allowedTransitions = [
            'pending_payment' => ['pending_payment', 'payment_failed'],
            'payment_failed' => ['payment_failed', 'pending_payment'],
            'confirmed' => ['confirmed', 'processing', 'shipped', 'delivered'],
            'processing' => ['processing', 'shipped', 'delivered'],
            'shipped' => ['shipped', 'delivered'],
            'delivered' => ['delivered'],
            'refunded' => ['refunded'],
        ];

        // If payment is not completed, only allow limited transitions
        if ($paymentStatus !== 'completed') {
            return in_array($newStatus, $allowedTransitions[$paymentStatus] ?? []);
        }

        // If payment is completed, allow normal progression
        return in_array($newStatus, ['confirmed', 'processing', 'shipped', 'delivered']);
    }

    /**
     * Get the payment status of an order
     */
    private function getOrderPaymentStatus(Order $order): string
    {
        $latestTransaction = $order->paymentTransactions()
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$latestTransaction) {
            return 'pending_payment';
        }

        return $latestTransaction->status;
    }
}