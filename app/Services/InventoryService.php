<?php

namespace App\Services;

use App\Models\Product;
use App\Exceptions\Inventory\InsufficientStockException;
use App\Exceptions\Inventory\InvalidQuantityException;
use App\Helpers\LogHelper;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Decrement product stock with pessimistic locking
     */
    public function decrementStock(int $productId, int $quantity): Product
    {
        if ($quantity <= 0) {
            throw new InvalidQuantityException('Quantity must be greater than zero');
        }

        return DB::transaction(function () use ($productId, $quantity) {
            // Use pessimistic locking to prevent race conditions
            $product = Product::where('id', $productId)
                ->lockForUpdate()
                ->first();

            if (!$product) {
                throw new \InvalidArgumentException("Product {$productId} not found");
            }

            if ($product->stock_quantity < $quantity) {
                LogHelper::audit('insufficient_stock', 'Product', [
                    'product_id' => $productId,
                    'product_name' => $product->name,
                    'available' => $product->stock_quantity,
                    'requested' => $quantity,
                ]);

                throw new InsufficientStockException(
                    "Insufficient stock for {$product->name}. Available: {$product->stock_quantity}, Requested: {$quantity}"
                );
            }

            $product->decrement('stock_quantity', $quantity);

            LogHelper::audit('stock_decremented', 'Product', [
                'product_id' => $productId,
                'product_name' => $product->name,
                'quantity' => $quantity,
                'remaining_stock' => $product->stock_quantity - $quantity,
            ]);

            return $product->fresh();
        });
    }

    /**
     * Restore product stock (for cancellations/returns)
     */
    public function restoreStock(int $productId, int $quantity): Product
    {
        if ($quantity <= 0) {
            throw new InvalidQuantityException('Quantity must be greater than zero');
        }

        return DB::transaction(function () use ($productId, $quantity) {
            $product = Product::where('id', $productId)
                ->lockForUpdate()
                ->first();

            if (!$product) {
                throw new \InvalidArgumentException("Product {$productId} not found");
            }

            $product->increment('stock_quantity', $quantity);

            LogHelper::audit('stock_restored', 'Product', [
                'product_id' => $productId,
                'product_name' => $product->name,
                'quantity' => $quantity,
                'new_stock' => $product->stock_quantity + $quantity,
            ]);

            return $product->fresh();
        });
    }

    /**
     * Check if sufficient stock is available
     */
    public function checkStock(int $productId, int $quantity): bool
    {
        $product = Product::find($productId);

        if (!$product) {
            return false;
        }

        return $product->stock_quantity >= $quantity;
    }

    /**
     * Get current stock level
     */
    public function getStockLevel(int $productId): int
    {
        $product = Product::find($productId);

        if (!$product) {
            throw new \InvalidArgumentException("Product {$productId} not found");
        }

        return $product->stock_quantity;
    }

    /**
     * Validate stock for multiple products
     */
    public function validateStockForMultipleProducts(array $items): array
    {
        $insufficientStock = [];

        foreach ($items as $item) {
            $productId = $item['product_id'];
            $quantity = $item['quantity'];

            if (!$this->checkStock($productId, $quantity)) {
                $product = Product::find($productId);
                $insufficientStock[] = [
                    'product_id' => $productId,
                    'product_name' => $product->name ?? 'Unknown',
                    'requested' => $quantity,
                    'available' => $product->stock_quantity ?? 0,
                ];
            }
        }

        return $insufficientStock;
    }

    /**
     * Reserve stock for a pending order (optional feature)
     */
    public function reserveStock(int $productId, int $quantity, int $orderId): void
    {
        // This could be implemented with a separate reservations table
        // For now, we'll just decrement the stock
        $this->decrementStock($productId, $quantity);
    }

    /**
     * Release reserved stock (optional feature)
     */
    public function releaseReservedStock(int $productId, int $quantity, int $orderId): void
    {
        // This would release stock from reservations table
        // For now, we'll just restore the stock
        $this->restoreStock($productId, $quantity);
    }
}
