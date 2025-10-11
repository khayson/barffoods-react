import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Package, Search } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import axios from 'axios';

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
    const [hasMore, setHasMore] = useState(true);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

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
        
        // Initialize with first 8 products
        setDisplayedProducts(uniqueProducts.slice(0, 8));
        setHasMore(uniqueProducts.length > 8);
        setIsInitialLoad(false);
    }, [nearbyStores, allStores, initialProducts, initialCategories]);

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

    // Filter and sort products
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
                    return parseInt(b.id) - parseInt(a.id); // Assuming higher ID = newer
                case "Most Popular":
                    return Number(b.reviews) - Number(a.reviews);
                default:
                    return 0; // No sorting
            }
        });

        // Remove duplicates based on ID
        const uniqueProducts = filteredProducts.filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
        );

        // Reset displayed products
        setDisplayedProducts(uniqueProducts.slice(0, 8));
        setHasMore(uniqueProducts.length > 8);
    }, [selectedStores, selectedCategory, selectedSort, allProducts, isInitialLoad]);


    // Load more products function
    const loadMoreProducts = useCallback(async () => {
        if (isLoading || !hasMore) return;
        
        setIsLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let filteredProducts = [...allProducts];

        // Apply current filters
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

        // Apply current sorting
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

        const currentCount = displayedProducts.length;
        const nextBatch = filteredProducts.slice(currentCount, currentCount + 8);
        
        setDisplayedProducts(prev => [...prev, ...nextBatch]);
        setHasMore(currentCount + nextBatch.length < filteredProducts.length);
        setIsLoading(false);
    }, [isLoading, hasMore, allProducts, selectedStores, selectedCategory, selectedSort, displayedProducts.length]);

    // Infinite scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
                loadMoreProducts();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMoreProducts]);

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

    // Loading skeleton component
    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm animate-pulse">
                    <div className="h-40 sm:h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 sm:mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Empty state component
    const EmptyState = ({ type }: { type: 'no-products' | 'no-results' }) => (
        <div className="text-center py-12">
            <div className="mb-4">
                {type === 'no-products' ? (
                    <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto" />
                ) : (
                    <Search className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto" />
                )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {type === 'no-products' ? 'No Products Available' : 'No Products Found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
                {type === 'no-products' 
                    ? 'We\'re working on adding more products. Check back soon!'
                    : 'Try adjusting your filters to find what you\'re looking for.'
                }
            </p>
            {type === 'no-results' && (
                <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );

    if (isInitialLoad) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Products</h2>
                    
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
                        
                        {/* Selected Stores */}
                        {selectedStores.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedStores.map((storeName) => (
                                    <span
                                        key={storeName}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    >
                                        {storeName}
                                        <button
                                            onClick={() => setSelectedStores(prev => prev.filter(name => name !== storeName))}
                                            className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Products</h2>
                
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
                    
                    {/* Selected Stores */}
                    {selectedStores.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedStores.map((storeName) => (
                                <span
                                    key={storeName}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                >
                                    {storeName}
                                    <button
                                        onClick={() => setSelectedStores(prev => prev.filter(name => name !== storeName))}
                                        className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

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

            {/* Products Grid */}
            {displayedProducts.length === 0 ? (
                <EmptyState type={allProducts.length === 0 ? 'no-products' : 'no-results'} />
            ) : (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                    {displayedProducts.map((product, index) => (
                        <ProductCard
                            key={`${product.id}-${index}`}
                            product={product}
                            variant="default"
                        />
                    ))}
                </div>
            )}

            {/* Loading More */}
            {isLoading && (
                <div className="mt-8">
                    <LoadingSkeleton />
                </div>
            )}

            {/* Load More Button (fallback) */}
            {hasMore && !isLoading && (
                <div className="text-center mt-8">
                    <button
                        onClick={loadMoreProducts}
                        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        Load More Products
                    </button>
                </div>
            )}
        </div>
    );
}