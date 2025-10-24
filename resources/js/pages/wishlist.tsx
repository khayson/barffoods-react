import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import CustomerLayout from '@/layouts/customer-layout';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import ProductCard from '@/components/ProductCard';
import WishlistShareModal from '@/components/WishlistShareModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, Package, Sparkles, Share2, SortAsc } from 'lucide-react';
import { toast } from 'sonner';

export default function Wishlist() {
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'name'>('recent');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Sort wishlist items
    const sortedItems = [...wishlistItems].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return Number(a.product.price) - Number(b.product.price);
            case 'price-high':
                return Number(b.product.price) - Number(a.product.price);
            case 'name':
                return a.product.name.localeCompare(b.product.name);
            case 'recent':
            default:
                return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
        }
    });

    // Add all items to cart
    const handleAddAllToCart = () => {
        wishlistItems.forEach(item => {
            addToCart(item.product.id);
        });
        toast.success(`${wishlistItems.length} items added to cart!`);
    };

    // Clear all items
    const handleClearWishlist = async () => {
        if (confirm('Are you sure you want to remove all items from your wishlist?')) {
            // Remove each item
            for (const item of wishlistItems) {
                await removeFromWishlist(item.product.id);
            }
            toast.success('Wishlist cleared');
        }
    };

    return (
        <CustomerLayout>
            <Head title="My Wishlist" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
                                <Heart className="h-8 w-8 text-white fill-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                                    My Wishlist
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
                                </p>
                            </div>
                        </div>

                        {wishlistItems.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-wrap gap-2"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAddAllToCart}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    <span className="hidden sm:inline">Add All to Cart</span>
                                    <span className="sm:hidden">Add All</span>
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowShareModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                >
                                    <Share2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Share</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleClearWishlist}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Clear All</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </div>

                    {/* Sort Options */}
                    {wishlistItems.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                            <SortAsc className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                            
                            <div className="relative">
                                <button
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    className="px-4 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {sortBy === 'recent' && 'Recently Added'}
                                    {sortBy === 'price-low' && 'Price: Low to High'}
                                    {sortBy === 'price-high' && 'Price: High to Low'}
                                    {sortBy === 'name' && 'Name: A to Z'}
                                </button>

                                {showSortDropdown && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                                        {[
                                            { value: 'recent', label: 'Recently Added' },
                                            { value: 'price-low', label: 'Price: Low to High' },
                                            { value: 'price-high', label: 'Price: High to Low' },
                                            { value: 'name', label: 'Name: A to Z' },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setSortBy(option.value as any);
                                                    setShowSortDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                                    sortBy === option.value
                                                        ? 'text-green-600 dark:text-green-400 font-medium'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Wishlist Items Grid */}
                {wishlistItems.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {sortedItems.map((item, index) => (
                                <motion.div
                                    key={item.product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.05,
                                        layout: { duration: 0.3 }
                                    }}
                                    whileHover={{ y: -4 }}
                                >
                                    <ProductCard
                                        product={{
                                            ...item.product,
                                            rating: 0,
                                            reviews: 0
                                        }}
                                        variant="default"
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    // Empty State
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-16"
                    >
                        <motion.div
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            transition={{
                                repeat: Infinity,
                                repeatType: "reverse",
                                duration: 2,
                                ease: "easeInOut"
                            }}
                            className="mb-6"
                        >
                            <Heart className="h-24 w-24 text-gray-300 dark:text-gray-600 mx-auto" />
                        </motion.div>
                        
                        <motion.h2
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
                        >
                            Your wishlist is empty
                        </motion.h2>
                        
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto"
                        >
                            Start adding products you love to your wishlist and never miss out on your favorites!
                        </motion.p>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl font-medium"
                            >
                                <Package className="h-5 w-5" />
                                Start Shopping
                            </Link>
                        </motion.div>

                        {/* Decorative Elements */}
                        <div className="mt-12 flex items-center justify-center gap-8 text-gray-400 dark:text-gray-600">
                            <Sparkles className="h-6 w-6" />
                            <Heart className="h-6 w-6" />
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Wishlist Share Modal */}
            <WishlistShareModal 
                isOpen={showShareModal} 
                onClose={() => setShowShareModal(false)} 
            />
        </CustomerLayout>
    );
}

