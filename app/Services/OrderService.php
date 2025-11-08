<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Exceptions\Order\OrderCreationException;
use App\Exceptions\Order\OrderCancellationException;
use App\Exceptions\Inventory\InsufficientStockException;
use App\Helpers\LogHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected StripeService $stripeService
    ) {}

    /**
     * Create a new order with database transaction
     */
    public function createOrder(array $data, string $idempotencyKey = null): Order
    {
        // Generate idempotency key if not provided
        $idempotencyKey = $idempotencyKey ?? Str::uuid()->toString();

        // Check for duplicate order using idempotency key
        $existingOrder = Order::where('idempotency_key', $idempotencyKey)->first();
        if ($existingOrder) {
            LogHelper::payment('Duplicate order creation prevented', [
                'idempotency_key' => $idempotencyKey,
                'existing_order_id' => $existingOrder->id,
            ], 'warning');
            
            return $existingOrder;
        }

        try {
            return DB::transaction(function () use ($data, $idempotencyKey) {
                // Validate and reserve inventory
                $this->validateInventory($data['items']);

                // Create order
                $order = Order::create([
                    'user_id' => $data['user_id'],
                    'order_number' => $this->generateOrderNumber(),
                    'user_address_id' => $data['user_address_id'],
                    'delivery_slot_id' => $data['delivery_slot_id'] ?? null,
                    'subtotal' => 0,
                    'tax' => 0,
                    'shipping_cost' => 0,
                    'total_amount' => 0,
                    'status' => 'pending_payment',
                    'payment_method' => $data['payment_method'],
                    'notes' => $data['notes'] ?? null,
                    'idempotency_key' => $idempotencyKey,
                ]);

                // Create order items and calculate totals
                $subtotal = 0;
                foreach ($data['items'] as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    
                    // Decrement stock
                    $this->inventoryService->decrementStock(
                        $product->id,
                        $item['quantity']
                    );

                    $itemTotal = $product->price * $item['quantity'];
                    $subtotal += $itemTotal;

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'store_id' => $item['store_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $product->price,
                        'total_price' => $itemTotal,
                        'status' => 'pending',
                    ]);
                }

                // Calculate tax and shipping (simplified)
                $tax = $subtotal * 0.08; // 8% tax
                $shippingCost = $data['shipping_cost'] ?? 0;
                $totalAmount = $subtotal + $tax + $shippingCost;

                // Update order totals
                $order->update([
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'shipping_cost' => $shippingCost,
                    'total_amount' => $totalAmount,
                ]);

                LogHelper::audit('order_created', 'Order', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'total_amount' => $totalAmount,
                ]);

                return $order->fresh(['orderItems', 'user', 'userAddress']);
            });
        } catch (InsufficientStockException $e) {
            throw $e;
        } catch (\Exception $e) {
            LogHelper::exception($e, [
                'context' => 'order_creation',
                'user_id' => $data['user_id'] ?? null,
            ]);

            throw new OrderCreationException(
                'Failed to create order: ' . $e->getMessage(),
                500,
                $e
            );
        }
    }

    /**
     * Cancel an order and restore inventory
     */
    public function cancelOrder(Order $order, string $reason = null): Order
    {
        if (!in_array($order->status, ['pending_payment', 'confirmed', 'processing'])) {
            throw new OrderCancellationException(
                'Order cannot be cancelled in current status: ' . $order->status
            );
        }

        try {
            return DB::transaction(function () use ($order, $reason) {
                // Restore inventory
                foreach ($order->orderItems as $item) {
                    $this->inventoryService->restoreStock(
                        $item->product_id,
                        $item->quantity
                    );
                }

                // Update order status
                $order->update([
                    'status' => 'cancelled',
                    'notes' => $order->notes . "\nCancellation reason: " . ($reason ?? 'User requested'),
                ]);

                // Refund if payment was made
                if ($order->payment_transaction && $order->payment_transaction->status === 'completed') {
                    $this->stripeService->refundPayment(
                        $order->payment_transaction->transaction_id,
                        $order->total_amount
                    );
                }

                LogHelper::audit('order_cancelled', 'Order', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'reason' => $reason,
                ]);

                return $order->fresh();
            });
        } catch (\Exception $e) {
            LogHelper::exception($e, [
                'context' => 'order_cancellation',
                'order_id' => $order->id,
            ]);

            throw new OrderCancellationException(
                'Failed to cancel order: ' . $e->getMessage(),
                500,
                $e
            );
        }
    }

    /**
     * Process a refund for an order
     */
    public function refundOrder(Order $order, float $amount = null): void
    {
        if (!$order->payment_transaction) {
            throw new \InvalidArgumentException('Order has no payment transaction');
        }

        $refundAmount = $amount ?? $order->total_amount;

        try {
            DB::transaction(function () use ($order, $refundAmount) {
                $this->stripeService->refundPayment(
                    $order->payment_transaction->transaction_id,
                    $refundAmount
                );

                $order->update([
                    'status' => 'refunded',
                ]);

                LogHelper::audit('order_refunded', 'Order', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'refund_amount' => $refundAmount,
                ]);
            });
        } catch (\Exception $e) {
            LogHelper::exception($e, [
                'context' => 'order_refund',
                'order_id' => $order->id,
            ]);

            throw $e;
        }
    }

    /**
     * Validate inventory availability for order items
     */
    protected function validateInventory(array $items): void
    {
        foreach ($items as $item) {
            $product = Product::find($item['product_id']);
            
            if (!$product) {
                throw new OrderCreationException("Product {$item['product_id']} not found");
            }

            if (!$product->is_active) {
                throw new OrderCreationException("Product {$product->name} is not available");
            }

            if ($product->stock_quantity < $item['quantity']) {
                throw new InsufficientStockException(
                    "Insufficient stock for product: {$product->name}. Available: {$product->stock_quantity}, Requested: {$item['quantity']}"
                );
            }
        }
    }

    /**
     * Generate a unique order number
     */
    protected function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'ORD-' . strtoupper(Str::random(10));
        } while (Order::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }
}
