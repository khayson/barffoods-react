import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartItemCardProps {
    item: {
        id: string;
        product: {
            id: string;
            name: string;
            price: number | string;
            originalPrice?: number | string;
            image: string;
            store: {
                id: string;
                name: string;
            };
            category: {
                id: string;
                name: string;
            };
            inStock: boolean;
            stockQuantity: number;
        };
        quantity: number;
        total_price: number;
        added_at: string;
    };
    onQuantityChange: (itemId: string, newQuantity: number) => void;
    onRemoveItem: (itemId: string) => void;
}

export default function CartItemCard({ item, onQuantityChange, onRemoveItem }: CartItemCardProps) {
    const hasDiscount = item.product.originalPrice && 
        parseFloat(item.product.originalPrice.toString()) > parseFloat(item.product.price.toString());
    
    const discountPercentage = hasDiscount ? 
        Math.round(((parseFloat(item.product.originalPrice!.toString()) - parseFloat(item.product.price.toString())) / 
        parseFloat(item.product.originalPrice!.toString())) * 100) : 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-4">
            <div className="flex items-center gap-4">
                {/* Product Image */}
                <div className="relative flex-shrink-0">
                    {item.product.image && item.product.image.startsWith('http') ? (
                        <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg bg-gray-50 dark:bg-gray-700"
                        />
                    ) : (
                        <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-2xl">
                            {item.product.image || '📦'}
                        </div>
                    )}
                    {hasDiscount && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                            -{discountPercentage}%
                        </div>
                    )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                        {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Store: {item.product.store.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Category: {item.product.category.name}
                    </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 p-0"
                    >
                        <Minus className="w-3 h-3" />
                    </Button>
                    
                    <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            if (newQuantity >= 1 && newQuantity <= item.product.stockQuantity) {
                                onQuantityChange(item.id, newQuantity);
                            }
                        }}
                        className="w-12 h-8 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        min="1"
                        max={item.product.stockQuantity}
                    />
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stockQuantity}
                        className="w-8 h-8 p-0"
                    >
                        <Plus className="w-3 h-3" />
                    </Button>
                </div>

                {/* Price */}
                <div className="text-right min-w-[80px]">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        ${parseFloat(item.product.price.toString()).toFixed(2)}
                    </div>
                    {hasDiscount && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                            ${parseFloat(item.product.originalPrice!.toString()).toFixed(2)}
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="w-8 h-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
