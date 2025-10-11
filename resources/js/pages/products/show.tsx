import { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { 
    Heart, Star, ShoppingCart, Plus, Minus, MapPin, Tag, Share2, ArrowLeft, 
    ThumbsUp, ThumbsDown, Truck, Shield, RotateCcw, CreditCard,
    CheckCircle, XCircle, Store, Clock, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

interface Product {
    id: string;
    name: string;
    price: number | string;
    originalPrice?: number | string;
    rating: number | string;
    reviews: number | string;
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
    is_helpful_by_user: boolean;
    verified: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    is_active: boolean;
    avatar?: string;
}

interface PageProps {
    auth: {
        user: User | null;
    };
    [key: string]: any;
}

interface ProductPageProps {
    product: Product;
    reviews: Review[];
    averageRating: number | string;
    totalReviews: number | string;
}

export default function ProductPage({ product, reviews: initialReviews, averageRating, totalReviews }: ProductPageProps) {
    const { props } = usePage<PageProps>();
    const user = props.auth.user;
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { addToCart, cartItems } = useCart();
    
    const isWishlisted = isInWishlist(product.id);
    const cartItem = cartItems.find(item => item.product.id === product.id);
    const cartQuantity = cartItem?.quantity || 0;
    
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState('description');
    const [showMobilePurchase, setShowMobilePurchase] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);

    // Product images - only the main product image
    const productImages = [product.image];

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

    const handleQuantityChange = (delta: number) => {
        const newQuantity = quantity + delta;
        if (newQuantity >= 1 && newQuantity <= product.stockCount) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = () => {
        addToCart(product.id, quantity);
    };

    const handleSubmitReview = async () => {
        if (!user) {
            toast.error('Please log in to submit a review', {
                description: 'You need to be logged in to write reviews.'
            });
            return;
        }

        
        if (reviewRating > 0 && reviewComment.trim()) {
            setIsSubmittingReview(true);
            try {
                const requestData = {
                    product_id: product.id,
                    rating: reviewRating,
                    comment: reviewComment.trim(),
                };
                
                const response = await fetch('/reviews', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    toast.success('Review submitted successfully!', {
                        description: 'Your review has been posted.'
                    });
                    // Refresh the page to show the new review
                    router.reload();
                    setShowReviewForm(false);
                    setReviewRating(0);
                    setReviewComment('');
                } else {
                    // Handle validation errors or other errors
                    const errorMessage = data.message || 'Please try again.';
                    
                    // Check if it's a duplicate review error
                    if (errorMessage.includes('already reviewed')) {
                        toast.warning('Review already exists', {
                            description: 'You have already reviewed this product. You can edit your existing review.'
                        });
                        setShowReviewForm(false);
                    } else {
                        toast.error('Failed to submit review', {
                            description: errorMessage
                        });
                    }
                }
            } catch (err) {
                console.error('Error submitting review:', err);
                toast.error('Failed to submit review', {
                    description: 'Please check your connection and try again.'
                });
            } finally {
                setIsSubmittingReview(false);
            }
        }
    };

    const handleToggleHelpful = async (reviewId: string) => {
        if (!user) {
            // Redirect to login
            window.location.href = '/login';
            return;
        }
        
        try {
            // Find the current review to get the current helpful state
            const currentReview = reviews.find(review => review.id === reviewId);
            if (!currentReview) return;

            const newHelpfulState = !currentReview.is_helpful_by_user;

            const response = await fetch(`/reviews/${reviewId}/helpful`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    helpful: newHelpfulState,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Update the local reviews state
                setReviews(prevReviews => 
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
                   } else {
                       toast.error('Failed to update helpful count', {
                           description: data.message || 'Please try again.'
                       });
                   }
               } catch (err) {
                   console.error('Error toggling helpful:', err);
                   toast.error('Failed to update helpful count', {
                       description: 'Please check your connection and try again.'
                   });
               }
    };

    const handleReportReview = (reviewId: string) => {
        if (!user) {
            // Redirect to login
            window.location.href = '/login';
            return;
        }
        
        setReportingReviewId(reviewId);
        setShowReportModal(true);
    };

    const handleSubmitReport = async () => {
        if (!reportingReviewId || !reportReason) return;

        try {
            const response = await fetch(`/reviews/${reportingReviewId}/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    reason: reportReason,
                    description: reportDescription,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                toast.success('Review reported successfully', {
                    description: 'Thank you for your feedback.'
                });
                setShowReportModal(false);
                setReportReason('');
                setReportDescription('');
                setReportingReviewId(null);
            } else {
                toast.error('Failed to report review', {
                    description: data.message || 'Please try again.'
                });
            }
        } catch (err) {
            console.error('Error reporting review:', err);
            toast.error('Failed to report review', {
                description: 'Please check your connection and try again.'
            });
        }
    };

    const handleWriteReview = () => {
        if (!user) {
            toast.error('Please log in to write a review', {
                description: 'You need to be logged in to write reviews.'
            });
            return;
        }
        
        setShowReviewForm(true);
    };

    const renderStars = (rating: number | string, size: 'sm' | 'md' | 'lg' = 'md') => {
        const sizeClasses = {
            sm: 'h-3 w-3',
            md: 'h-4 w-4',
            lg: 'h-5 w-5'
        };
        const numericRating = Number(rating);

        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`${sizeClasses[size]} ${
                            i < Math.floor(numericRating) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
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

    const tabs = [
        { id: 'description', label: 'Description' },
        { id: 'specifications', label: 'Specifications' },
        { id: 'reviews', label: `Reviews (${totalReviews})` },
    ];

    return (
        <>
            <Head title={`${product.name} - BarfFoods`} />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
                <Navigation />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Breadcrumb */}
                    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
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
                    </nav>

                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => window.history.back()}
                        className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Product Images - Left Column */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6 space-y-4">
                                {/* Main Image */}
                                <div className="aspect-square bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                    {productImages[selectedImage] && productImages[selectedImage].startsWith('http') ? (
                                        <img
                                            src={productImages[selectedImage]}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-9xl opacity-80">
                                            {productImages[selectedImage] || '📦'}
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail Images */}
                                <div className="grid grid-cols-4 gap-3">
                                    {productImages.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`aspect-square bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200 border-2 ${
                                                selectedImage === index
                                                    ? 'border-green-500 shadow-md scale-105'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            {image && image.startsWith('http') ? (
                                                <img
                                                    src={image}
                                                    alt={`${product.name} ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-2xl opacity-80">
                                                    {image || '📦'}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Product Info - Center Column */}
                        <div className="lg:col-span-1">
                            <div className="space-y-6">
                                {/* Product Name and Rating */}
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                                        {product.name}
                                    </h1>
                                    
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="flex items-center space-x-2">
                                            {renderStars(averageRating, 'lg')}
                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {Number(averageRating).toFixed(1)}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                ({totalReviews} reviews)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Store and Category */}
                                    <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        <div className="flex items-center space-x-2">
                                            <Store className="h-4 w-4" />
                                            <span className="font-medium">{product.store}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Tag className="h-4 w-4" />
                                            <span>{product.category}</span>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    {product.badges && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {product.badges.map((badge, index) => (
                                                <Badge
                                                    key={index}
                                                    className={`${getBadgeColor(badge.color)} px-3 py-1 text-xs font-medium`}
                                                >
                                                    {badge.text}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                            ${Number(product.price).toFixed(2)}
                                        </span>
                                        {product.originalPrice && product.originalPrice !== product.price && (
                                            <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                                                ${Number(product.originalPrice).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Stock Status */}
                                    <div className="flex items-center space-x-2 mb-4">
                                        <div className={`w-2 h-2 rounded-full ${
                                            product.inStock ? 'bg-green-500' : 'bg-red-500'
                                        }`}></div>
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

                                    {/* Quantity and Add to Cart */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Quantity:
                                            </Label>
                                            <div className="flex items-center space-x-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleQuantityChange(-1)}
                                                    disabled={quantity <= 1}
                                                    className="h-8 w-8 p-0"
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
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            <Button
                                                onClick={handleAddToCart}
                                                disabled={!product.inStock}
                                                className={`h-12 font-medium text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
                                                    cartQuantity > 0 
                                                        ? 'bg-green-700 hover:bg-green-800' 
                                                        : 'bg-green-600 hover:bg-green-700'
                                                } text-white`}
                                            >
                                                <ShoppingCart className="h-5 w-5 mr-2" />
                                                {cartQuantity > 0 ? `In Cart (${cartQuantity})` : 'Add to Cart'}
                                            </Button>
                                            
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => toggleWishlist(product.id)}
                                                    className={`flex-1 h-10 ${
                                                        isWishlisted
                                                            ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                >
                                                    <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
                                                    {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                                                </Button>
                                                
                                                <Button variant="outline" className="h-10 px-3">
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Trust Signals */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Secure Payment</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">100% Protected</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Purchase Section */}
                        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-50">
                            <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            ${Number(product.price).toFixed(2)}
                                        </span>
                                        {product.originalPrice && product.originalPrice !== product.price && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                                ${Number(product.originalPrice).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            product.inStock ? 'bg-green-500' : 'bg-red-500'
                                        }`}></div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!product.inStock}
                                    className={`px-6 ${
                                        cartQuantity > 0 
                                            ? 'bg-green-700 hover:bg-green-800' 
                                            : 'bg-green-600 hover:bg-green-700'
                                    } text-white`}
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    {cartQuantity > 0 ? `In Cart (${cartQuantity})` : 'Add to Cart'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Product Details Tabs */}
                    <div className="space-y-8">
                        {/* Tab Navigation */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="flex space-x-8">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-green-500 text-green-600 dark:text-green-400'
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[400px]">
                            {activeTab === 'description' && (
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-8">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                            Product Description
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                                            {product.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === 'specifications' && (
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-8">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                            Product Specifications
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {product.specifications.map((spec, index) => (
                                                <div key={index} className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
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
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-8">
                                    {/* Review Summary */}
                                    <Card className="border-0 shadow-sm">
                                        <CardContent className="p-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                    Customer Reviews
                                                </h3>
                                                <Button
                                                    onClick={handleWriteReview}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    {user ? 'Write a Review' : 'Login to Review'}
                                                </Button>
                                            </div>

                                            {/* Review Form */}
                                            {showReviewForm && (
                                                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-4 mb-8">
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Write Your Review
                                                    </h4>
                                                    
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
                                                            disabled={reviewRating === 0 || !reviewComment.trim() || isSubmittingReview}
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
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
                                                {reviews.length > 0 ? (
                                                    reviews.map((review) => (
                                                        <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                                                            <div className="flex items-start space-x-4">
                                                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                                                                    <span className="text-sm font-bold text-white">
                                                                        {review.user.name.charAt(0)}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                        <span className="font-semibold text-gray-900 dark:text-white">
                                                                            {review.user.name}
                                                                        </span>
                                                                        {review.verified && (
                                                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1">
                                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                                Verified
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center space-x-3 mb-3">
                                                                        {renderStars(review.rating, 'sm')}
                                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                            {review.date}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                                                        {review.comment}
                                                                    </p>
                                                                    
                                                                    <div className="flex items-center space-x-6">
                                                                        <button 
                                                                            onClick={() => handleToggleHelpful(review.id)}
                                                                            className={`flex items-center space-x-2 text-sm transition-colors ${
                                                                                review.is_helpful_by_user
                                                                                    ? 'text-green-600 dark:text-green-400'
                                                                                    : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                                                                            }`}
                                                                        >
                                                                            <ThumbsUp className={`h-4 w-4 ${
                                                                                review.is_helpful_by_user ? 'fill-current' : ''
                                                                            }`} />
                                                                            <span>Helpful ({review.helpful})</span>
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleReportReview(review.id)}
                                                                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                                                        >
                                                                            Report
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Star className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                            No reviews yet
                                                        </h4>
                                                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                                                            Be the first to share your thoughts about this product!
                                                        </p>
                                                        <Button
                                                            onClick={handleWriteReview}
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            {user ? 'Write the First Review' : 'Login to Review'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>


            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Report Review
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Reason for reporting
                                </Label>
                                <select
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Select a reason</option>
                                    <option value="spam">Spam</option>
                                    <option value="inappropriate">Inappropriate content</option>
                                    <option value="offensive">Offensive language</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Additional details (optional)
                                </Label>
                                <Textarea
                                    value={reportDescription}
                                    onChange={(e) => setReportDescription(e.target.value)}
                                    placeholder="Please provide more details about why you're reporting this review..."
                                    className="mt-1 min-h-[80px]"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <Button
                                onClick={handleSubmitReport}
                                disabled={!reportReason}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                Submit Report
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowReportModal(false);
                                    setReportReason('');
                                    setReportDescription('');
                                    setReportingReviewId(null);
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}