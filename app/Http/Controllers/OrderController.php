<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Display the specified order
     */
    public function show($id)
    {
        $order = Order::with([
            'user',
            'userAddress',
            'orderItems.product',
            'orderItems.store', // Store is now on order items
            'paymentTransactions',
            'statusHistory'
        ])->findOrFail($id);

        // Check if user owns this order or is admin
        if ($order->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            abort(403, 'Unauthorized access to this order.');
        }

        // Group items by store for multi-store orders
        $itemsByStore = $order->orderItems->groupBy('store_id');
        $isMultiStore = $itemsByStore->count() > 1;

        // Ensure we have items to work with
        if ($itemsByStore->isEmpty()) {
            $itemsByStore = collect();
        }

        // Debug logging
        \Log::info('OrderController debug', [
            'order_id' => $order->id,
            'items_count' => $order->orderItems->count(),
            'stores_count' => $itemsByStore->count(),
            'is_multi_store' => $isMultiStore,
            'items_by_store_type' => get_class($itemsByStore),
        ]);

        // Format order for frontend
        $formattedOrder = [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'is_multi_store' => $isMultiStore,
            'status' => $order->status,
            'total_amount' => $order->total_amount,
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'delivery_fee' => $order->delivery_fee,
            'delivery_address' => $order->delivery_address,
            'shipping_method' => $order->shipping_method,
            'tracking_code' => $order->tracking_code,
            'label_url' => $order->label_url,
            'carrier' => $order->carrier,
            'service' => $order->service,
            'shipping_cost' => $order->shipping_cost,
            'is_ready_for_delivery' => $order->is_ready_for_delivery,
            'ready_at' => $order->ready_at ? \Carbon\Carbon::parse($order->ready_at)->format('M d, Y \a\t g:i A') : null,
            'created_at' => \Carbon\Carbon::parse($order->created_at)->format('M d, Y \a\t g:i A'),
            'updated_at' => \Carbon\Carbon::parse($order->updated_at)->format('M d, Y \a\t g:i A'),
            'user_address' => $order->userAddress ? [
                'id' => $order->userAddress->id,
                'type' => $order->userAddress->type,
                'label' => $order->userAddress->label,
                'street_address' => $order->userAddress->street_address,
                'city' => $order->userAddress->city,
                'state' => $order->userAddress->state,
                'zip_code' => $order->userAddress->zip_code,
                'delivery_instructions' => $order->userAddress->delivery_instructions,
            ] : null,
            'items_by_store' => $itemsByStore->isEmpty() ? [] : $itemsByStore->map(function ($items, $storeId) {
                if ($items->isEmpty()) {
                    return null;
                }
                $store = $items->first()->store;
                return [
                    'store' => [
                        'id' => $store->id,
                        'name' => $store->name,
                        'address' => $store->address,
                    ],
                    'items' => $items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product' => [
                                'id' => $item->product->id,
                                'name' => $item->product->name,
                                'image' => $item->product->image,
                                'price' => $item->product->price,
                            ],
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'total_price' => $item->total_price,
                            'status' => $item->status,
                        ];
                    })->toArray(),
                    'store_subtotal' => $items->sum('total_price'),
                ];
            })->filter()->values()->toArray(),
            'payment' => $order->paymentTransactions->first() ? [
                'id' => $order->paymentTransactions->first()->id,
                'amount' => $order->paymentTransactions->first()->amount,
                'payment_method' => $order->paymentTransactions->first()->payment_method,
                'transaction_id' => $order->paymentTransactions->first()->transaction_id,
                'status' => $order->paymentTransactions->first()->status,
                'created_at' => \Carbon\Carbon::parse($order->paymentTransactions->first()->created_at)->format('M d, Y \a\t g:i A'),
            ] : null,
            'status_history' => $order->statusHistory->map(function ($history) {
                return [
                    'id' => $history->id,
                    'status' => $history->status,
                    'note' => $history->note,
                    'created_at' => \Carbon\Carbon::parse($history->created_at)->format('M d, Y \a\t g:i A'),
                ];
            }),
        ];

        // Structure progress data using both order status and status history
        $progressData = $this->getOrderProgressData($order);

        return Inertia::render('orders/show', [
            'order' => $formattedOrder,
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
}
