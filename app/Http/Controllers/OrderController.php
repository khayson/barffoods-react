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
            'orderGroup',
            'user',
            'store',
            'userAddress',
            'orderItems.product',
            'paymentTransactions',
            'statusHistory'
        ])->findOrFail($id);

        // Check if user owns this order or is admin
        if ($order->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            abort(403, 'Unauthorized access to this order.');
        }

        // If this order is part of a group, get all orders in the group
        $relatedOrders = collect();
        if ($order->order_group_id) {
            $relatedOrders = Order::with(['store', 'orderItems.product'])
                ->where('order_group_id', $order->order_group_id)
                ->where('id', '!=', $order->id)
                ->get();
        }

        // Determine shipping method based on available fields
        $shippingMethod = 'local_delivery'; // Default to local delivery
        if ($order->carrier && $order->service) {
            $shippingMethod = 'shipping';
        }

        // Calculate totals dynamically
        $subtotal = $order->orderItems->sum('total_price');
        $taxRate = \App\Models\SystemSetting::get('global_tax_rate', 8.5);
        $tax = $subtotal * ($taxRate / 100);
        
        // For multi-store orders, calculate group totals
        $groupSubtotal = $subtotal;
        $groupDeliveryFee = $order->delivery_fee;
        $groupTax = $tax;
        $groupTotal = $order->total_amount;
        
        if ($order->order_group_id) {
            // Calculate totals for entire order group
            $allOrdersInGroup = Order::where('order_group_id', $order->order_group_id)->get();
            $groupSubtotal = $allOrdersInGroup->sum(function($order) {
                return $order->orderItems->sum('total_price');
            });
            $groupDeliveryFee = $order->orderGroup->delivery_fee ?? 0;
            $groupTax = $groupSubtotal * ($taxRate / 100);
            $groupTotal = $order->orderGroup->total_amount ?? $groupSubtotal + $groupDeliveryFee + $groupTax;
        }

        // Format order for frontend
        $formattedOrder = [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'order_group_id' => $order->order_group_id,
            'order_group_number' => $order->orderGroup?->group_number,
            'is_multi_store' => $relatedOrders->isNotEmpty(),
            'status' => $order->status,
            'total_amount' => $order->total_amount,
            'delivery_address' => $order->delivery_address,
            'delivery_fee' => $order->delivery_fee,
            'delivery_time_estimate' => $order->delivery_time_estimate,
            'tracking_code' => $order->tracking_code,
            'label_url' => $order->label_url,
            'carrier' => $order->carrier,
            'service' => $order->service,
            'shipping_cost' => $order->shipping_cost,
                    'shipping_method' => $shippingMethod,
                    'is_ready_for_delivery' => $order->is_ready_for_delivery,
                    'ready_at' => $order->ready_at?->format('M d, Y \a\t g:i A'),
                    'tax' => $tax,
                    'subtotal' => $subtotal,
                    'group_subtotal' => $groupSubtotal,
                    'group_delivery_fee' => $groupDeliveryFee,
                    'group_tax' => $groupTax,
                    'group_total' => $groupTotal,
                    'created_at' => $order->created_at->format('M d, Y \a\t g:i A'),
                    'updated_at' => $order->updated_at->format('M d, Y \a\t g:i A'),
            'store' => [
                'id' => $order->store->id,
                'name' => $order->store->name,
                'address' => $order->store->address,
            ],
            'related_orders' => $relatedOrders->map(function ($relatedOrder) {
                        // Determine shipping method for related order
                        $relatedShippingMethod = 'local_delivery'; // Default to local delivery
                        if ($relatedOrder->carrier && $relatedOrder->service) {
                            $relatedShippingMethod = 'shipping';
                        }
                        
                        return [
                            'id' => $relatedOrder->id,
                            'order_number' => $relatedOrder->order_number,
                            'status' => $relatedOrder->status,
                            'total_amount' => $relatedOrder->total_amount,
                            'is_ready_for_delivery' => $relatedOrder->is_ready_for_delivery,
                            'ready_at' => $relatedOrder->ready_at?->format('M d, Y \a\t g:i A'),
                            'shipping_method' => $relatedShippingMethod,
                            'store' => [
                                'id' => $relatedOrder->store->id,
                                'name' => $relatedOrder->store->name,
                                'address' => $relatedOrder->store->address,
                            ],
                            'items' => $relatedOrder->orderItems->map(function ($item) {
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
                                ];
                            }),
                        ];
            }),
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
            'items' => $order->orderItems->map(function ($item) {
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
                ];
            }),
            'payment' => $order->paymentTransactions->first() ? [
                'id' => $order->paymentTransactions->first()->id,
                'amount' => $order->paymentTransactions->first()->amount,
                'payment_method' => $order->paymentTransactions->first()->payment_method,
                'transaction_id' => $order->paymentTransactions->first()->transaction_id,
                'status' => $order->paymentTransactions->first()->status,
                'created_at' => $order->paymentTransactions->first()->created_at->format('M d, Y \a\t g:i A'),
            ] : null,
            'status_history' => $order->statusHistory->map(function ($history) {
                return [
                    'id' => $history->id,
                    'status' => $history->status,
                    'note' => $history->note,
                    'created_at' => $history->created_at->format('M d, Y \a\t g:i A'),
                ];
            }),
        ];

        return Inertia::render('orders/show', [
            'order' => $formattedOrder,
        ]);
    }
}
