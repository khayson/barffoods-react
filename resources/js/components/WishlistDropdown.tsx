import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Heart, X, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

interface WishlistItem {
    id: string;
    product: {
        id: string;
        name: string;
        price: number | string;
        originalPrice?: number | string;
        image: string;
        store: string;
        category: string;
        inStock: boolean;
    };
    added_at: string;
}

interface WishlistDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function WishlistDropdown({ isOpen, onClose, buttonRef }: WishlistDropdownProps) {
    const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, right: 0 });

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
                            <Heart className="h-5 w-5 text-red-500 mr-2" />
                            Wishlist ({wishlistItems.length})
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
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading wishlist...</p>
                        </div>
                    ) : wishlistItems.length === 0 ? (
                        <div className="p-8 text-center">
                            <Heart className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Your wishlist is empty</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Add products to your wishlist to see them here
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {wishlistItems.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                <span className="text-2xl">{item.product.image}</span>
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
                                                {item.product.store} • {item.product.category}
                                            </p>
                                            
                                            <div className="flex items-center space-x-2 mt-2">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    ${Number(item.product.price).toFixed(2)}
                                                </span>
                                                {item.product.originalPrice && item.product.originalPrice !== item.product.price && (
                                                    <span className="text-xs text-gray-500 line-through">
                                                        ${Number(item.product.originalPrice).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {!item.product.inStock && (
                                                <p className="text-xs text-red-500 mt-1">Out of stock</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col space-y-1">
                                            <button
                                                onClick={() => addToCart(item.product.id)}
                                                disabled={!item.product.inStock}
                                                className="p-1.5 text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                title="Add to cart"
                                            >
                                                <ShoppingCart className="h-4 w-4" />
                                            </button>
                                            
                                            <button
                                                onClick={() => removeFromWishlist(item.product.id)}
                                                className="p-1.5 text-red-500 hover:text-red-600"
                                                title="Remove from wishlist"
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

                {wishlistItems.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <Link
                            href="/wishlist"
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors text-center block"
                            onClick={onClose}
                        >
                            View Full Wishlist
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
