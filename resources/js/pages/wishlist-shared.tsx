import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import CustomerLayout from '@/layouts/customer-layout';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, User, Sparkles, ArrowLeft, Lock, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { type SharedData } from '@/types';

interface WishlistItem {
    id: string;
    product: {
        id: string;
        name: string;
        price: number | string;
        image: string;
        store: string;
        category: string;
        inStock: boolean;
    };
    added_at: string;
}

interface SharedWishlistProps {
    owner: {
        name: string;
        avatar: string | null;
    };
    wishlistItems: WishlistItem[];
    itemCount: number;
}

export default function SharedWishlist({ owner, wishlistItems, itemCount }: SharedWishlistProps) {
    const { addToCart } = useCart();
    const { addToWishlist, isInWishlist } = useWishlist();
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'name'>('recent');
    const [showSortDropdown, setShowSortDropdown] = useState(false);

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

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Copy share link
    const handleShareLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    return (
        <CustomerLayout>
            <Head title={`${owner.name}'s Wishlist`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    {/* Back Button */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>

                    {/* Owner Info & Title */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            {/* Owner Avatar */}
                            <div className="relative">
                                {owner.avatar ? (
                                    <img
                                        src={owner.avatar}
                                        alt={owner.name}
                                        className="h-16 w-16 rounded-full object-cover border-4 border-pink-200 dark:border-pink-800"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-xl border-4 border-pink-200 dark:border-pink-800">
                                        {getInitials(owner.name)}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-pink-500 rounded-full flex items-center justify-center">
                                    <Heart className="h-3 w-3 text-white fill-white" />
                                </div>
                            </div>

                            {/* Owner Name & Stats */}
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    {owner.name}'s Wishlist
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-pink-500" />
                                    {itemCount} {itemCount === 1 ? 'item' : 'items'} saved
                                </p>
                            </div>
                        </div>

                        {/* Share Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleShareLink}
                            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
                        >
                            <Share2 className="h-4 w-4" />
                            Share This Wishlist
                        </motion.button>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-4 flex items-start gap-3">
                        <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-pink-900 dark:text-pink-100">
                                <span className="font-semibold">{owner.name}</span> has shared their wishlist with you! 
                                {auth.user ? (
                                    <span> You can add these items to your cart or save them to your own wishlist.</span>
                                ) : (
                                    <span> Sign in to add items to your cart or wishlist.</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Sort Options */}
                    {wishlistItems.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-6 flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
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
                                                        ? 'text-pink-600 dark:text-pink-400 font-medium'
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
                        
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            This wishlist is empty
                        </h2>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            {owner.name} hasn't added any items to their wishlist yet.
                        </p>
                    </motion.div>
                )}
            </div>
        </CustomerLayout>
    );
}

