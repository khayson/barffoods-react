import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Package, DollarSign, Box, Tag, Store, Image as ImageIcon, Weight, Ruler, Edit, Trash2, CheckCircle, XCircle, AlertTriangle, Info, Upload, FileImage, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { EmojiPickerComponent } from '@/components/ui/emoji-picker';

interface Category {
    id: number;
    name: string;
}

interface Store {
    id: number;
    name: string;
}

interface Product {
    id?: number;
    name: string;
    description: string | null;
    price: number;
    original_price: number | null;
    image: string | null;
    images: string[];
    category_id: number;
    store_id: number;
    stock_quantity: number;
    is_active: boolean;
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
}

interface ProductOffCanvasProps {
    isOpen: boolean;
    mode: 'view' | 'edit' | 'create';
    productId?: number | null;
    categories: Category[];
    stores: Store[];
    onClose: () => void;
    onSuccess?: () => void;
    onEdit?: (id: number) => void;
}

export default function ProductOffCanvas({
    isOpen,
    mode,
    productId,
    categories,
    stores,
    onClose,
    onSuccess,
    onEdit,
}: ProductOffCanvasProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [product, setProduct] = useState<Product>({
        name: '',
        description: '',
        price: 0,
        original_price: null,
        image: '',
        images: [],
        category_id: categories[0]?.id || 0,
        store_id: stores[0]?.id || 0,
        stock_quantity: 0,
        is_active: true,
        weight: null,
        length: null,
        width: null,
        height: null,
    });

    useEffect(() => {
        if (isOpen && productId && (mode === 'view' || mode === 'edit')) {
            fetchProduct();
            setSelectedImageIndex(0); // Reset to first image
        } else if (isOpen && mode === 'create') {
            // Reset form for create mode
            setProduct({
                name: '',
                description: '',
                price: 0,
                original_price: null,
                image: '',
                images: [],
                category_id: categories[0]?.id || 0,
                store_id: stores[0]?.id || 0,
                stock_quantity: 0,
                is_active: true,
                weight: null,
                length: null,
                width: null,
                height: null,
            });
            setSelectedImageIndex(0); // Reset to first image
        }
    }, [isOpen, productId, mode]);

    const fetchProduct = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Convert string numbers to actual numbers
                const fetchedProduct = data.product;
                setProduct({
                    ...fetchedProduct,
                    price: parseFloat(fetchedProduct.price) || 0,
                    original_price: fetchedProduct.original_price ? parseFloat(fetchedProduct.original_price) : null,
                    images: fetchedProduct.images || [],
                    stock_quantity: parseInt(fetchedProduct.stock_quantity) || 0,
                    weight: fetchedProduct.weight ? parseFloat(fetchedProduct.weight) : null,
                    length: fetchedProduct.length ? parseFloat(fetchedProduct.length) : null,
                    width: fetchedProduct.width ? parseFloat(fetchedProduct.width) : null,
                    height: fetchedProduct.height ? parseFloat(fetchedProduct.height) : null,
                    category_id: parseInt(fetchedProduct.category_id) || 0,
                    store_id: parseInt(fetchedProduct.store_id) || 0,
                });
            } else {
                toast.error('Failed to load product');
                onClose();
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Failed to load product');
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Convert FileList to Array
        const fileArray = Array.from(files);

        // Check if we'll exceed the limit
        const remainingSlots = 4 - product.images.length;
        if (fileArray.length > remainingSlots) {
            toast.error(`You can only upload ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''} (${product.images.length}/4)`);
            e.target.value = ''; // Reset file input
            return;
        }

        // Validate all files before uploading
        for (const file of fileArray) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error(`"${file.name}" is not an image file`);
                e.target.value = ''; // Reset file input
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`"${file.name}" exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
                e.target.value = ''; // Reset file input
                return;
            }
        }

        setIsUploading(true);

        try {
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                toast.error('CSRF token not found. Please refresh the page.');
                setIsUploading(false);
                return;
            }

            const uploadedUrls: string[] = [];
            let successCount = 0;
            let failCount = 0;

            // Upload files sequentially
            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                const formData = new FormData();
                formData.append('image', file);

                try {
                    const response = await fetch('/admin/products/upload-image', {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': csrfToken,
                            'Accept': 'application/json',
                        },
                        body: formData,
                    });

                    // Handle non-OK responses
                    if (!response.ok) {
                        if (response.status === 419) {
                            toast.error('Session expired. Please refresh the page and try again.');
                            break; // Stop uploading if session expired
                        }
                        
                        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
                        toast.error(`Failed to upload "${file.name}": ${errorData.message || response.status}`);
                        failCount++;
                        continue; // Skip this file, continue with others
                    }

                    const data = await response.json();

                    if (data.success) {
                        uploadedUrls.push(data.url);
                        successCount++;
                    } else {
                        toast.error(`Failed to upload "${file.name}": ${data.message || 'Unknown error'}`);
                        failCount++;
                    }
                } catch (error) {
                    console.error(`Error uploading "${file.name}":`, error);
                    toast.error(`Failed to upload "${file.name}"`);
                    failCount++;
                }
            }

            // Update product with all successfully uploaded images
            if (uploadedUrls.length > 0) {
                const newImages = [...product.images, ...uploadedUrls];
                setProduct({ 
                    ...product, 
                    images: newImages,
                    image: product.image || uploadedUrls[0] // Set first uploaded image as primary if not set
                });
                
                // Show summary toast
                if (failCount === 0) {
                    toast.success(`✅ ${successCount} image${successCount !== 1 ? 's' : ''} uploaded successfully! (${newImages.length}/4)`);
                } else {
                    toast.warning(`⚠️ ${successCount} uploaded, ${failCount} failed. (${newImages.length}/4)`);
                }
            } else if (failCount > 0) {
                toast.error(`❌ All ${failCount} image${failCount !== 1 ? 's' : ''} failed to upload`);
            }

            e.target.value = ''; // Reset file input
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Failed to upload images. Please check your connection and try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = product.images.filter((_, i) => i !== index);
        setProduct({
            ...product,
            images: newImages,
            image: newImages[0] || '' // Update primary image if removing the first one
        });
        toast.success('Image removed');
    };

    const handleAddEmoji = (emoji: string) => {
        if (product.images.length >= 4) {
            toast.error('Maximum 4 images allowed');
            return;
        }

        const newImages = [...product.images, emoji];
        setProduct({
            ...product,
            images: newImages,
            image: product.image || emoji // Set first image as primary if not set
        });
        toast.success(`Emoji added! (${newImages.length}/4)`);
    };

    const handleAddImageUrl = () => {
        const url = prompt('Enter image URL:');
        if (!url) return;

        if (product.images.length >= 4) {
            toast.error('Maximum 4 images allowed');
            return;
        }

        const newImages = [...product.images, url.trim()];
        setProduct({
            ...product,
            images: newImages,
            image: product.image || url.trim() // Set first image as primary if not set
        });
        toast.success(`Image added! (${newImages.length}/4)`);
    };

    const handleSave = async () => {
        // Validation
        if (!product.name.trim()) {
            toast.error('Product name is required');
            return;
        }
        if (product.price <= 0) {
            toast.error('Price must be greater than 0');
            return;
        }
        if (!product.category_id) {
            toast.error('Please select a category');
            return;
        }
        if (!product.store_id) {
            toast.error('Please select a store');
            return;
        }
        // Validate discount pricing
        if (product.original_price && Number(product.original_price) <= Number(product.price)) {
            toast.error('Original Price must be higher than Current Price for a valid discount!');
            return;
        }

        setIsSaving(true);
        try {
            const url = mode === 'create' ? '/admin/products' : `/admin/products/${productId}`;
            const method = mode === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(product),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                onClose();
                if (onSuccess) {
                    onSuccess();
                } else {
                    // Reload the page to reflect changes
                    router.reload();
                }
            } else {
                toast.error(data.message || 'Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Failed to save product');
        } finally {
            setIsSaving(false);
        }
    };

    const getStockBadge = () => {
        const quantity = product.stock_quantity;
        if (quantity === 0) {
            return {
                color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
                icon: <XCircle className="h-4 w-4" />,
                label: 'Out of Stock'
            };
        }
        if (quantity <= 10) {
            return {
                color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
                icon: <AlertTriangle className="h-4 w-4" />,
                label: `Low Stock (${quantity})`
            };
        }
        return {
            color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
            icon: <CheckCircle className="h-4 w-4" />,
            label: `In Stock (${quantity})`
        };
    };

    const renderViewMode = () => {
        const stockBadge = getStockBadge();
        const category = categories.find(c => c.id === product.category_id);
        const store = stores.find(s => s.id === product.store_id);
        
        // Ensure prices are numbers
        const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
        const originalPrice = product.original_price 
            ? (typeof product.original_price === 'number' ? product.original_price : parseFloat(product.original_price))
            : null;
        
        const hasDiscount = originalPrice && originalPrice > price;
        const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

        // Use images array or fallback to single image
        const productImages = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : ['📦']);
        
        // Helper to check if image is a URL
        const isImageUrl = (img: string) => img && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/'));
        
        // Navigation functions
        const nextImage = () => {
            setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
        };
        
        const prevImage = () => {
            setSelectedImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
        };

        return (
            <div className="space-y-4">
                {/* Product Image Gallery */}
                <div className="space-y-3">
                    {/* Main Image */}
                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden max-w-md mx-auto">
                        <div className="w-full h-full flex items-center justify-center">
                            {isImageUrl(productImages[selectedImageIndex]) ? (
                                <img
                                    src={productImages[selectedImageIndex]}
                                    alt="Product"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<span class="text-7xl">📦</span>';
                                    }}
                                />
                            ) : (
                                <span className="text-7xl">{productImages[selectedImageIndex]}</span>
                            )}
                        </div>
                        
                        {/* Navigation Arrows - Only show if multiple images exist */}
                        {productImages.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                    
                    {/* Thumbnail Gallery - Only show if multiple images exist */}
                    {productImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto scrollbar-thin max-w-md mx-auto">
                            {productImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                                        selectedImageIndex === index
                                            ? 'border-green-500'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                        {isImageUrl(img) ? (
                                            <img
                                                src={img}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xl">{img}</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Section */}
                <div className="space-y-3">
                    {/* Category Badge */}
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                        {category?.name || 'Category'}
                    </Badge>

                    {/* Product Title */}
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                            {product.name}
                        </h1>
                        <div className="flex items-center gap-2">
                            <Badge className={stockBadge.color + ' border'}>
                                {stockBadge.icon}
                                {stockBadge.label}
                            </Badge>
                            <Badge variant={product.is_active ? 'default' : 'secondary'} className={product.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                                {product.is_active ? '✅ Active' : '⛔ Inactive'}
                            </Badge>
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed">
                            {product.description}
                        </p>
                    )}

                    {/* Pricing */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            ${price.toFixed(2)}
                        </span>
                        {hasDiscount && originalPrice && (
                            <>
                                <span className="text-xl text-gray-500 dark:text-gray-600 line-through">
                                    ${originalPrice.toFixed(2)}
                                </span>
                                <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                    {discountPercent}% off!
                                </Badge>
                            </>
                        )}
                    </div>
                </div>

                {/* Store Info Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">Store Location</h4>
                    </div>
                    <p className="text-gray-700 dark:text-gray-400">{store?.name || 'Unknown'}</p>
                </div>

                {/* Shipping Dimensions */}
                {(product.weight || product.length || product.width || product.height) && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            Packaging Information
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {product.weight && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {typeof product.weight === 'number' ? product.weight : parseFloat(product.weight)} oz
                                    </span>
                                </div>
                            )}
                            {product.length && product.width && product.height && (
                                <div className="col-span-2">
                                    <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {typeof product.length === 'number' ? product.length : parseFloat(product.length)}" × {' '}
                                        {typeof product.width === 'number' ? product.width : parseFloat(product.width)}" × {' '}
                                        {typeof product.height === 'number' ? product.height : parseFloat(product.height)}"
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            if (productId && onEdit) {
                                onEdit(productId);
                            }
                        }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
                    >
                        <Edit className="h-5 w-5" />
                        Edit Product
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                            if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
                                try {
                                    const response = await fetch(`/admin/products/${productId}`, {
                                        method: 'DELETE',
                                        headers: {
                                            'Accept': 'application/json',
                                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                        },
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                        toast.success(data.message);
                                        onClose();
                                        router.reload();
                                    } else {
                                        toast.error(data.message);
                                    }
                                } catch (error) {
                                    console.error('Error deleting product:', error);
                                    toast.error('Failed to delete product');
                                }
                            }
                        }}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
                    >
                        <Trash2 className="h-5 w-5" />
                        Delete
                    </motion.button>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    const isReadOnly = mode === 'view';
    const title = mode === 'create' ? 'Create New Product' : mode === 'edit' ? 'Edit Product' : 'View Product';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Off-canvas Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[600px] lg:w-[700px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                                    <Package className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {mode === 'create' ? 'Add a new product to the inventory' : 
                                         mode === 'edit' ? 'Update product information' : 
                                         'View product details'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="h-12 w-12 text-green-600 animate-spin mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
                                </div>
                            ) : mode === 'view' ? (
                                renderViewMode()
                            ) : (
                                <div className="space-y-6">
                                    {/* Basic Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Package className="h-5 w-5" />
                                            Basic Information
                                        </h3>
                                        <div className="space-y-4">
                                            {/* Product Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Product Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={product.name}
                                                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                    placeholder="Enter product name"
                                                />
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={product.description || ''}
                                                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                                                    disabled={isReadOnly}
                                                    rows={4}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                    placeholder="Enter product description"
                                                />
                                            </div>

                                            {/* Multiple Images Upload (Up to 4) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                    <ImageIcon className="h-4 w-4" />
                                                    Product Images ({product.images.length}/4)
                                                </label>
                                                
                                                <div className="space-y-3">
                                                    {/* Image Grid */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[0, 1, 2, 3].map((index) => {
                                                            const image = product.images[index];
                                                            const isImageUrl = image && (image.startsWith('http') || image.startsWith('/'));
                                                            
                                                            return (
                                                                <div 
                                                                    key={index}
                                                                    className="relative aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
                                                                >
                                                                    {image ? (
                                                                        <>
                                                                            {/* Image Display */}
                                                                            <div className="w-full h-full flex items-center justify-center p-2">
                                                                                {isImageUrl ? (
                                                                                    <img
                                                                                        src={image}
                                                                                        alt={`Product ${index + 1}`}
                                                                                        className="w-full h-full object-cover rounded-md"
                                                                                    />
                                                                                ) : (
                                                                                    <span className="text-4xl">{image}</span>
                                                                                )}
                                                                            </div>
                                                                            
                                                                            {/* Primary Badge */}
                                                                            {index === 0 && (
                                                                                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                                                                    Primary
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {/* Remove Button */}
                                                                            {!isReadOnly && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveImage(index)}
                                                                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        /* Empty Slot */
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                            <ImageIcon className="h-8 w-8" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    
                                                    {/* Upload Buttons */}
                                                    {!isReadOnly && product.images.length < 4 && (
                                                        <div className="flex gap-2">
                                                            {/* Upload from PC */}
                                                            <div className="flex-1">
                                                                <input
                                                                    type="file"
                                                                    id="image-upload-multi"
                                                                    accept="image/*"
                                                                    multiple
                                                                    onChange={handleImageUpload}
                                                                    disabled={isUploading}
                                                                    className="hidden"
                                                                />
                                                                <label
                                                                    htmlFor="image-upload-multi"
                                                                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer transition-colors text-sm ${
                                                                        isUploading 
                                                                            ? 'opacity-50 cursor-not-allowed' 
                                                                            : 'hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                                    }`}
                                                                >
                                                                    {isUploading ? (
                                                                        <>
                                                                            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                                                            <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Upload className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                                            <span className="text-gray-600 dark:text-gray-400">Upload</span>
                                                                        </>
                                                                    )}
                                                                </label>
                                                            </div>
                                                            
                                                            {/* Add Emoji */}
                                                            <div className="space-y-2">
                                                                <EmojiPickerComponent
                                                                    onEmojiSelect={handleAddEmoji}
                                                                    buttonText="🎨 Add Emoji"
                                                                    buttonClassName="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-600 dark:text-gray-400"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAddImageUrl}
                                                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-600 dark:text-gray-400"
                                                                >
                                                                    🔗 Add Image URL
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        📁 Select multiple images at once (up to 4 total) • PNG, JPG, GIF - max 5MB each • First image is primary
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <DollarSign className="h-5 w-5" />
                                            Pricing
                                        </h3>
                                        
                                        {/* Info Banner */}
                                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <div className="flex gap-2">
                                                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-blue-900 dark:text-blue-200">
                                                    <p className="font-medium mb-1">💡 How Discounts Work:</p>
                                                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                                                        <li>• <strong>Current Price</strong> = What customers pay (selling price)</li>
                                                        <li>• <strong>Original Price</strong> = Optional "was" price (must be <strong>higher</strong> than current)</li>
                                                        <li>• Leave "Original Price" empty for regular pricing (no discount)</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Current Price * ($)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={product.price}
                                                    onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                    placeholder="19.99"
                                                />
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    💵 Selling price
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Original Price ($)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={product.original_price || ''}
                                                    onChange={(e) => setProduct({ ...product, original_price: parseFloat(e.target.value) || null })}
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                    placeholder="29.99"
                                                />
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    🏷️ Optional - for sales
                                                </p>
                                            </div>
                                        </div>

                                        {/* Discount Validation & Preview */}
                                        {product.original_price && (
                                            <>
                                                {/* Warning: Original price must be higher */}
                                                {Number(product.original_price) <= Number(product.price) && (
                                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                                                                    ⚠️ Invalid Discount
                                                                </p>
                                                                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                                                    Original Price must be <strong>higher</strong> than Current Price for a valid discount!
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Success: Valid discount preview */}
                                                {Number(product.original_price) > Number(product.price) && (
                                                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                                                                    ✅ Discount Preview:
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                    <span className="text-lg line-through text-gray-500 dark:text-gray-600">
                                                                        ${typeof product.original_price === 'number' ? product.original_price.toFixed(2) : parseFloat(String(product.original_price)).toFixed(2)}
                                                                    </span>
                                                                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                                                        ${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(String(product.price)).toFixed(2)}
                                                                    </span>
                                                                    <span className="px-2 py-1 bg-red-500 text-white text-sm font-bold rounded">
                                                                        {Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)}% OFF
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                                                    💰 Customers save ${(Number(product.original_price) - Number(product.price)).toFixed(2)}!
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Categorization */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Tag className="h-5 w-5" />
                                            Categorization
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Category *
                                                </label>
                                                <select
                                                    value={product.category_id}
                                                    onChange={(e) => setProduct({ ...product, category_id: parseInt(e.target.value) })}
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                >
                                                    {categories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                    <Store className="h-4 w-4" />
                                                    Store *
                                                </label>
                                                <select
                                                    value={product.store_id}
                                                    onChange={(e) => setProduct({ ...product, store_id: parseInt(e.target.value) })}
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                >
                                                    {stores.map((store) => (
                                                        <option key={store.id} value={store.id}>
                                                            {store.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inventory */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Box className="h-5 w-5" />
                                            Inventory
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Stock Quantity *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={product.stock_quantity}
                                                    onChange={(e) => setProduct({ ...product, stock_quantity: parseInt(e.target.value) || 0 })}
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="is_active"
                                                    checked={product.is_active}
                                                    onChange={(e) => setProduct({ ...product, is_active: e.target.checked })}
                                                    disabled={isReadOnly}
                                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                                                />
                                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Active (visible to customers)
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Dimensions */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Ruler className="h-5 w-5" />
                                            Shipping Dimensions (Optional)
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                    <Weight className="h-4 w-4" />
                                                    Weight (oz)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={product.weight || ''}
                                                    onChange={(e) => setProduct({ ...product, weight: parseFloat(e.target.value) || null })}
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Length (in)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={product.length || ''}
                                                    onChange={(e) => setProduct({ ...product, length: parseFloat(e.target.value) || null })}
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Width (in)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={product.width || ''}
                                                    onChange={(e) => setProduct({ ...product, width: parseFloat(e.target.value) || null })}
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Height (in)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={product.height || ''}
                                                    onChange={(e) => setProduct({ ...product, height: parseFloat(e.target.value) || null })}
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!isReadOnly && !isLoading && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isSaving}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {mode === 'create' ? 'Create Product' : 'Save Changes'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

