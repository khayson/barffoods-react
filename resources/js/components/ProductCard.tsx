import { Heart, Plus, Star, MapPin, Tag } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    rating: number;
    reviews: number;
    image: string;
    store: string;
    category: string;
    badges?: Array<{ text: string; color: string }>;
}

interface ProductCardProps {
    product: Product;
    isWishlisted?: boolean;
    onToggleWishlist?: (productId: string) => void;
    onAddToCart?: (productId: string) => void;
    variant?: 'default' | 'compact' | 'modal';
    className?: string;
}

export default function ProductCard({ 
    product, 
    isWishlisted = false, 
    onToggleWishlist, 
    onAddToCart,
    variant = 'default',
    className = ''
}: ProductCardProps) {
    const getBadgeColor = (color: string) => {
        const colors: { [key: string]: string } = {
            green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            brown: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
            purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
        return colors[color] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    };

    const getVariantClasses = () => {
        switch (variant) {
            case 'compact':
                return {
                    container: 'bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 group relative',
                    image: 'h-32 bg-gray-50 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden mb-2',
                    icon: 'text-3xl opacity-80 group-hover:scale-110 transition-transform duration-300',
                    title: 'text-xs font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1',
                    price: 'text-sm font-bold text-gray-900 dark:text-white',
                    originalPrice: 'text-xs text-gray-500 dark:text-gray-400 line-through',
                    rating: 'text-xs',
                    reviews: 'text-xs text-gray-500 dark:text-gray-400',
                    store: 'text-xs text-gray-600 dark:text-gray-400',
                    category: 'text-xs text-gray-600 dark:text-gray-400',
                    wishlistButton: 'w-6 h-6 rounded-full',
                    wishlistIcon: 'h-3 w-3',
                    addToCartButton: 'w-7 h-7 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-110',
                    addToCartIcon: 'h-3 w-3',
                    badge: 'px-1.5 py-0.5 text-xs font-medium rounded-full'
                };
            case 'modal':
                return {
                    container: 'bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative',
                    image: 'h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden mb-3',
                    icon: 'text-3xl opacity-80 group-hover:scale-110 transition-transform duration-300',
                    title: 'text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2',
                    price: 'text-sm font-semibold text-green-600 dark:text-green-400',
                    originalPrice: 'text-xs text-gray-500 dark:text-gray-400 line-through',
                    rating: 'text-xs',
                    reviews: 'text-xs text-gray-500 dark:text-gray-400',
                    store: 'text-xs text-gray-500 dark:text-gray-400',
                    category: 'text-xs text-gray-500 dark:text-gray-400',
                    wishlistButton: 'w-7 h-7 rounded-full',
                    wishlistIcon: 'h-3 w-3',
                    addToCartButton: 'w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200',
                    addToCartIcon: 'h-4 w-4',
                    badge: 'px-1.5 py-0.5 text-xs rounded-full'
                };
            default:
                return {
                    container: 'bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 group relative',
                    image: 'h-40 sm:h-48 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden mb-3 sm:mb-4',
                    icon: 'text-4xl sm:text-6xl opacity-80 group-hover:scale-110 transition-transform duration-300',
                    title: 'text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight',
                    price: 'text-base sm:text-lg font-bold text-gray-900 dark:text-white',
                    originalPrice: 'text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through',
                    rating: 'text-xs sm:text-sm',
                    reviews: 'text-xs text-gray-500 dark:text-gray-400',
                    store: 'text-xs text-gray-600 dark:text-gray-400',
                    category: 'text-xs text-gray-600 dark:text-gray-400',
                    wishlistButton: 'w-7 h-7 sm:w-8 sm:h-8 rounded-full',
                    wishlistIcon: 'h-3 w-3 sm:h-4 sm:w-4',
                    addToCartButton: 'w-8 h-8 sm:w-10 sm:h-10 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-110',
                    addToCartIcon: 'h-4 w-4 sm:h-5 sm:w-5',
                    badge: 'px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full'
                };
        }
    };

    const classes = getVariantClasses();

    return (
        <div className={`${classes.container} ${className}`}>
            {/* Product Image */}
            <Link href={`/products/${product.id}`} className={`${classes.image} relative block`}>
                <div className={classes.icon}>
                    {product.image}
                </div>
                
                {/* Wishlist Button */}
                {onToggleWishlist && (
                    <button
                        onClick={() => onToggleWishlist(product.id)}
                        className={`absolute top-2 right-2 ${classes.wishlistButton} flex items-center justify-center transition-all duration-200 ${
                            isWishlisted
                                ? 'bg-red-500 text-white'
                                : variant === 'modal' 
                                    ? 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-gray-700'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        <Heart className={`${classes.wishlistIcon} ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                )}
                
                {/* Badges */}
                {product.badges && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.badges.map((badge, index) => (
                            <span
                                key={index}
                                className={`${classes.badge} ${getBadgeColor(badge.color)}`}
                            >
                                {badge.text}
                            </span>
                        ))}
                    </div>
                )}
            </Link>

            {/* Product Info */}
            <div className="space-y-1.5 sm:space-y-2 pb-12">
                {/* Product Name */}
                <Link href={`/products/${product.id}`}>
                    <h3 className={`${classes.title} hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer`}>
                        {product.name}
                    </h3>
                </Link>

                {/* Store and Category */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className={`${classes.store} truncate`}>{product.store}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 flex-shrink-0" />
                        <span className={`${classes.category} truncate`}>{product.category}</span>
                    </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                    <span className={classes.price}>
                        ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && product.originalPrice !== product.price && (
                        <span className={classes.originalPrice}>
                            ${product.originalPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                    <div className="flex items-center">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                        <span className={`${classes.rating} font-medium text-gray-700 dark:text-gray-300 ml-1`}>
                            {product.rating}
                        </span>
                    </div>
                    <span className={classes.reviews}>
                        ({product.reviews})
                    </span>
                </div>
            </div>

            {/* Add to Cart Button */}
            {onAddToCart && (
                <button 
                    onClick={() => onAddToCart(product.id)}
                    className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 ${classes.addToCartButton}`}
                >
                    <Plus className={classes.addToCartIcon} />
                </button>
            )}
        </div>
    );
}
