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

    // Helper function to get API headers (Sanctum token for authenticated users, CSRF for anonymous)
    const getApiHeaders = () => {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        // Add Sanctum token if user is authenticated
        if (user) {
            const token = localStorage.getItem('sanctum_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        } else {
            // Add CSRF token for anonymous users (web routes)
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }
        }

        return headers;
    };

    // Helper function to get the correct API endpoint based on authentication
    const getApiEndpoint = (endpoint: string) => {
        if (user) {
            // Check if we have a Sanctum token
            const token = localStorage.getItem('sanctum_token');
            if (token) {
                return `/api${endpoint}`;
            } else {
                // No token, fall back to anonymous cart
                return `/api${endpoint.replace('/cart', '/cart/anonymous')}`;
            }
        } else {
            return `/api${endpoint.replace('/cart', '/cart/anonymous')}`;
        }
    };

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + item.total_price, 0);

    // Track cartItems state changes

    const fetchCart = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(getApiEndpoint('/cart'), {
                headers: getApiHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                
                // Use functional state update to ensure React detects the change
                setCartItems(prevItems => {
                    const newItems = [...(data.cart_items || [])];
                    return newItems;
                });
            } else if (response.status === 401) {
                // Handle unauthorized - user might not be logged in or token expired
                console.warn('Cart fetch unauthorized, trying anonymous cart');
                // Clear any stored token and try anonymous cart
                localStorage.removeItem('sanctum_token');
                
                // Retry with anonymous cart endpoint
                try {
                    const anonymousResponse = await fetch('/api/cart/anonymous', {
                        headers: getApiHeaders(),
                    });
                    
                    if (anonymousResponse.ok) {
                        const anonymousData = await anonymousResponse.json();
                        setCartItems(prevItems => {
                            const newItems = [...(anonymousData.cart_items || [])];
                            return newItems;
                        });
                        console.log('Anonymous cart fetched successfully:', anonymousData);
                    }
                } catch (anonymousError) {
                    console.error('Failed to fetch anonymous cart:', anonymousError);
                }
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
            const endpoint = getApiEndpoint('/cart');
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    product_id: parseInt(productId), // Convert string to number
                    quantity: quantity,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Added to cart', {
                    description: 'Product has been added to your cart.'
                });
                
                // Refresh cart to get updated data using the same endpoint
                await refreshCartWithEndpoint(getApiEndpoint('/cart'));
                
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
            const response = await fetch(getApiEndpoint(`/cart/${itemId}`), {
                method: 'PUT',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    quantity: quantity,
                }),
            });

            console.log('API response status:', response.status);
            const data = await response.json();
            console.log('API response data:', data);

            if (data.success) {
                await refreshCartWithEndpoint(getApiEndpoint('/cart')); // Refresh the cart
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
            const response = await fetch(getApiEndpoint(`/cart/${itemId}`), {
                method: 'DELETE',
                headers: getApiHeaders(),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Removed from cart', {
                    description: 'Product has been removed from your cart.'
                });
                await refreshCartWithEndpoint(getApiEndpoint('/cart')); // Refresh the cart
                
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
            const response = await fetch(getApiEndpoint('/cart'), {
                method: 'DELETE',
                headers: getApiHeaders(),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Cart cleared', {
                    description: 'All items have been removed from your cart.'
                });
                await refreshCartWithEndpoint(getApiEndpoint('/cart')); // Refresh the cart
                
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

    // Refresh cart with specific endpoint
    const refreshCartWithEndpoint = async (endpoint: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(endpoint, {
                headers: getApiHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                
                // Use functional state update to ensure React detects the change
                setCartItems(prevItems => {
                    const newItems = [...(data.cart_items || [])];
                    return newItems;
                });
            } else if (response.status === 401) {
                // Handle unauthorized - try anonymous cart
                console.warn('Cart refresh unauthorized, trying anonymous cart');
                localStorage.removeItem('sanctum_token');
                
                try {
                    const anonymousResponse = await fetch('/api/cart/anonymous', {
                        headers: getApiHeaders(),
                    });
                    
                    if (anonymousResponse.ok) {
                        const anonymousData = await anonymousResponse.json();
                        setCartItems(prevItems => {
                            const newItems = [...(anonymousData.cart_items || [])];
                            return newItems;
                        });
                    }
                } catch (anonymousError) {
                    console.error('Failed to fetch anonymous cart:', anonymousError);
                }
            } else {
                console.error('Cart refresh failed with status:', response.status);
            }
        } catch (error) {
            console.error('Error refreshing cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Always fetch cart, but handle authentication properly
        fetchCart();
    }, [user]);

    // Separate effect to fetch Sanctum token when user changes
    useEffect(() => {
        if (user) {
            fetchSanctumToken();
        } else {
            // Clear token when user logs out
            localStorage.removeItem('sanctum_token');
        }
    }, [user]);

    // Fetch Sanctum token for API authentication
    const fetchSanctumToken = async (): Promise<void> => {
        try {
            const response = await fetch('/api/sanctum/token', {
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('sanctum_token', data.token);
                }
            }
        } catch (error) {
            console.error('Failed to fetch Sanctum token:', error);
        }
    };

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
