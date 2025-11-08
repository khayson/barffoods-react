import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, useForm } from '@inertiajs/react';
import { Heart, Star, ShoppingCart, ChevronLeft, ChevronRight, Package, Info, Check, Plus, Minus, ThumbsUp, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductSkeleton from '@/components/ProductSkeleton';

interface Product {
    id: string;
    name: string;
    price: number | string;
    original_price?: number | string;
    rating: number | string;
    reviews: number | string;
    image: string;
    store: { 
        id: string; 
        name: string;
        image?: string | null;
        address?: string;
        delivery_fee?: number;
        min_order_amount?: number;
        delivery_radius?: number;
    };
    category: { id: string; name: string };
    description: string;
    specifications: Array<{ key: string; value: string }>;
    badges?: Array<{ text: string; color: string }>;
    inStock: boolean;
    stock_quantity: number;
    images?: string[];
    colors?: Array<{ name: string; value: string; image: string }>;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
}

interface Review {
    id: string;
    user: {
        name: string;
    };
    rating: number;
    comment: string | null;
    date: string;
    helpful: number;
    is_helpful_by_user: boolean;
    verified: boolean;
}

interface ProductPageProps {
    product: Product;
    reviews: Review[];
    relatedProducts: Product[];
    shippingOptions: {
        [key: string]: {
            name: string;
            description: string;
            price: number;
            enabled: boolean;
        };
    };
}

export default function ProductPage({ product, reviews, relatedProducts, shippingOptions }: ProductPageProps) {
    const { props } = usePage<{ auth: { user: any } }>();
    const [isLoading, setIsLoading] = useState(true);
    const [productData, setProductData] = useState(product);
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState(productData.colors?.[0]?.name || '');
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('details');
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState<string | null>(null);
    const [userRating, setUserRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [reviewsState, setReviewsState] = useState(reviews);
    const [showFullDescription, setShowFullDescription] = useState(false);

    // Review form state
    const [reviewData, setReviewData] = useState({
        product_id: productData.id,
        rating: 0,
        comment: '',
    });
    const [reviewProcessing, setReviewProcessing] = useState(false);
    const [reviewErrors, setReviewErrors] = useState<any>({});

    // Edit review form state
    const [editReviewData, setEditReviewData] = useState({
        rating: 0,
        comment: '',
    });
    const [editProcessing, setEditProcessing] = useState(false);
    const [editErrors, setEditErrors] = useState<any>({});

    // Use only real product images from database
    const productImages = productData.images || [productData.image];

    // Use only real product colors from database
    const colorOptions = productData.colors || [];

    // Helper function to check if image is a URL
    const isImageUrl = (image: string) => {
        return image && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/'));
    };

    // Helper function to render product image
    const renderProductImage = (image: string, sizeClasses: string) => {
        const defaultEmoji = '📦';
        
        if (!image) {
            return <span className={sizeClasses}>{defaultEmoji}</span>;
        }

        if (isImageUrl(image)) {
            return (
                <img 
                    src={image} 
                    alt={productData.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to emoji if image fails to load
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        if (target.parentElement) {
                            target.parentElement.innerHTML = `<span class="${sizeClasses}">${defaultEmoji}</span>`;
                        }
                    }}
                />
            );
        }

        // Display as emoji or text
        return <span className={sizeClasses}>{image}</span>;
    };

    useEffect(() => {
        // Simulate loading time
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000); // 2 seconds loading time

        return () => clearTimeout(timer);
    }, []);

    const handleWishlistToggle = () => {
        if (isInWishlist(productData.id)) {
            removeFromWishlist(productData.id);
            toast.success('Removed from wishlist');
        } else {
            // Check if user is authenticated using Inertia's shared auth data
            const isAuthenticated = !!props.auth?.user;

            if (isAuthenticated) {
                addToWishlist(productData.id);
                toast.success('Added to wishlist');
            } else {
                toast.info('Please log in to add items to your wishlist and save your favorites for later!');
            }
        }
    };

    const handleAddToCart = () => {
        addToCart(productData.id, quantity);
        toast.success(`Added ${quantity} item(s) to cart`);
    };

    const nextImage = () => {
        setSelectedImage((prev) => (prev + 1) % productImages.length);
    };

    const prevImage = () => {
        setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length);
    };

    const formatPrice = (price: number | string) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return numPrice.toFixed(2);
    };

    const getCategoryName = () => {
        return productData.category?.name || 'Category';
    };

    const discountPercentage = productData.original_price
        ? Math.round(((parseFloat(productData.original_price.toString()) - parseFloat(productData.price.toString())) / parseFloat(productData.original_price.toString())) * 100)
        : 0;

    // Review functions
    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!props.auth?.user) {
            toast.info('Please log in to submit a review');
            return;
        }
        if (reviewData.rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setReviewProcessing(true);
        setReviewErrors({});

        try {
            const response = await fetch('/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(reviewData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                setShowReviewForm(false);
                setReviewData({ product_id: productData.id, rating: 0, comment: '' });

                // Add the new review to the state
                const newReview = {
                    id: data.review.id.toString(),
                    user: { name: data.review.user.name },
                    rating: data.review.rating,
                    comment: data.review.comment,
                    date: new Date(data.review.created_at).toLocaleDateString(),
                    helpful: 0,
                    is_helpful_by_user: false,
                    verified: true
                };
                
                setReviewsState(prevReviews => {
                    const updatedReviews = [newReview, ...prevReviews];
                    
                    // Calculate new average rating and review count
                    const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
                    const newAverageRating = totalRating / updatedReviews.length;
                    const newReviewCount = updatedReviews.length;
                    
                    // Update the product data
                    setProductData(prevProduct => ({
                        ...prevProduct,
                        rating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal place
                        reviews: newReviewCount
                    }));
                    
                    return updatedReviews;
                });
            } else {
                toast.error(data.message);
                if (data.errors) {
                    setReviewErrors(data.errors);
                }
            }
        } catch (error) {
            toast.error('Failed to submit review. Please try again.');
        } finally {
            setReviewProcessing(false);
        }
    };

    const handleHelpfulClick = (reviewId: string, isCurrentlyHelpful: boolean) => {
        if (!props.auth?.user) {
            toast.info('Please log in to mark reviews as helpful');
            return;
        }

        // Toggle helpful status
        fetch(`/reviews/${reviewId}/helpful`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({
                helpful: !isCurrentlyHelpful
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    toast.success(isCurrentlyHelpful ? 'Removed helpful vote' : 'Marked as helpful');
                    // Update the review in state without refreshing
                    setReviewsState(prevReviews =>
                        prevReviews.map(review =>
                            review.id === reviewId
                                ? {
                                    ...review,
                                    helpful: data.helpful_count,
                                    is_helpful_by_user: data.is_helpful
                                }
                                : review
                        )
                    );
                }
            })
            .catch(() => {
                toast.error('Failed to update helpful status');
            });
    };

    const handleEditReview = (review: Review) => {
        setEditingReview(review.id);
        setEditReviewData({
            rating: review.rating,
            comment: review.comment || ''
        });
    };

    const handleUpdateReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingReview) return;

        setEditProcessing(true);
        setEditErrors({});

        try {
            const response = await fetch(`/reviews/${editingReview}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(editReviewData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                setEditingReview(null);

                // Update the review in state
                setReviewsState(prevReviews =>
                    prevReviews.map(review =>
                        review.id === editingReview
                            ? {
                                ...review,
                                rating: editReviewData.rating,
                                comment: editReviewData.comment
                            }
                            : review
                    )
                );
            } else {
                toast.error(data.message);
                if (data.errors) {
                    setEditErrors(data.errors);
                }
            }
        } catch (error) {
            toast.error('Failed to update review. Please try again.');
        } finally {
            setEditProcessing(false);
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            const response = await fetch(`/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                // Remove the review from state with smooth animation
                setReviewsState(prevReviews => prevReviews.filter(review => review.id !== reviewId));
            } else {
                toast.error(data.message || 'Failed to delete review. Please try again.');
            }
        } catch (error) {
            toast.error('Failed to delete review. Please try again.');
        }
    };

    const isUserReview = (review: Review) => {
        return props.auth?.user && review.user.name === props.auth.user.name;
    };

    return (
        <>
            <Head title={productData.name}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors scroll-smooth scrollbar-hide">
                <Navigation />

                {/* Breadcrumb Navigation */}
                {/* <div className="border-b bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <nav className="flex items-center space-x-2 text-sm text-gray-600">
                            <Link href="/" className="hover:text-green-600 transition-colors">
                                Home
                            </Link>
                            <span>/</span>
                            <Link href="/products" className="hover:text-green-600 transition-colors">
                                Products
                            </Link>
                            <span>/</span>
                            <span className="text-gray-900">{getCategoryName()}</span>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">{productData.name}</span>
                        </nav>
                    </div>
                </div> */}

                {isLoading ? (
                    <ProductSkeleton />
                ) : (
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                            {/* Left Column - Product Images */}
                            <div className="lg:col-span-2">
                                <div className="sticky top-20 space-y-4 lg:space-y-6">
                                {/* Main Image */}
                                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                    <div className="w-full h-full flex items-center justify-center">
                                        {renderProductImage(productImages[selectedImage], 'text-8xl')}
                                    </div>

                                    {/* Navigation Arrows - Only show if multiple images exist */}
                                    {productImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 dark:bg-white/20 dark:hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 dark:bg-white/20 dark:hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Thumbnail Gallery - Only show if multiple images exist */}
                                {productImages.length > 1 && (
                                    <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-thin">
                                        {productImages.map((image, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImage(index)}
                                                className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === index
                                                        ? 'border-green-500'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                                    {renderProductImage(image, 'text-xl sm:text-2xl')}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                </div>
                            </div>

                            {/* Right Column - Product Information */}
                            <div className="lg:col-span-3">
                                <div className="space-y-4 lg:space-y-6">
                                    {/* Top Section */}
                                    <div className="space-y-3 lg:space-y-4">
                                        {/* Category Badge */}
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                                            {getCategoryName()}
                                        </Badge>

                                        {/* Product Title and Wishlist */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-2 flex-1">
                                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                                                    {productData.name}
                                                </h1>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Rating */}
                                                    <div className="flex items-center">
                                                        <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                                                        <span className="ml-1 font-semibold text-sm sm:text-base dark:text-white">{productData.rating}</span>
                                                    </div>
                                                    {/* Reviews */}
                                                    <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                                                        {typeof productData.reviews === 'string' ? productData.reviews : `${productData.reviews}+ Reviews`}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleWishlistToggle}
                                                className={`flex-shrink-0 flex items-center gap-2 ${isInWishlist(productData.id)
                                                        ? 'text-red-500 hover:text-red-600'
                                                        : 'text-gray-500 hover:text-red-500'
                                                    }`}
                                            >
                                                <Heart className={`w-5 h-5 ${isInWishlist(productData.id) ? 'fill-current' : ''}`} />
                                                <span className="hidden lg:inline">Add to Wishlist</span>
                                            </Button>
                                        </div>

                                        {/* Description Preview */}
                                        <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                                            <p className={`${!showFullDescription && productData.description.length > 150 ? 'line-clamp-3' : ''}`}>
                                                {showFullDescription || productData.description.length <= 150
                                                    ? productData.description
                                                    : `${productData.description.substring(0, 150)}...`}
                                            </p>
                                            {productData.description.length > 150 && (
                                                <button
                                                    onClick={() => setShowFullDescription(!showFullDescription)}
                                                    className="text-green-600 dark:text-green-400 hover:underline text-sm font-medium mt-1 inline-flex items-center gap-1"
                                                >
                                                    {showFullDescription ? (
                                                        <>
                                                            Show less
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            Read more
                                                            <ChevronRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Pricing */}
                                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                                            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                                ${formatPrice(productData.price)}
                                            </span>
                                            {productData.original_price && (
                                                <>
                                                    <span className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 line-through">
                                                        ${formatPrice(productData.original_price)}
                                                    </span>
                                                    <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                        {discountPercentage}% off!
                                                    </Badge>
                                                </>
                                            )}
                                        </div>

                                        {/* Color Selection - Only show if colors exist */}
                                        {colorOptions.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium text-gray-900 dark:text-white">Colors</h3>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">{selectedColor}</span>
                                                </div>
                                                <div className="flex gap-2 sm:gap-3 flex-wrap">
                                                    {colorOptions.map((color) => (
                                                        <button
                                                            key={color.name}
                                                            onClick={() => setSelectedColor(color.name)}
                                                            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedColor === color.name
                                                                    ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-900'
                                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                                }`}
                                                        >
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                                                <span className="text-xl sm:text-2xl">{color.image}</span>
                                                            </div>
                                                            {selectedColor === color.name && (
                                                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quantity and Add to Cart */}
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg w-full sm:w-auto bg-white dark:bg-gray-800">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-r-none dark:hover:bg-gray-700"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <span className="px-4 py-2 min-w-[3rem] text-center font-medium flex-1 sm:flex-none dark:text-white">
                                                    {quantity}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setQuantity(quantity + 1)}
                                                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-l-none dark:hover:bg-gray-700"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {/* Add to Cart Button */}
                                            <Button
                                                onClick={handleAddToCart}
                                                className="flex-1 sm:flex-none bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-black font-semibold py-3 px-6 rounded-lg transition-colors h-12"
                                                disabled={!productData.inStock}
                                            >
                                                <ShoppingCart className="w-5 h-5 mr-2" />
                                                Add to Cart
                                            </Button>
                                        </div>

                                        {/* Stock Status */}
                                        {!productData.inStock && (
                                            <p className="text-sm sm:text-base text-red-600 dark:text-red-400 font-medium">Out of Stock</p>
                                        )}
                                        {productData.inStock && (
                                            <p className="text-sm sm:text-base text-green-600 dark:text-green-400 font-medium">
                                                In Stock ({productData.stock_quantity} available)
                                            </p>
                                        )}
                                    </div>

                                    {/* Product Details Tabs */}
                                    <div className="mt-6 lg:mt-8">
                                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                            <TabsList className="grid w-full grid-cols-3 h-auto">
                                            <TabsTrigger value="details">Product Details</TabsTrigger>
                                            <TabsTrigger value="packaging">Packaging</TabsTrigger>
                                            <TabsTrigger value="shipping">Shipping Information</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="details" className="mt-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-4 dark:text-white">Detailed Description</h3>
                                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                        {productData.description}
                                                    </p>
                                                </div>

                                                <div className="space-y-6">
                                                    {productData.specifications && productData.specifications.length > 0 && (
                                                        <div>
                                                            <h4 className="font-semibold mb-3 flex items-center dark:text-white">
                                                                <Info className="w-5 h-5 mr-2" />
                                                                Specifications
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {productData.specifications.map((spec, index) => (
                                                                    <div key={index} className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">{spec.key}:</span>
                                                                        <span className="font-medium dark:text-white">{spec.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="packaging" className="mt-8">
                                            <div className="space-y-6">
                                                <h3 className="text-lg font-semibold dark:text-white">Packaging Information</h3>
                                                
                                                {/* Product Dimensions */}
                                                {productData.weight && (
                                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Product Specifications</h4>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                                                                <span className="ml-2 font-medium dark:text-white">{productData.weight} kg</span>
                                                            </div>
                                                            {productData.length && productData.width && productData.height && (
                                                                <>
                                                                    <div>
                                                                        <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
                                                                        <span className="ml-2 font-medium dark:text-white">{productData.length} × {productData.width} × {productData.height} cm</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Packaging Details */}
                                                <div className="space-y-3">
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Packaging Details</h4>
                                                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                                        <li className="flex items-start">
                                                            <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                                                            <span>Eco-friendly packaging materials</span>
                                                        </li>
                                                        <li className="flex items-start">
                                                            <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                                                            <span>Secure padding to prevent damage</span>
                                                        </li>
                                                        <li className="flex items-start">
                                                            <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                                                            <span>Weather-resistant outer packaging</span>
                                                        </li>
                                                        <li className="flex items-start">
                                                            <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                                                            <span>Clear labeling and handling instructions</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="shipping" className="mt-8">
                                            <div className="space-y-6">
                                                <h3 className="text-lg font-semibold dark:text-white">Shipping Information</h3>
                                                
                                                {/* Store Delivery Info */}
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        {productData.store?.image ? (
                                                            productData.store.image.startsWith('http') || productData.store.image.startsWith('/') ? (
                                                                <img
                                                                    src={productData.store.image}
                                                                    alt={productData.store.name}
                                                                    className="w-12 h-12 rounded-lg object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-2xl">
                                                                    {productData.store.image}
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center">
                                                                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                        )}
                                                        <h4 className="font-medium text-gray-900 dark:text-white">Delivery from {productData.store?.name}</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        {productData.store?.delivery_fee && (
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">Delivery Fee:</span>
                                                                <span className="ml-2 font-medium text-green-600 dark:text-green-400">${productData.store.delivery_fee}</span>
                                                            </div>
                                                        )}
                                                        {productData.store?.min_order_amount && (
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">Minimum Order:</span>
                                                                <span className="ml-2 font-medium dark:text-white">${productData.store.min_order_amount}</span>
                                                            </div>
                                                        )}
                                                        {productData.store?.delivery_radius && (
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">Delivery Radius:</span>
                                                                <span className="ml-2 font-medium dark:text-white">{productData.store.delivery_radius} km</span>
                                                            </div>
                                                        )}
                                                        {productData.store?.address && (
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">Store Location:</span>
                                                                <span className="ml-2 font-medium dark:text-white">{productData.store.address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Shipping Options */}
                                                <div className="space-y-4">
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Shipping Options</h4>
                                                    <div className="space-y-3">
                                                        {Object.entries(shippingOptions).map(([key, option]) => 
                                                            option.enabled && (
                                                                <div key={key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                                                                    <div>
                                                                        <h5 className="font-medium text-gray-900 dark:text-white">{option.name}</h5>
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                                                                    </div>
                                                                    <span className={`font-medium ${option.price === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                                                        {option.price === 0 ? 'Free' : `+$${option.price.toFixed(2)}`}
                                                                    </span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Additional Info */}
                                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Important Notes</h4>
                                                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                                        <li>• Delivery times are estimates and may vary based on location</li>
                                                        <li>• Orders placed after 2 PM will be processed the next business day</li>
                                                        <li>• Free delivery available for orders over $50</li>
                                                        <li>• Contact us for international shipping options</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>

                                    {/* Reviews Section */}
                                    <div className="mt-6 lg:mt-8">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reviews & Rating</h2>
                                            <Button
                                                onClick={() => {
                                                    if (!props.auth?.user) {
                                                        toast.info('Please log in to write a review');
                                                        return;
                                                    }
                                                    setShowReviewForm(!showReviewForm);
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                                            >
                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                <span className="hidden sm:inline">{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
                                                <span className="sm:hidden">{showReviewForm ? 'Cancel' : 'Write Review'}</span>
                                            </Button>
                                        </div>

                                    {reviewsState.length > 0 ? (
                                        <div className="space-y-6">
                                            {reviewsState.map((review) => (
                                                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                                                    {editingReview === review.id ? (
                                                        // Edit Review Form
                                                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                            <h4 className="font-semibold text-gray-900 mb-4">Edit Your Review</h4>
                                                            <form onSubmit={handleUpdateReview} className="space-y-4">
                                                                {/* Rating Stars */}
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                        Rating *
                                                                    </label>
                                                                    <div className="flex items-center space-x-1">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <button
                                                                                key={star}
                                                                                type="button"
                                                                                onClick={() => setEditReviewData(prev => ({ ...prev, rating: star }))}
                                                                                className="focus:outline-none"
                                                                            >
                                                                                <Star
                                                                                    className={`w-5 h-5 transition-colors ${star <= editReviewData.rating
                                                                                            ? 'fill-yellow-400 text-yellow-400'
                                                                                            : 'text-gray-300 hover:text-yellow-400'
                                                                                        }`}
                                                                                />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Comment */}
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                        Your Review
                                                                    </label>
                                                                    <Textarea
                                                                        value={editReviewData.comment}
                                                                        onChange={(e) => setEditReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                                                        placeholder="Share your experience with this product..."
                                                                        rows={3}
                                                                        className="w-full"
                                                                    />
                                                                </div>

                                                                {/* Submit Buttons */}
                                                                <div className="flex items-center space-x-3">
                                                                    <Button
                                                                        type="submit"
                                                                        disabled={editProcessing}
                                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                                    >
                                                                        {editProcessing ? 'Updating...' : 'Update Review'}
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => setEditingReview(null)}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    ) : (
                                                        // Review Display
                                                        <div className="flex items-start space-x-4">
                                                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                                                <span className="text-lg font-medium text-gray-600">
                                                                    {review.user.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div>
                                                                        <h4 className="font-semibold text-gray-900">
                                                                            {review.user.name}
                                                                        </h4>
                                                                        <p className="text-sm text-gray-500">
                                                                            {review.date}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="flex items-center">
                                                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                                            <span className="ml-1 font-semibold">{review.rating}</span>
                                                                        </div>
                                                                        {isUserReview(review) && (
                                                                            <div className="flex items-center space-x-1">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleEditReview(review)}
                                                                                    className="text-gray-500 hover:text-blue-600 p-1"
                                                                                >
                                                                                    <Edit className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleDeleteReview(review.id)}
                                                                                    className="text-gray-500 hover:text-red-600 p-1"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {review.comment && (
                                                                    <p className="text-gray-700 leading-relaxed mb-2">
                                                                        {review.comment}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center justify-between mt-2">
                                                                    {review.helpful > 0 && (
                                                                        <p className="text-sm text-gray-500">
                                                                            {review.helpful} people found this helpful
                                                                        </p>
                                                                    )}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleHelpfulClick(review.id, review.is_helpful_by_user)}
                                                                        className={`flex items-center space-x-1 text-sm ${review.is_helpful_by_user
                                                                                ? 'text-green-600 hover:text-green-700'
                                                                                : 'text-gray-500 hover:text-green-600'
                                                                            }`}
                                                                    >
                                                                        <ThumbsUp className={`w-4 h-4 ${review.is_helpful_by_user ? 'fill-current' : ''}`} />
                                                                        <span>Helpful</span>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Star className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                                Be the first to share your experience with this product. Your review helps other customers make informed decisions.
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => {
                                                        if (!props.auth?.user) {
                                                            toast.info('Please log in to write a review');
                                                            return;
                                                        }
                                                        setShowReviewForm(true);
                                                    }}
                                                >
                                                    Write a Review
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        // Share product functionality
                                                        if (navigator.share) {
                                                            navigator.share({
                                                                title: productData.name,
                                                                text: `Check out this ${productData.name} on BarfFoods`,
                                                                url: window.location.href,
                                                            });
                                                        } else {
                                                            navigator.clipboard.writeText(window.location.href);
                                                            toast.success('Product link copied to clipboard!');
                                                        }
                                                    }}
                                                >
                                                    Share Product
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Review Form */}
                                    {showReviewForm && (
                                        <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                                            <form onSubmit={handleReviewSubmit} className="space-y-4">
                                                {/* Rating Stars */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Rating *
                                                    </label>
                                                    <div className="flex items-center space-x-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                                                                onMouseEnter={() => setHoveredRating(star)}
                                                                onMouseLeave={() => setHoveredRating(0)}
                                                                className="focus:outline-none"
                                                            >
                                                                <Star
                                                                    className={`w-6 h-6 transition-colors ${star <= (hoveredRating || reviewData.rating)
                                                                            ? 'fill-yellow-400 text-yellow-400'
                                                                            : 'text-gray-300 hover:text-yellow-400'
                                                                        }`}
                                                                />
                                                            </button>
                                                        ))}
                                                        <span className="ml-2 text-sm text-gray-600">
                                                            {reviewData.rating > 0 && `${reviewData.rating} star${reviewData.rating > 1 ? 's' : ''}`}
                                                        </span>
                                                    </div>
                                                    {reviewErrors.rating && (
                                                        <p className="text-red-500 text-sm mt-1">{reviewErrors.rating}</p>
                                                    )}
                                                </div>

                                                {/* Comment */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Your Review
                                                    </label>
                                                    <Textarea
                                                        value={reviewData.comment}
                                                        onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                                        placeholder="Share your experience with this product..."
                                                        rows={4}
                                                        className="w-full"
                                                    />
                                                    {reviewErrors.comment && (
                                                        <p className="text-red-500 text-sm mt-1">{reviewErrors.comment}</p>
                                                    )}
                                                </div>

                                                {/* Submit Buttons */}
                                                <div className="flex items-center space-x-3">
                                                    <Button
                                                        type="submit"
                                                        disabled={reviewProcessing}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        {reviewProcessing ? 'Submitting...' : 'Submit Review'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowReviewForm(false);
                                                            setReviewData({ product_id: productData.id, rating: 0, comment: '' });
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                                </div>
                            </div>
                        </div>
                    </main>
                )}

                <Footer />
            </div>
        </>
    );
}