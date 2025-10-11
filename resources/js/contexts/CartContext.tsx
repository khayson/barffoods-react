import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import MultiStoreWarningModal from '@/components/MultiStoreWarningModal';

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

interface CartContextType {
    cartItems: CartItem[];
    totalItems: number;
    totalPrice: number;
    isLoading: boolean;
    addToCart: (productId: string, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
    user: any;
}

export function CartProvider({ children, user }: CartProviderProps) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasShownTwoStoreAlert, setHasShownTwoStoreAlert] = useState(false);
    const [hasShownThreeStoreAlert, setHasShownThreeStoreAlert] = useState(false);
    const [showMultiStoreDialog, setShowMultiStoreDialog] = useState(false);
    const [multiStoreData, setMultiStoreData] = useState<{ storeNames: string[]; storeList: string } | null>(null);

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + item.total_price, 0);

    // Track cartItems state changes

    const fetchCart = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/cart', {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                
                // Use functional state update to ensure React detects the change
                setCartItems(prevItems => {
                    const newItems = [...(data.cart_items || [])];
                    return newItems;
                });
            } else {
                console.error('fetchCart failed with status:', response.status);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = async (productId: string, quantity: number = 1) => {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Added to cart', {
                    description: 'Product has been added to your cart.'
                });
                
                // Refresh cart to get updated data
                await fetchCart();
                
                // Check for multi-store alert after cart is updated
                setTimeout(() => {
                    checkMultiStoreAlert();
                }, 100);
            } else {
                toast.error('Failed to add to cart', {
                    description: data.message || 'Please try again.'
                });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add to cart', {
                description: 'Please try again.'
            });
        }
    };

    const checkMultiStoreAlert = () => {
        if (cartItems.length < 2) return;

        // Get unique stores from cart items
        const uniqueStores = new Set(cartItems.map(item => item.product.store.name));
        
        console.log('Checking multi-store alert:', {
            cartItemsLength: cartItems.length,
            uniqueStoresSize: uniqueStores.size,
            hasShownTwoStoreAlert,
            hasShownThreeStoreAlert,
            storeNames: Array.from(uniqueStores)
        });
        
        if (uniqueStores.size === 2 && !hasShownTwoStoreAlert) {
            // Two different stores - show toast
            const storeNames = Array.from(uniqueStores);
            setHasShownTwoStoreAlert(true);
            toast.warning('Multi-Store Order', {
                description: `Items from ${storeNames[0]} and ${storeNames[1]} will be delivered separately.`
            });
        } else if (uniqueStores.size > 2 && !hasShownThreeStoreAlert) {
            // More than two stores - show dialog
            const storeNames = Array.from(uniqueStores);
            const storeList = storeNames.slice(0, -1).join(', ') + ' and ' + storeNames[storeNames.length - 1];
            setHasShownThreeStoreAlert(true);
            setMultiStoreData({ storeNames, storeList });
            setShowMultiStoreDialog(true);
        }
    };

    const handleMultiStoreConfirm = () => {
        setShowMultiStoreDialog(false);
        setMultiStoreData(null);
        
        // Continue shopping - just dismiss the warning
        toast.info('Continue shopping', {
            description: 'You can continue adding items. Remember that items from different stores will be delivered separately.'
        });
    };

    const handleMultiStoreModifyCart = () => {
        setShowMultiStoreDialog(false);
        setMultiStoreData(null);
        
        // Navigate to cart page where users can modify
        window.location.href = '/cart';
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        console.log('updateQuantity called:', { itemId, quantity });
        
        if (quantity < 1) {
            await removeFromCart(itemId);
            return;
        }

        try {
            console.log('Making API call to update quantity:', `/api/cart/${itemId}`);
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    quantity: quantity,
                }),
            });

            console.log('API response status:', response.status);
            const data = await response.json();
            console.log('API response data:', data);

            if (data.success) {
                await fetchCart(); // Refresh the cart
            } else {
                toast.error('Failed to update quantity', {
                    description: data.message || 'Please try again.'
                });
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            toast.error('Failed to update quantity', {
                description: 'Please try again.'
            });
        }
    };

    const removeFromCart = async (itemId: string) => {
        try {
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Removed from cart', {
                    description: 'Product has been removed from your cart.'
                });
                await fetchCart(); // Refresh the cart
                
                // Reset alert flags when items are removed
                setHasShownTwoStoreAlert(false);
                setHasShownThreeStoreAlert(false);
            } else {
                toast.error('Failed to remove from cart', {
                    description: data.message || 'Please try again.'
                });
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            toast.error('Failed to remove from cart', {
                description: 'Please try again.'
            });
        }
    };

    const clearCart = async () => {
        try {
            const response = await fetch('/api/cart', {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Cart cleared', {
                    description: 'All items have been removed from your cart.'
                });
                await fetchCart(); // Refresh the cart
                
                // Reset alert flags when cart is cleared
                setHasShownTwoStoreAlert(false);
                setHasShownThreeStoreAlert(false);
            } else {
                toast.error('Failed to clear cart', {
                    description: data.message || 'Please try again.'
                });
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            toast.error('Failed to clear cart', {
                description: 'Please try again.'
            });
        }
    };

    const refreshCart = async () => {
        await fetchCart();
    };

    useEffect(() => {
        fetchCart();
    }, [user]);

    const value: CartContextType = {
        cartItems,
        totalItems,
        totalPrice,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
            
            {/* Multi-Store Warning Modal */}
            <MultiStoreWarningModal
                isOpen={showMultiStoreDialog}
                onClose={() => setShowMultiStoreDialog(false)}
                onConfirm={handleMultiStoreConfirm}
                onModifyCart={handleMultiStoreModifyCart}
                storeNames={multiStoreData?.storeNames || []}
            />
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
