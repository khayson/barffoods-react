import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ArrowRight, Command, ChevronDown, Package, MapPin, X } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ProductCard from '@/components/ProductCard';
import axios from 'axios';

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchItem {
    id: string;
    name: string;
    href: string;
    type: 'product' | 'category';
    price?: number;
    originalPrice?: number;
    rating?: number;
    reviews?: number;
    image?: string;
    store?: string;
    category?: string;
    badges?: Array<{ text: string; color: string }>;
}

interface Store {
    id: string;
    name: string;
    address: string;
}

interface ApiResponse {
    products: SearchItem[];
    stores: Store[];
    categories: Array<{ id: string; name: string }>;
}

export default function ProductSearchModal({ isOpen, onClose }: ProductSearchModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStore, setSelectedStore] = useState<string>('all');
    const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
    const [cartItems, setCartItems] = useState<Map<string, number>>(new Map());
    const [products, setProducts] = useState<SearchItem[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get<ApiResponse>(`/api/products?t=${Date.now()}`);
                const { products: apiProducts, stores: apiStores, categories: apiCategories } = response.data;
                
                // Convert products to SearchItem format
                const searchItems: SearchItem[] = apiProducts.map(product => ({
                    ...product,
                    href: `/products/${product.id}`,
                    type: 'product' as const
                }));
                
                setProducts(searchItems);
                setStores(apiStores);
                setCategories(apiCategories);
            } catch (error) {
                // console.error('Error fetching products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Focus the input when the modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle keyboard shortcuts and body scroll
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        let searchableItems: SearchItem[] = [];

        // Start with all products
        let filteredProducts = [...products];

        // Filter by category if not 'all'
        if (selectedCategory !== 'all') {
            const selectedCategoryData = categories.find(c => c.id === selectedCategory);
            if (selectedCategoryData) {
                filteredProducts = filteredProducts.filter(product => 
                    product.category === selectedCategoryData.name
                );
            }
        }

        // Filter by store if not 'all'
        if (selectedStore !== 'all') {
            const selectedStoreData = stores.find(s => s.id === selectedStore);
            if (selectedStoreData) {
                filteredProducts = filteredProducts.filter(product => 
                    product.store === selectedStoreData.name
                );
            }
        }

        // Apply text search filter if there's a search term
        if (searchTerm.trim() !== '') {
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        // Always show only products (no categories in search results)
        searchableItems = filteredProducts;
        
        // console.log('Search Debug:', {
        //     searchTerm,
        //     selectedCategory,
        //     selectedStore,
        //     filteredProductsCount: filteredProducts.length,
        //     searchableItemsCount: searchableItems.length,
        //     searchableItems: searchableItems.map(item => ({ name: item.name, type: item.type }))
        // });
        
        setFilteredItems(searchableItems);
    }, [searchTerm, selectedCategory, selectedStore, products, stores, categories]);

    const handleSelect = (item: SearchItem) => {
        // In a real application, this would navigate to the item's page
        // console.log('Selected:', item.name, item.href);
        onClose();
    };

    const toggleWishlist = (productId: string | number) => {
        setWishlistItems(prev => {
            const newSet = new Set(prev);
            const id = String(productId);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const addToCart = (productId: string | number) => {
        setCartItems(prev => {
            const newMap = new Map(prev);
            const id = String(productId);
            const currentQuantity = newMap.get(id) || 0;
            newMap.set(id, currentQuantity + 1);
            return newMap;
        });
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex flex-col h-full max-h-[600px]">
                    {/* Header with Search Input */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Search Products</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Search Results / Sections */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                        {isLoading ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                                Loading products...
                            </div>
                        ) : searchTerm.trim() === '' ? (
                            <div className="space-y-6">
                                {/* Featured Products Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                                        {searchTerm.trim() === '' ? 'Featured Products' : 'Search Results'}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {filteredItems.filter(item => item.type === 'product').slice(0, 6).map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={{
                                                    ...product,
                                                    price: product.price || 0,
                                                    rating: product.rating || 0,
                                                    reviews: product.reviews || 0,
                                                    image: product.image || '📦',
                                                    store: product.store || 'Store',
                                                    category: product.category || 'Category'
                                                }}
                                                variant="modal"
                                            />
                                        ))}
                                    </div>
                                </div>

                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                                No results found for "{searchTerm}".
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Search Results Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Search Results</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredItems.filter(item => item.type === 'product').map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={{
                                                    ...product,
                                                    price: product.price || 0,
                                                    rating: product.rating || 0,
                                                    reviews: product.reviews || 0,
                                                    image: product.image || '📦',
                                                    store: product.store || 'Store',
                                                    category: product.category || 'Category'
                                                }}
                                                variant="modal"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        {/* Filters */}
                        <div className="flex items-center justify-between mb-3">
                            {/* Categories Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <Package className="h-4 w-4" />
                                        <span className="text-sm">
                                            {selectedCategory === 'all' ? 'All Categories' : categories.find(c => c.id === selectedCategory)?.name}
                                        </span>
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                                    <DropdownMenuItem 
                                        className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                        onClick={() => setSelectedCategory('all')}
                                    >
                                        <Package className="mr-2 h-4 w-4" />
                                        <span>All Categories</span>
                                    </DropdownMenuItem>
                                    {categories.map((category) => (
                                        <DropdownMenuItem 
                                            key={category.id}
                                            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                            onClick={() => setSelectedCategory(category.id)}
                                        >
                                            <Package className="mr-2 h-4 w-4" />
                                            <span>{category.name}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Store Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm">
                                            {selectedStore === 'all' ? 'All Stores' : stores.find(s => s.id === selectedStore)?.name}
                                        </span>
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                                    <DropdownMenuItem 
                                        className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                        onClick={() => setSelectedStore('all')}
                                    >
                                        <MapPin className="mr-2 h-4 w-4" />
                                        <span>All Stores</span>
                                    </DropdownMenuItem>
                                    {stores.map((store) => (
                                        <DropdownMenuItem 
                                            key={store.id}
                                            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                            onClick={() => setSelectedStore(store.id)}
                                        >
                                            <MapPin className="mr-2 h-4 w-4" />
                                            <div className="flex flex-col">
                                                <span>{store.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{store.address}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render modal in a portal at document body level to avoid z-index and overflow issues
    return createPortal(modalContent, document.body);
}