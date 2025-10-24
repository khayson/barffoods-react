import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, Package, Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
    id: string;
    name: string;
    price: number | string;
    originalPrice?: number | string | null;
    rating: number | string;
    reviews: number | string;
    image: string;
    store: string;
    category: string;
    badges?: Array<{
        text: string;
        color: 'red' | 'orange' | 'green' | 'yellow' | 'blue' | 'brown' | 'purple';
    }>;
}

interface Store {
    id: string;
    name: string;
    address: string;
    distance?: number;
}

interface Category {
    id: string;
    name: string;
    product_count?: number;
}

interface ProductSectionProps {
    nearbyStores: Store[];
    allStores: Store[];
    initialProducts: Product[];
    initialCategories: Category[];
    selectedCategory?: string;
    onCategoryChange?: (category: string) => void;
}

export default function ProductSection({ nearbyStores, allStores, initialProducts, initialCategories, selectedCategory: externalSelectedCategory, onCategoryChange }: ProductSectionProps) {
    const [selectedStores, setSelectedStores] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [selectedSort, setSelectedSort] = useState("Sort by");
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12); // Show 12 products per page
    const [totalPages, setTotalPages] = useState(1);
    
    // Ref for scrolling to product section
    const productSectionRef = useRef<HTMLDivElement>(null);

    // Initialize with props data
    useEffect(() => {
        // Remove duplicates based on ID
        const uniqueProducts = initialProducts.filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
        );
        
        setAllProducts(uniqueProducts);
        setStores(allStores); // Use allStores for dropdown
        setCategories(initialCategories);
        
        // Auto-select nearby stores if available
        if (nearbyStores.length > 0) {
            setSelectedStores(nearbyStores.map(store => store.name));
        }
        
        // Calculate total pages
        const pages = Math.ceil(uniqueProducts.length / itemsPerPage);
        setTotalPages(pages);
        
        // Initialize with first page of products
        setDisplayedProducts(uniqueProducts.slice(0, itemsPerPage));
        setIsInitialLoad(false);
    }, [nearbyStores, allStores, initialProducts, initialCategories, itemsPerPage]);

    // Sync external category selection
    useEffect(() => {
        if (externalSelectedCategory && externalSelectedCategory !== selectedCategory) {
            setSelectedCategory(externalSelectedCategory);
        }
    }, [externalSelectedCategory, selectedCategory]);

    // Clear filters function
    const clearFilters = () => {
        setSelectedStores(nearbyStores.length > 0 ? nearbyStores.map(store => store.name) : []);
        setSelectedCategory("All Categories");
        setSelectedSort("Sort by");
    };

    // Filter, sort and paginate products
    useEffect(() => {
        if (isInitialLoad) return;

        let filteredProducts = [...allProducts];

        // Filter by stores (multi-select)
        if (selectedStores.length > 0) {
            filteredProducts = filteredProducts.filter(product => 
                selectedStores.includes(product.store)
            );
        }

        // Filter by category
        if (selectedCategory !== "All Categories") {
            filteredProducts = filteredProducts.filter(product => 
                product.category === selectedCategory
            );
        }

        // Sort products
        filteredProducts = filteredProducts.sort((a, b) => {
            switch (selectedSort) {
                case "Price: Low to High":
                    return Number(a.price) - Number(b.price);
                case "Price: High to Low":
                    return Number(b.price) - Number(a.price);
                case "Rating: High to Low":
                    return Number(b.rating) - Number(a.rating);
                case "Name: A to Z":
                    return a.name.localeCompare(b.name);
                case "Name: Z to A":
                    return b.name.localeCompare(a.name);
                case "Newest First":
                    return parseInt(b.id) - parseInt(a.id);
                case "Most Popular":
                    return Number(b.reviews) - Number(a.reviews);
                default:
                    return 0;
            }
        });

        // Remove duplicates based on ID
        const uniqueProducts = filteredProducts.filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
        );

        // Calculate total pages
        const pages = Math.ceil(uniqueProducts.length / itemsPerPage);
        setTotalPages(pages);
        
        // Reset to first page when filters change
        setCurrentPage(1);
        
        // Display products for current page
        const startIndex = 0; // Start from first page
        const endIndex = itemsPerPage;
        setDisplayedProducts(uniqueProducts.slice(startIndex, endIndex));
    }, [selectedStores, selectedCategory, selectedSort, allProducts, isInitialLoad, itemsPerPage]);


    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        
        setIsLoading(true);
        setCurrentPage(page);
        
        // Scroll to top of products section smoothly
        if (productSectionRef.current) {
            const yOffset = -20; // Small offset from the top
            const element = productSectionRef.current;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        
        // Get filtered and sorted products
        let filteredProducts = [...allProducts];

        if (selectedStores.length > 0) {
            filteredProducts = filteredProducts.filter(product => 
                selectedStores.includes(product.store)
            );
        }

        if (selectedCategory !== "All Categories") {
            filteredProducts = filteredProducts.filter(product => 
                product.category === selectedCategory
            );
        }

        filteredProducts = filteredProducts.sort((a, b) => {
            switch (selectedSort) {
                case "Price: Low to High":
                    return Number(a.price) - Number(b.price);
                case "Price: High to Low":
                    return Number(b.price) - Number(a.price);
                case "Rating: High to Low":
                    return Number(b.rating) - Number(a.rating);
                case "Name: A to Z":
                    return a.name.localeCompare(b.name);
                case "Name: Z to A":
                    return b.name.localeCompare(a.name);
                case "Newest First":
                    return parseInt(b.id) - parseInt(a.id);
                case "Most Popular":
                    return Number(b.reviews) - Number(a.reviews);
                default:
                    return 0;
            }
        });

        const uniqueProducts = filteredProducts.filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
        );

        // Calculate start and end indices for the new page
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Simulate loading delay for smooth transition
        setTimeout(() => {
            setDisplayedProducts(uniqueProducts.slice(startIndex, endIndex));
            setIsLoading(false);
        }, 300);
    }, [currentPage, totalPages, allProducts, selectedStores, selectedCategory, selectedSort, itemsPerPage]);

    const sortOptions = [
        "Sort by",
        "Price: Low to High",
        "Price: High to Low", 
        "Rating: High to Low",
        "Name: A to Z",
        "Name: Z to A",
        "Newest First",
        "Most Popular"
    ];

    // Generate page numbers with ellipsis
    const generatePageNumbers = () => {
        const pages: (number | string)[] = [];
        const showEllipsisStart = currentPage > 3;
        const showEllipsisEnd = currentPage < totalPages - 2;

        if (totalPages <= 7) {
            // Show all pages if total is 7 or less
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (showEllipsisStart) {
                pages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (showEllipsisEnd) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    // Pagination component
    const Pagination = () => {
        if (totalPages <= 1) return null;

        const pages = generatePageNumbers();

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
            >
                {/* Page info */}
                <div className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                    Showing <span className="font-medium text-gray-900 dark:text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                        {Math.min(currentPage * itemsPerPage, displayedProducts.length + ((currentPage - 1) * itemsPerPage))}
                    </span> of{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                        {allProducts.length > 0 ? 
                            (selectedStores.length > 0 || selectedCategory !== "All Categories" ? 
                                displayedProducts.length + ((currentPage - 1) * itemsPerPage) : 
                                allProducts.length) : 
                            0}
                    </span> products
                </div>

                {/* Page numbers */}
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                    {/* Previous button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg transition-colors ${
                            currentPage === 1
                                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                        }`}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </motion.button>

                    {/* Page numbers */}
                    {pages.map((page, index) => (
                        page === '...' ? (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-2 text-gray-500 dark:text-gray-400"
                            >
                                ...
                            </span>
                        ) : (
                            <motion.button
                                key={page}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handlePageChange(page as number)}
                                className={`min-w-[40px] h-10 rounded-lg font-medium transition-all ${
                                    currentPage === page
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                                }`}
                            >
                                {page}
                            </motion.button>
                        )
                    ))}

                    {/* Next button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg transition-colors ${
                            currentPage === totalPages
                                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                        }`}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </motion.button>
                </div>
            </motion.div>
        );
    };

    // Enhanced loading skeleton component with animations
    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {[...Array(8)].map((_, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm overflow-hidden relative"
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    
                    <div className="h-40 sm:h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-3 sm:mb-4 animate-pulse"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4 animate-pulse"></div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3 animate-pulse"></div>
                            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-1/2 animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3 animate-pulse"></div>
                            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-1/3 animate-pulse"></div>
                        </div>
                        <div className="h-5 bg-gradient-to-r from-green-200 to-green-300 dark:from-green-700 dark:to-green-600 rounded w-1/4 animate-pulse"></div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-yellow-300 dark:bg-yellow-600 rounded-full animate-pulse"></div>
                            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-12 animate-pulse"></div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    // Enhanced empty state component with animations
    const EmptyState = ({ type }: { type: 'no-products' | 'no-results' }) => (
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
                {type === 'no-products' ? (
                    <Package className="h-20 w-20 text-gray-400 dark:text-gray-500 mx-auto" />
                ) : (
                    <Search className="h-20 w-20 text-gray-400 dark:text-gray-500 mx-auto" />
                )}
            </motion.div>
            <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-semibold text-gray-900 dark:text-white mb-3"
            >
                {type === 'no-products' ? 'No Products Available' : 'No Products Found'}
            </motion.h3>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto"
            >
                {type === 'no-products' 
                    ? 'We\'re working on adding more products. Check back soon!'
                    : 'Try adjusting your filters to find what you\'re looking for.'
                }
            </motion.p>
            {type === 'no-results' && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearFilters}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                >
                    Clear All Filters
                </motion.button>
            )}
        </motion.div>
    );

    if (isInitialLoad) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3 mb-6"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            Products
                        </h2>
                        <motion.div
                            animate={{ 
                                rotate: [0, 10, -10, 10, 0],
                                scale: [1, 1.1, 1.1, 1.1, 1]
                            }}
                            transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                        >
                            <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </motion.div>
                    </motion.div>
                    
                    {/* Status Bar */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center space-x-4">
                                {/* Store Status */}
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${nearbyStores.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {nearbyStores.length > 0 
                                            ? `${nearbyStores.length} stores nearby` 
                                            : 'All stores(no stores nearby)'
                                        }
                                    </p>
                                </div>
                                
                                {/* Category Filter */}
                                {selectedCategory !== "All Categories" && (
                                    <>
                                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Filter: <span className="font-medium text-gray-900 dark:text-white">{selectedCategory}</span>
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* Clear Filter Button */}
                            {selectedCategory !== "All Categories" && (
                                <button
                                    onClick={() => {
                                        setSelectedCategory("All Categories");
                                        onCategoryChange?.("All Categories");
                                    }}
                                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                    Clear filter
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        {/* Store Filter */}
                        <div className="relative">
                            <select
                                onChange={(e) => {
                                    const storeName = e.target.value;
                                    if (storeName && !selectedStores.includes(storeName)) {
                                        setSelectedStores(prev => [...prev, storeName]);
                                    }
                                    e.target.value = '';
                                }}
                                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">Add Store</option>
                                {stores.map((store) => (
                                    <option key={store.id} value={store.name}>
                                        {store.name} {store.distance ? `(${store.distance.toFixed(1)} mi)` : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                        
                        {/* Selected Stores with Animations */}
                        <AnimatePresence mode="popLayout">
                            {selectedStores.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex flex-wrap gap-2"
                                >
                                    <AnimatePresence>
                                        {selectedStores.map((storeName, index) => (
                                            <motion.span
                                                key={storeName}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 shadow-sm"
                                            >
                                                {storeName}
                                                <motion.button
                                                    whileHover={{ scale: 1.2, rotate: 90 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setSelectedStores(prev => prev.filter(name => name !== storeName))}
                                                    className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-bold"
                                                >
                                                    ×
                                                </motion.button>
                                            </motion.span>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Category Filter */}
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    onCategoryChange?.(e.target.value);
                                }}
                                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="All Categories">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.name}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span>{selectedSort}</span>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </button>
                            
                            {showSortDropdown && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                                    {sortOptions.slice(1).map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setSelectedSort(option);
                                                setShowSortDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div ref={productSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-3 mb-6"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        Products
                    </h2>
                    <motion.div
                        animate={{ 
                            rotate: [0, 10, -10, 10, 0],
                            scale: [1, 1.1, 1.1, 1.1, 1]
                        }}
                        transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3
                        }}
                    >
                        <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </motion.div>
                    {displayedProducts.length > 0 && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium"
                        >
                            {displayedProducts.length} {displayedProducts.length === 1 ? 'product' : 'products'}
                        </motion.span>
                    )}
                </motion.div>
                
                {/* Status Bar */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-4">
                            {/* Store Status */}
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${nearbyStores.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {nearbyStores.length > 0 
                                        ? `${nearbyStores.length} stores nearby` 
                                        : 'All stores(no stores nearby)'
                                    }
                                </p>
                            </div>
                            
                            {/* Category Filter */}
                            {selectedCategory !== "All Categories" && (
                                <>
                                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Filter: <span className="font-medium text-gray-900 dark:text-white">{selectedCategory}</span>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* Clear Filter Button */}
                        {selectedCategory !== "All Categories" && (
                            <button
                                onClick={() => {
                                    setSelectedCategory("All Categories");
                                    onCategoryChange?.("All Categories");
                                }}
                                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                Clear filter
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    {/* Store Filter */}
                    <div className="relative">
                        <select
                            onChange={(e) => {
                                const storeName = e.target.value;
                                if (storeName && !selectedStores.includes(storeName)) {
                                    setSelectedStores(prev => [...prev, storeName]);
                                }
                                e.target.value = '';
                            }}
                            className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Add Store</option>
                            {stores.map((store) => (
                                <option key={store.id} value={store.name}>
                                    {store.name} {store.distance ? `(${store.distance.toFixed(1)} mi)` : ''}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    
                        {/* Selected Stores with Animations */}
                        <AnimatePresence mode="popLayout">
                            {selectedStores.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex flex-wrap gap-2"
                                >
                                    <AnimatePresence>
                                        {selectedStores.map((storeName, index) => (
                                            <motion.span
                                                key={storeName}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 shadow-sm"
                                            >
                                                {storeName}
                                                <motion.button
                                                    whileHover={{ scale: 1.2, rotate: 90 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setSelectedStores(prev => prev.filter(name => name !== storeName))}
                                                    className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-bold"
                                                >
                                                    ×
                                                </motion.button>
                                            </motion.span>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    {/* Category Filter */}
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                onCategoryChange?.(e.target.value);
                            }}
                            className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="All Categories">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span>{selectedSort}</span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                        
                        {showSortDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                                {sortOptions.slice(1).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setSelectedSort(option);
                                            setShowSortDropdown(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Products Grid with Animations */}
            {displayedProducts.length === 0 ? (
                <EmptyState type={allProducts.length === 0 ? 'no-products' : 'no-results'} />
            ) : (
                <motion.div 
                    layout
                    className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {displayedProducts.map((product, index) => (
                            <motion.div
                                key={`${product.id}-${index}`}
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
                                    product={product}
                                    variant="default"
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-8"
                    >
                        <LoadingSkeleton />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination */}
            {!isLoading && <Pagination />}
        </div>
    );
}