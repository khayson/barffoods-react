import React, { useState } from 'react';
import { Heart, Star, ShoppingCart, Check, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface Product {
    id: string;
    name: string;
    price: number | string;
    originalPrice?: number | string;
    rating: number | string;
    reviews: number | string;
    image: string;
    store: string | { name: string };
    category: string | { name: string };
    description: string;
    inStock: boolean;
    stockCount: number;
    colors?: Array<{ name: string; value: string; image: string }>;
}

interface ProductInfoProps {
    product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || 'Black');
    const [quantity, setQuantity] = useState(1);

    // Mock colors (replace with actual product colors)
    const colorOptions = product.colors || [
        { name: 'Black', value: '#000000', image: product.image },
        { name: 'Olive Green', value: '#6B8E23', image: product.image },
        { name: 'Burgundy', value: '#800020', image: product.image },
    ];

    const handleWishlistToggle = () => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
            toast.success('Removed from wishlist');
        } else {
            addToWishlist(product.id);
            toast.success('Added to wishlist');
        }
    };

    const handleAddToCart = () => {
        addToCart(product.id, quantity);
        toast.success(`Added ${quantity} item(s) to cart`);
    };

    const formatPrice = (price: number | string) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return numPrice.toFixed(2);
    };

    const getCategoryName = () => {
        return typeof product.category === 'string' ? product.category : product.category?.name || 'Category';
    };

    const discountPercentage = product.originalPrice 
        ? Math.round(((parseFloat(product.originalPrice.toString()) - parseFloat(product.price.toString())) / parseFloat(product.originalPrice.toString())) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Category Badge */}
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                {getCategoryName()}
            </Badge>

            {/* Product Title and Wishlist */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                        {product.name}
                    </h1>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 font-semibold">{product.rating}</span>
                        </div>
                        <span className="text-gray-600">
                            {typeof product.reviews === 'string' ? product.reviews : `${product.reviews}+ Reviews`}
                        </span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWishlistToggle}
                    className={`flex items-center space-x-2 ${
                        isInWishlist(product.id) 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-gray-500 hover:text-red-500'
                    }`}
                >
                    <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">Add to Wishlist</span>
                </Button>
            </div>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed">
                {product.description}
            </p>

            {/* Pricing */}
            <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-gray-900">
                    ${formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                    <>
                        <span className="text-xl text-gray-500 line-through">
                            ${formatPrice(product.originalPrice)}
                        </span>
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                            {discountPercentage}% off!
                        </Badge>
                    </>
                )}
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Colors</h3>
                    <span className="text-sm text-gray-600">{selectedColor}</span>
                </div>
                <div className="flex space-x-3">
                    {colorOptions.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setSelectedColor(color.name)}
                            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                selectedColor === color.name 
                                    ? 'border-green-500 ring-2 ring-green-200' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl">{color.image}</span>
                            </div>
                            {selectedColor === color.name && (
                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Add to Cart Button */}
            <Button
                onClick={handleAddToCart}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
                disabled={!product.inStock}
            >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
            </Button>

            {/* Stock Status */}
            {!product.inStock && (
                <p className="text-red-600 font-medium">Out of Stock</p>
            )}
            {product.inStock && (
                <p className="text-green-600 font-medium">
                    In Stock ({product.stockCount} available)
                </p>
            )}
        </div>
    );
}
