import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Heart, Star, ShoppingCart, Plus, Minus, MapPin, Tag, Share2, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviews: number;
    image: string;
    store: string;
    category: string;
    description: string;
    specifications: Array<{ key: string; value: string }>;
    badges?: Array<{ text: string; color: string }>;
    inStock: boolean;
    stockCount: number;
}

interface Review {
    id: string;
    user: {
        name: string;
        avatar?: string;
    };
    rating: number;
    comment: string;
    date: string;
    helpful: number;
    verified: boolean;
}

interface ProductPageProps {
    product: Product;
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
}

export default function ProductPage({ product, reviews, averageRating, totalReviews }: ProductPageProps) {
    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Mock product images
    const productImages = [
        product.image,
        '🥛', // Additional mock images
        '🍞',
        '🥑'
    ];

    // Initialize theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleWishlist = () => {
        setIsWishlisted(!isWishlisted);
    };

    const handleQuantityChange = (delta: number) => {
        const newQuantity = quantity + delta;
        if (newQuantity >= 1 && newQuantity <= product.stockCount) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = () => {
        console.log('Adding to cart:', { productId: product.id, quantity });
        // Add to cart logic here
    };

    const handleSubmitReview = () => {
        if (reviewRating > 0 && reviewComment.trim()) {
            console.log('Submitting review:', { rating: reviewRating, comment: reviewComment });
            // Submit review logic here
            setShowReviewForm(false);
            setReviewRating(0);
            setReviewComment('');
        }
    };

    const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
        const sizeClasses = {
            sm: 'h-3 w-3',
            md: 'h-4 w-4',
            lg: 'h-5 w-5'
        };

        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`${sizeClasses[size]} ${
                            i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                        }`}
                    />
                ))}
            </div>
        );
    };

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

    return (
        <>
            <Head title={`${product.name} - BarfFoods`} />
            
            <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
                <Navigation />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <Link href="/" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            Home
                        </Link>
                        <span>/</span>
                        <Link href="/products" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            Products
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-white">{product.category}</span>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-white">{product.name}</span>
                    </div>

                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => window.history.back()}
                        className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* Product Images */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="aspect-[4/3] bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                                <div className="text-8xl opacity-80">
                                    {productImages[selectedImage]}
                                </div>
                            </div>

                            {/* Thumbnail Images */}
                            <div className="grid grid-cols-4 gap-2">
                                {productImages.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`aspect-square bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden transition-colors ${
                                            selectedImage === index
                                                ? 'ring-2 ring-green-500 dark:ring-green-400'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <div className="text-2xl opacity-80">
                                            {image}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            {/* Product Name and Rating */}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {product.name}
                                </h1>
                                
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="flex items-center space-x-2">
                                        {renderStars(averageRating, 'lg')}
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {averageRating.toFixed(1)}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            ({totalReviews} reviews)
                                        </span>
                                    </div>
                                </div>

                                {/* Store and Category */}
                                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    <div className="flex items-center space-x-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{product.store}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Tag className="h-4 w-4" />
                                        <span>{product.category}</span>
                                    </div>
                                </div>

                                {/* Badges */}
                                {product.badges && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {product.badges.map((badge, index) => (
                                            <Badge
                                                key={index}
                                                className={getBadgeColor(badge.color)}
                                            >
                                                {badge.text}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        ${product.price.toFixed(2)}
                                    </span>
                                    {product.originalPrice && product.originalPrice !== product.price && (
                                        <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                                            ${product.originalPrice.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Stock Status */}
                                <div className="flex items-center space-x-2">
                                    <span className={`text-sm font-medium ${
                                        product.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                    {product.inStock && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            ({product.stockCount} available)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Quantity and Add to Cart */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Quantity:
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleQuantityChange(-1)}
                                            disabled={quantity <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-12 text-center font-medium text-gray-900 dark:text-white">
                                            {quantity}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleQuantityChange(1)}
                                            disabled={quantity >= product.stockCount}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex space-x-4">
                                    <Button
                                        onClick={handleAddToCart}
                                        disabled={!product.inStock}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Add to Cart
                                    </Button>
                                    
                                    <Button
                                        variant="outline"
                                        onClick={toggleWishlist}
                                        className={`${
                                            isWishlisted
                                                ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    >
                                        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                                    </Button>
                                    
                                    <Button variant="outline">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Details Tabs */}
                    <div className="space-y-8">
                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {product.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Specifications */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Specifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {product.specifications.map((spec, index) => (
                                        <div key={index} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {spec.key}:
                                            </span>
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {spec.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Reviews Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Reviews ({totalReviews})
                                    </CardTitle>
                                    <Button
                                        onClick={() => setShowReviewForm(!showReviewForm)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        Write a Review
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Review Form */}
                                {showReviewForm && (
                                    <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Write Your Review
                                        </h3>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Rating
                                            </Label>
                                            <div className="flex space-x-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setReviewRating(i + 1)}
                                                        className="focus:outline-none"
                                                    >
                                                        <Star
                                                            className={`h-6 w-6 ${
                                                                i < reviewRating
                                                                    ? 'text-yellow-400 fill-current'
                                                                    : 'text-gray-300 dark:text-gray-600'
                                                            }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Your Review
                                            </Label>
                                            <Textarea
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                placeholder="Share your experience with this product..."
                                                className="min-h-[100px]"
                                            />
                                        </div>

                                        <div className="flex space-x-4">
                                            <Button
                                                onClick={handleSubmitReview}
                                                disabled={reviewRating === 0 || !reviewComment.trim()}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                Submit Review
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowReviewForm(false)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Reviews List */}
                                <div className="space-y-6">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                                            <div className="flex items-start space-x-4">
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {review.user.name.charAt(0)}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {review.user.name}
                                                        </span>
                                                        {review.verified && (
                                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                                                                Verified Purchase
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        {renderStars(review.rating, 'sm')}
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {review.date}
                                                        </span>
                                                    </div>
                                                    
                                                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                                                        {review.comment}
                                                    </p>
                                                    
                                                    <div className="flex items-center space-x-4">
                                                        <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                                            <ThumbsUp className="h-4 w-4" />
                                                            <span>Helpful ({review.helpful})</span>
                                                        </button>
                                                        <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                                                            Report
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
}

