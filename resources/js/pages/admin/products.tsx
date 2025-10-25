import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import ProductOffCanvas from '@/components/admin/ProductOffCanvas';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Search, X, Package, Eye, Edit, Trash2, 
    Power, PowerOff, ChevronLeft, ChevronRight, MoreVertical,
    Grid3x3, List, DollarSign, Box, Tag, Store as StoreIcon,
    TrendingUp, AlertCircle, CheckCircle, XCircle, Sparkles,
    Filter, ChevronDown, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    original_price: number | null;
    image: string;
    images?: string[]; // Multiple images array
    category: {
        id: number;
        name: string;
    };
    store: {
        id: number;
        name: string;
    };
    stock_quantity: number;
    is_active: boolean;
    average_rating: number;
    review_count: number;
    created_at: string;
    updated_at: string;
}

interface Category {
    id: number;
    name: string;
}

interface Store {
    id: number;
    name: string;
}

interface Filters {
    search: string;
    category_id: string;
    store_id: string;
    status: string;
    stock_status: string;
    sort_by: string;
    sort_order: string;
}

interface ProductsPageProps {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    categories: Category[];
    stores: Store[];
    filters: Filters;
}

export default function ProductsPage({ products, categories, stores, filters }: ProductsPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [selectedStore, setSelectedStore] = useState(filters.store_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedStockStatus, setSelectedStockStatus] = useState(filters.stock_status || '');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Off-canvas state
    const [offCanvasOpen, setOffCanvasOpen] = useState(false);
    const [offCanvasMode, setOffCanvasMode] = useState<'view' | 'edit' | 'create'>('view');
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

    // Helper function to check if image is a URL
    const isImageUrl = (image: string) => {
        return image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/');
    };

    // Helper function to render product image
    const renderProductImage = (image: string, size: 'small' | 'large' = 'large') => {
        const sizeClasses = size === 'small' 
            ? 'h-12 w-12 text-2xl' 
            : 'h-16 w-16 text-4xl';
        
        const defaultEmoji = '📦';
        
        if (!image) {
            return (
                <div className={`${sizeClasses} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl ${size === 'large' ? 'group-hover:scale-110' : ''} transition-transform`}>
                    {defaultEmoji}
                </div>
            );
        }

        if (isImageUrl(image)) {
            return (
                <div className={`${sizeClasses} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl overflow-hidden ${size === 'large' ? 'group-hover:scale-110' : ''} transition-transform relative`}>
                    <img 
                        src={image} 
                        alt="Product" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback to emoji if image fails to load - React-friendly way
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) {
                                fallback.style.display = 'flex';
                            }
                        }}
                    />
                    <div className="hidden absolute inset-0 items-center justify-center text-4xl">
                        {defaultEmoji}
                    </div>
                </div>
            );
        }

        // Display as emoji or text
        return (
            <div className={`${sizeClasses} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl ${size === 'large' ? 'group-hover:scale-110' : ''} transition-transform`}>
                {image}
            </div>
        );
    };

    const activeFiltersCount = [
        searchTerm,
        selectedCategory,
        selectedStore,
        selectedStatus,
        selectedStockStatus,
    ].filter(Boolean).length;

    const handleSearch = () => {
        applyFilters();
    };

    const applyFilters = (page = 1) => {
        router.get('/admin/products', {
            page,
            search: searchTerm,
            category_id: selectedCategory,
            store_id: selectedStore,
            status: selectedStatus,
            stock_status: selectedStockStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setSelectedStore('');
        setSelectedStatus('');
        setSelectedStockStatus('');
        router.get('/admin/products');
    };

    const handleViewProduct = (id: number) => {
        setSelectedProductId(id);
        setOffCanvasMode('view');
        setOffCanvasOpen(true);
    };

    const handleEditProduct = (id: number) => {
        setSelectedProductId(id);
        setOffCanvasMode('edit');
        setOffCanvasOpen(true);
    };

    const handleCreateProduct = () => {
        setSelectedProductId(null);
        setOffCanvasMode('create');
        setOffCanvasOpen(true);
    };

    const handleDeleteProduct = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

        try {
            const response = await fetch(`/admin/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                router.reload();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            const response = await fetch(`/admin/products/${id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                router.reload({ only: ['products'] });
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Failed to update status');
        }
    };

    const getStockBadge = (quantity: number) => {
        if (quantity === 0) {
            return {
                color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
                icon: <XCircle className="h-3 w-3" />,
                label: 'Out of Stock'
            };
        }
        if (quantity < 10) {
            return {
                color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
                icon: <AlertCircle className="h-3 w-3" />,
                label: `Low (${quantity})`
            };
        }
        return {
            color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
            icon: <CheckCircle className="h-3 w-3" />,
            label: `${quantity} units`
        };
    };

    const handlePageChange = (page: number) => {
        applyFilters(page);
    };

    // Generate page numbers for pagination
    const generatePageNumbers = () => {
        const pages = [];
        const { current_page, last_page } = products;
        
        if (last_page <= 7) {
            for (let i = 1; i <= last_page; i++) {
                pages.push(i);
            }
        } else {
            if (current_page <= 3) {
                pages.push(1, 2, 3, 4, '...', last_page);
            } else if (current_page >= last_page - 2) {
                pages.push(1, '...', last_page - 3, last_page - 2, last_page - 1, last_page);
            } else {
                pages.push(1, '...', current_page - 1, current_page, current_page + 1, '...', last_page);
            }
        }
        
        return pages;
    };

    return (
        <AdminLayout>
            <Head title="Products Management" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Stats */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                                <Package className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    Products
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Manage your inventory and catalog
                                </p>
                            </div>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateProduct}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Add Product
                    </motion.button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {products.total}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {categories.length}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Stores</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stores.length}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <StoreIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Filters</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {activeFiltersCount}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                    {/* Main Search Bar */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800 backdrop-blur-sm">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by product name, description, or SKU..."
                                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSearch}
                                    className="px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 flex items-center gap-2 whitespace-nowrap"
                                >
                                    <Search className="h-5 w-5" />
                                    Search
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className={`px-4 py-3.5 border-2 rounded-xl transition-all font-medium flex items-center gap-2 whitespace-nowrap ${
                                        showAdvancedFilters
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 shadow-lg shadow-green-500/10'
                                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                                >
                                    <SlidersHorizontal className="h-5 w-5" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {activeFiltersCount > 0 && (
                                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                    <motion.div
                                        animate={{ rotate: showAdvancedFilters ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </motion.div>
                                </motion.button>
                            </div>
                        </div>

                        {/* Active Filters Badges */}
                        <AnimatePresence>
                            {activeFiltersCount > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="flex flex-wrap gap-2 overflow-hidden"
                                >
                                    {searchTerm && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium"
                                        >
                                            <Search className="h-3.5 w-3.5" />
                                            Search: "{searchTerm}"
                                            <button
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    applyFilters();
                                                }}
                                                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </motion.span>
                                    )}
                                    
                                    {selectedCategory && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium"
                                        >
                                            <Tag className="h-3.5 w-3.5" />
                                            {categories.find(c => c.id.toString() === selectedCategory)?.name}
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory('');
                                                    applyFilters();
                                                }}
                                                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </motion.span>
                                    )}
                                    
                                    {selectedStore && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg text-sm font-medium"
                                        >
                                            <StoreIcon className="h-3.5 w-3.5" />
                                            {stores.find(s => s.id.toString() === selectedStore)?.name}
                                            <button
                                                onClick={() => {
                                                    setSelectedStore('');
                                                    applyFilters();
                                                }}
                                                className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </motion.span>
                                    )}
                                    
                                    {selectedStatus && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium"
                                        >
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            {selectedStatus === 'active' ? 'Active' : 'Inactive'}
                                            <button
                                                onClick={() => {
                                                    setSelectedStatus('');
                                                    applyFilters();
                                                }}
                                                className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </motion.span>
                                    )}
                                    
                                    {selectedStockStatus && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium"
                                        >
                                            <Box className="h-3.5 w-3.5" />
                                            {selectedStockStatus === 'in_stock' ? 'In Stock' : selectedStockStatus === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                                            <button
                                                onClick={() => {
                                                    setSelectedStockStatus('');
                                                    applyFilters();
                                                }}
                                                className="ml-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </motion.span>
                                    )}

                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Clear All
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Advanced Filters Panel */}
                    <AnimatePresence>
                        {showAdvancedFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
                            >
                                <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Advanced Filters
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Category Filter */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <Tag className="h-4 w-4 text-purple-500" />
                                                Category
                                            </label>
                                            <Combobox
                                                options={[
                                                    { value: '', label: 'All Categories' },
                                                    ...categories.map((category) => ({
                                                        value: category.id.toString(),
                                                        label: category.name,
                                                    }))
                                                ]}
                                                value={selectedCategory}
                                                onValueChange={(value) => {
                                                    setSelectedCategory(value);
                                                    applyFilters();
                                                }}
                                                placeholder="Select category..."
                                                searchPlaceholder="Search categories..."
                                                emptyMessage="No category found."
                                                icon={<Tag className="h-4 w-4 text-purple-500" />}
                                            />
                                        </div>

                                        {/* Store Filter */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <StoreIcon className="h-4 w-4 text-orange-500" />
                                                Store Location
                                            </label>
                                            <Combobox
                                                options={[
                                                    { value: '', label: 'All Stores' },
                                                    ...stores.map((store) => ({
                                                        value: store.id.toString(),
                                                        label: store.name,
                                                    }))
                                                ]}
                                                value={selectedStore}
                                                onValueChange={(value) => {
                                                    setSelectedStore(value);
                                                    applyFilters();
                                                }}
                                                placeholder="Select store..."
                                                searchPlaceholder="Search stores..."
                                                emptyMessage="No store found."
                                                icon={<StoreIcon className="h-4 w-4 text-orange-500" />}
                                            />
                                        </div>

                                        {/* Status Filter */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Status
                                            </label>
                                            <Combobox
                                                options={[
                                                    { value: '', label: 'All Status' },
                                                    { value: 'active', label: '✅ Active' },
                                                    { value: 'inactive', label: '⛔ Inactive' },
                                                ]}
                                                value={selectedStatus}
                                                onValueChange={(value) => {
                                                    setSelectedStatus(value);
                                                    applyFilters();
                                                }}
                                                placeholder="Select status..."
                                                searchPlaceholder="Search status..."
                                                emptyMessage="No status found."
                                                icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                                            />
                                        </div>

                                        {/* Stock Status Filter */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <Box className="h-4 w-4 text-amber-500" />
                                                Stock Status
                                            </label>
                                            <Combobox
                                                options={[
                                                    { value: '', label: 'All Stock Levels' },
                                                    { value: 'in_stock', label: '✅ In Stock' },
                                                    { value: 'low_stock', label: '⚠️ Low Stock' },
                                                    { value: 'out_of_stock', label: '❌ Out of Stock' },
                                                ]}
                                                value={selectedStockStatus}
                                                onValueChange={(value) => {
                                                    setSelectedStockStatus(value);
                                                    applyFilters();
                                                }}
                                                placeholder="Select stock status..."
                                                searchPlaceholder="Search stock status..."
                                                emptyMessage="No stock status found."
                                                icon={<Box className="h-4 w-4 text-amber-500" />}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* View Toggle */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing <span className="font-semibold text-gray-900 dark:text-white">{products.data.length}</span> of{' '}
                        <span className="font-semibold text-gray-900 dark:text-white">{products.total}</span> products
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${
                                viewMode === 'grid'
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <Grid3x3 className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-all ${
                                viewMode === 'table'
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <List className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Products Grid */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                            {products.data.map((product, index) => {
                                const stockBadge = getStockBadge(product.stock_quantity);
                                return (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 cursor-pointer group"
                                        onClick={() => handleViewProduct(product.id)}
                                    >
                                        {/* Product Image & Actions */}
                                        <div className="relative flex items-center justify-between">
                                            {renderProductImage(
                                                product.images && product.images.length > 0 
                                                    ? product.images[0] 
                                                    : product.image || '📦', 
                                                'large'
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuItem onClick={() => handleViewProduct(product.id)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleEditProduct(product.id)}
                                                        data-product-edit={product.id}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(product.id)}>
                                                        {product.is_active ? (
                                                            <>
                                                                <PowerOff className="h-4 w-4 mr-2" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Power className="h-4 w-4 mr-2" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteProduct(product.id, product.name)}
                                                        className="text-red-600 dark:text-red-400"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Product Info */}
                                        <div className="min-h-[60px]">
                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-tight">
                                                {product.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
                                                {product.description || 'No description available'}
                                            </p>
                                        </div>

                                        {/* Price & Stock */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {product.price}
                                                    </span>
                                                </div>
                                                {product.original_price && (
                                                    <span className="text-xs text-gray-500 line-through">
                                                        ${product.original_price}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${stockBadge.color}`}>
                                                {stockBadge.icon}
                                                {stockBadge.label}
                                            </span>
                                        </div>

                                        {/* Meta Info */}
                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                <Tag className="h-3 w-3" />
                                                {product.category.name}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full font-medium ${
                                                product.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                            }`}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    // Table View (keeping the original table for those who prefer it)
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {products.data.map((product) => {
                                        const stockBadge = getStockBadge(product.stock_quantity);
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-shrink-0">
                                                            {renderProductImage(
                                                                product.images && product.images.length > 0 
                                                                    ? product.images[0] 
                                                                    : product.image || '📦', 
                                                                'small'
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1 max-w-xs">
                                                            <div className="font-semibold text-gray-900 dark:text-white line-clamp-1 leading-tight">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                                                                {product.description || 'No description available'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                                        <Tag className="h-4 w-4 text-gray-400" />
                                                        {product.category.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-4 w-4 text-green-600" />
                                                        <span className="font-semibold text-gray-900 dark:text-white">
                                                            {product.price}
                                                        </span>
                                                        {product.original_price && (
                                                            <span className="text-sm text-gray-500 line-through ml-1">
                                                                ${product.original_price}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border ${stockBadge.color}`}>
                                                        {stockBadge.icon}
                                                        {stockBadge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleToggleStatus(product.id)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                                            product.is_active
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        }`}
                                                    >
                                                        {product.is_active ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                                                        {product.is_active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                            <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleViewProduct(product.id)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => handleEditProduct(product.id)}
                                                                data-product-edit={product.id}
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(product.id)}>
                                                                {product.is_active ? (
                                                                    <>
                                                                        <PowerOff className="h-4 w-4 mr-2" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Power className="h-4 w-4 mr-2" />
                                                                        Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                                                className="text-red-600 dark:text-red-400"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Enhanced Pagination */}
                {products.last_page > 1 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Showing{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {((products.current_page - 1) * products.per_page) + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {Math.min(products.current_page * products.per_page, products.total)}
                                </span>{' '}
                                of{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {products.total}
                                </span>{' '}
                                results
                            </div>

                            <div className="flex items-center gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handlePageChange(products.current_page - 1)}
                                    disabled={products.current_page === 1}
                                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </motion.button>

                                <div className="flex items-center gap-1">
                                    {generatePageNumbers().map((page, index) => (
                                        typeof page === 'number' ? (
                                            <motion.button
                                                key={index}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handlePageChange(page)}
                                                className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all ${
                                                    products.current_page === page
                                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                                                        : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {page}
                                            </motion.button>
                                        ) : (
                                            <span key={index} className="px-2 text-gray-500 dark:text-gray-400">
                                                {page}
                                            </span>
                                        )
                                    ))}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handlePageChange(products.current_page + 1)}
                                    disabled={products.current_page === products.last_page}
                                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Off-Canvas */}
            <ProductOffCanvas
                isOpen={offCanvasOpen}
                mode={offCanvasMode}
                productId={selectedProductId}
                categories={categories}
                stores={stores}
                onClose={() => setOffCanvasOpen(false)}
                onSuccess={() => router.reload()}
                onEdit={handleEditProduct}
            />
        </AdminLayout>
    );
}
