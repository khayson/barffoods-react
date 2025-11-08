import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';

interface CartItem {
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
}

interface CartDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function CartDropdown({ isOpen, onClose, buttonRef }: CartDropdownProps) {
    const { cartItems, totalItems, totalPrice, isLoading, updateQuantity, removeFromCart, clearCart } = useCart();
    const { auth } = usePage().props as unknown as { auth: { user: any } | null };
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, right: 0 });

    // Helper to check if image is a URL
    const isImageUrl = (image: string) => {
        return image && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/'));
    };

    useEffect(() => {
        if (isOpen && buttonRef?.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: buttonRect.bottom + 8,
                right: window.innerWidth - buttonRect.right
            });
        }
    }, [isOpen, buttonRef]);

    useEffect(() => {
        if (isOpen) {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    onClose();
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50" onClick={onClose}>
            <div 
                ref={dropdownRef}
                className="absolute w-80 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[500px] flex flex-col"
                style={{
                    top: `${position.top}px`,
                    right: `${position.right}px`
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <ShoppingCart className="h-5 w-5 text-green-500 mr-2" />
                            Cart ({totalItems})
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading cart...</p>
                        </div>
                    ) : cartItems.length === 0 ? (
                        <div className="p-8 text-center">
                            <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Add products to your cart to see them here
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {cartItems.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                                                {isImageUrl(item.product.image) ? (
                                                    <img
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                            if (fallback) fallback.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div 
                                                    className="w-full h-full flex items-center justify-center text-3xl"
                                                    style={{ display: isImageUrl(item.product.image) ? 'none' : 'flex' }}
                                                >
                                                    {isImageUrl(item.product.image) ? '📦' : item.product.image || '📦'}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/products/${item.product.id}`}
                                                className="block"
                                                onClick={onClose}
                                            >
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 hover:text-green-600 dark:hover:text-green-400">
                                                    {item.product.name}
                                                </h4>
                                            </Link>
                                            
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {item.product.store.name} • {item.product.category.name}
                                            </p>
                                            
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        ${Number(item.product.price).toFixed(2)}
                                                    </span>
                                                    {item.product.originalPrice && item.product.originalPrice !== item.product.price && (
                                                        <span className="text-xs text-gray-500 line-through">
                                                            ${Number(item.product.originalPrice).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    ${item.total_price.toFixed(2)}
                                                </div>
                                            </div>
                                            
                                            {!item.product.inStock && (
                                                <p className="text-xs text-red-500 mt-1">Out of stock</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                
                                                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[20px] text-center">
                                                    {item.quantity}
                                                </span>
                                                
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.product.stockQuantity}
                                                    className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="p-1.5 text-red-500 hover:text-red-600"
                                                title="Remove from cart"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Total:</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                ${totalPrice.toFixed(2)}
                            </span>
                        </div>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={clearCart}
                                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-4 rounded-md transition-colors"
                            >
                                Clear Cart
                            </button>
                            
                            <Link
                                href="/cart"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors text-center"
                                onClick={onClose}
                            >
                                View Cart
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
