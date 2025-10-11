import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

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

interface WishlistContextType {
    wishlistItems: WishlistItem[];
    wishlistCount: number;
    isLoading: boolean;
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
    children: ReactNode;
    user: any;
}

export function WishlistProvider({ children, user }: WishlistProviderProps) {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const wishlistCount = wishlistItems.length;

    const fetchWishlist = async () => {
        if (!user) {
            setWishlistItems([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/wishlist', {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setWishlistItems(data.wishlist_items || []);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToWishlist = async (productId: string) => {
        if (!user) {
            toast.error('Please log in to add to wishlist', {
                description: 'You need to be logged in to add products to your wishlist.'
            });
            return;
        }

        try {
            const response = await fetch('/api/wishlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    product_id: productId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Added to wishlist', {
                    description: 'Product has been added to your wishlist.'
                });
                await fetchWishlist(); // Refresh the wishlist
            } else {
                toast.error('Failed to add to wishlist', {
                    description: data.message || 'Please try again.'
                });
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            toast.error('Failed to add to wishlist', {
                description: 'Please try again.'
            });
        }
    };

    const removeFromWishlist = async (productId: string) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/wishlist/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Removed from wishlist', {
                    description: 'Product has been removed from your wishlist.'
                });
                await fetchWishlist(); // Refresh the wishlist
            } else {
                toast.error('Failed to remove from wishlist', {
                    description: data.message || 'Please try again.'
                });
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            toast.error('Failed to remove from wishlist', {
                description: 'Please try again.'
            });
        }
    };

    const toggleWishlist = async (productId: string) => {
        if (isInWishlist(productId)) {
            await removeFromWishlist(productId);
        } else {
            await addToWishlist(productId);
        }
    };

    const isInWishlist = (productId: string): boolean => {
        return wishlistItems.some(item => item.product.id === productId);
    };

    const refreshWishlist = async () => {
        await fetchWishlist();
    };

    useEffect(() => {
        fetchWishlist();
    }, [user]);

    const value: WishlistContextType = {
        wishlistItems,
        wishlistCount,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        refreshWishlist,
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
