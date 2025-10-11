import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HowItWorksBanner from '@/components/HowItWorksBanner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CartItemCard from '@/components/cart/CartItemCard';
import ShopInfoCard from '@/components/cart/ShopInfoCard';
import OrderSummaryCard from '@/components/cart/OrderSummaryCard';
import EmptyCart from '@/components/cart/EmptyCart';

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

interface GroupedStore {
    storeName: string;
    storeId: string;
    items: CartItem[];
    itemCount: number;
    totalQuantity: number;
    totalPrice: number;
}

interface CartPageProps {
    cartItems: CartItem[];
    groupedItems: Record<string, GroupedStore>;
    totalItems: number;
    subtotal: number;
    calculations: {
        subtotal: number;
        discount: number;
        delivery_fee: number;
        tax: number;
        total: number;
        discount_breakdown: any[];
        applied_discounts: any[];
        available_discounts: any[];
    };
    storeCount: number;
    isAuthenticated: boolean;
    isMultiStore: boolean;
}

export default function CartPage({
    cartItems: initialCartItems,
    groupedItems: initialGroupedItems,
    totalItems: initialTotalItems,
    subtotal: initialSubtotal,
    calculations: initialCalculations,
    storeCount: initialStoreCount,
    isAuthenticated,
    isMultiStore: initialIsMultiStore
}: CartPageProps) {
    const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
    const { auth } = usePage().props as unknown as { auth: { user: any } | null };

    // Use cartItems from context if available, otherwise use initial data
    const currentCartItems = cartItems.length > 0 ? cartItems : initialCartItems;
    const calculations = initialCalculations;
    
    // Group items by store dynamically
    const groupedItems = currentCartItems.reduce((groups: Record<string, GroupedStore>, item) => {
        const storeId = item.product.store.id;
        const storeName = item.product.store.name;
        
        if (!groups[storeId]) {
            groups[storeId] = {
                storeName,
                storeId,
                items: [],
                itemCount: 0,
                totalQuantity: 0,
                totalPrice: 0
            };
        }
        
        groups[storeId].items.push(item);
        groups[storeId].itemCount += 1;
        groups[storeId].totalQuantity += item.quantity;
        groups[storeId].totalPrice += item.total_price;
        
        return groups;
    }, {});

    const totalItems = currentCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = currentCartItems.reduce((sum, item) => sum + item.total_price, 0);
    const storeCount = Object.keys(groupedItems).length;
    const isMultiStore = storeCount > 1;

    const handleQuantityChange = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            await removeFromCart(itemId);
        } else {
            await updateQuantity(itemId, newQuantity);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        await removeFromCart(itemId);
    };

    const handleClearCart = async () => {
        // Show confirmation dialog
        if (window.confirm('Are you sure you want to cancel your order? This will remove all items from your cart.')) {
            await clearCart();
            toast.success('Order cancelled', {
                description: 'All items have been removed from your cart.'
            });
            // Redirect to welcome page after clearing cart
            window.location.href = '/';
        }
    };

    const handleCheckout = () => {
        if (!auth?.user) {
            // Redirect to login page with return URL
            window.location.href = `/login?redirect=${encodeURIComponent('/checkout')}`;
            return;
        }
        
        // Navigate to checkout page
        window.location.href = '/checkout';
    };

    return (
        <>
            <Head title="Shopping Cart - BarfFoods">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            
            <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
                {/* How it Works Banner */}
                <HowItWorksBanner />
                
                <Navigation />
                
                {/* Cart Content */}
                <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {currentCartItems.length === 0 ? (
                            <EmptyCart />
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column - Shopping Cart */}
                                <div className="lg:col-span-2">
                                    {/* Header */}
                                    <div className="mb-6">
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            Shopping Cart
                                        </h1>
                                    </div>

                                    {/* Cart Items */}
                                    <div className="space-y-4">
                                        {currentCartItems.map((item) => (
                                            <CartItemCard
                                                key={item.id}
                                                item={item}
                                                onQuantityChange={handleQuantityChange}
                                                onRemoveItem={handleRemoveItem}
                                            />
                                        ))}
                                    </div>

                                    {/* Bottom Actions */}
                                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <Link
                                            href="/"
                                            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Back
                                        </Link>
                                        
                                        <Button
                                            variant="destructive"
                                            onClick={handleClearCart}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel Order
                                        </Button>
                                    </div>
                                </div>

                                {/* Right Column - Sticky Sidebar */}
                                <div className="lg:col-span-1">
                                    <div className="sticky top-8 space-y-4">
                                        {/* Shop Information Card */}
                                        <ShopInfoCard
                                            storeCount={storeCount}
                                            storeNames={Object.values(groupedItems).map(store => store.storeName)}
                                            isMultiStore={isMultiStore}
                                        />

                                        {/* Order Summary Card */}
                                        <OrderSummaryCard
                                            totalItems={totalItems}
                                            totalPrice={subtotal}
                                            calculations={calculations}
                                            isAuthenticated={isAuthenticated}
                                            onCheckout={handleCheckout}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
                
                {/* Footer */}
                <Footer />
            </div>
        </>
    );
}
