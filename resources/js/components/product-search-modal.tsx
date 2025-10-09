import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, ArrowRight, Command, ChevronDown, Package, MapPin } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchItem {
    id: string;
    name: string;
    href: string;
    type: 'product' | 'category';
}

interface Store {
    id: string;
    name: string;
    address: string;
}

// Mock data for demonstration purposes
const mockProducts: SearchItem[] = [
    { id: '1', name: 'Organic Apples', href: '/products/organic-apples', type: 'product' },
    { id: '2', name: 'Fresh Milk (1L)', href: '/products/fresh-milk', type: 'product' },
    { id: '3', name: 'Whole Wheat Bread', href: '/products/whole-wheat-bread', type: 'product' },
    { id: '4', name: 'Avocados (pack of 2)', href: '/products/avocados', type: 'product' },
    { id: '5', name: 'Chicken Breast (500g)', href: '/products/chicken-breast', type: 'product' },
    { id: '6', name: 'Ground Beef (1lb)', href: '/products/ground-beef', type: 'product' },
    { id: '7', name: 'Cheddar Cheese', href: '/products/cheddar-cheese', type: 'product' },
    { id: '8', name: 'Spinach (bag)', href: '/products/spinach', type: 'product' },
];

const mockCategories: SearchItem[] = [
    { id: 'c1', name: 'Fruits & Vegetables', href: '/categories/fruits-vegetables', type: 'category' },
    { id: 'c2', name: 'Dairy & Eggs', href: '/categories/dairy-eggs', type: 'category' },
    { id: 'c3', name: 'Bakery', href: '/categories/bakery', type: 'category' },
    { id: 'c4', name: 'Meat & Seafood', href: '/categories/meat-seafood', type: 'category' },
    { id: 'c5', name: 'Pantry Staples', href: '/categories/pantry-staples', type: 'category' },
];

const mockStores: Store[] = [
    { id: 's1', name: 'Downtown Store', address: '123 Main St, Downtown' },
    { id: 's2', name: 'Mall Location', address: '456 Mall Ave, Shopping Center' },
    { id: 's3', name: 'Suburban Branch', address: '789 Suburb St, Suburban' },
    { id: 's4', name: 'Express Store', address: '321 Quick Lane, Express' },
];

export default function ProductSearchModal({ isOpen, onClose }: ProductSearchModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStore, setSelectedStore] = useState<string>('all');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Focus the input when the modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredItems([]);
            return;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        let searchableItems: SearchItem[] = [];

        // If specific category is selected, only search within that category
        if (selectedCategory !== 'all') {
            const selectedCategoryData = mockCategories.find(c => c.id === selectedCategory);
            if (selectedCategoryData) {
                // Add the selected category itself
                searchableItems.push(selectedCategoryData);
                
                // Add products that belong to this category
                // In a real app, products would have category_id field
                searchableItems.push(...mockProducts.filter(product => 
                    product.name.toLowerCase().includes(lowerCaseSearchTerm) &&
                    // Mock logic: check if product name contains category keywords
                    (selectedCategoryData.name.toLowerCase().includes('fruits') && 
                     (product.name.toLowerCase().includes('apple') || product.name.toLowerCase().includes('avocado')) ||
                     selectedCategoryData.name.toLowerCase().includes('dairy') && 
                     (product.name.toLowerCase().includes('milk') || product.name.toLowerCase().includes('cheese')) ||
                     selectedCategoryData.name.toLowerCase().includes('bakery') && 
                     product.name.toLowerCase().includes('bread') ||
                     selectedCategoryData.name.toLowerCase().includes('meat') && 
                     (product.name.toLowerCase().includes('chicken') || product.name.toLowerCase().includes('beef')) ||
                     selectedCategoryData.name.toLowerCase().includes('pantry') && 
                     product.name.toLowerCase().includes('spinach'))
                ));
            }
        } else {
            // If "All Categories" is selected, search in all categories and products
            searchableItems = [...mockCategories, ...mockProducts];
        }

        // Filter by store if not 'all'
        if (selectedStore !== 'all') {
            const selectedStoreData = mockStores.find(s => s.id === selectedStore);
            if (selectedStoreData) {
                // In a real app, you'd filter based on store inventory
                // For demo, we'll filter products based on store name keywords
                searchableItems = searchableItems.filter(item => {
                    if (item.type === 'category') return true; // Always show categories
                    
                    // Mock store filtering logic
                    return (selectedStoreData.name.toLowerCase().includes('downtown') && 
                            (item.name.toLowerCase().includes('organic') || item.name.toLowerCase().includes('fresh')) ||
                            selectedStoreData.name.toLowerCase().includes('mall') && 
                            (item.name.toLowerCase().includes('milk') || item.name.toLowerCase().includes('bread')) ||
                            selectedStoreData.name.toLowerCase().includes('suburban') && 
                            (item.name.toLowerCase().includes('chicken') || item.name.toLowerCase().includes('cheese')) ||
                            selectedStoreData.name.toLowerCase().includes('express') && 
                            (item.name.toLowerCase().includes('ground') || item.name.toLowerCase().includes('spinach')));
                });
            }
        }

        // Apply text search filter
        const results = searchableItems.filter(item =>
            item.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
        
        setFilteredItems(results);
    }, [searchTerm, selectedCategory, selectedStore]);

    const handleSelect = (item: SearchItem) => {
        // In a real application, this would navigate to the item's page
        console.log('Selected:', item.name, item.href);
        onClose();
        // Example: Inertia.visit(item.href);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 border-none bg-gray-900 text-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="flex flex-col h-[400px]">
                    {/* Search Input */}
                    <div className="p-4 border-b border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Search Results / Sections */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {searchTerm.trim() === '' ? (
                            <div className="text-center text-gray-500 py-10">
                                Type to search for products or categories.
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">
                                No results found for "{searchTerm}".
                            </div>
                        ) : (
                            <>
                                {filteredItems.filter(item => item.type === 'product').length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Products</h3>
                                        <div className="space-y-1">
                                            {filteredItems.filter(item => item.type === 'product').map((item) => (
                                                <button
                                                    key={item.id}
                                                    className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                                                    onClick={() => handleSelect(item)}
                                                >
                                                    <ArrowRight className="h-4 w-4 text-gray-500 mr-3" />
                                                    <span className="text-sm">{item.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {filteredItems.filter(item => item.type === 'category').length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Categories</h3>
                                        <div className="space-y-1">
                                            {filteredItems.filter(item => item.type === 'category').map((item) => (
                                                <button
                                                    key={item.id}
                                                    className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                                                    onClick={() => handleSelect(item)}
                                                >
                                                    <ArrowRight className="h-4 w-4 text-gray-500 mr-3" />
                                                    <span className="text-sm">{item.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-700">
                        {/* Filters */}
                        <div className="flex items-center justify-between mb-3">
                            {/* Categories Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="flex items-center space-x-2 px-3 py-2 border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                                    >
                                        <Package className="h-4 w-4" />
                                        <span className="text-sm">
                                            {selectedCategory === 'all' ? 'All Categories' : mockCategories.find(c => c.id === selectedCategory)?.name}
                                        </span>
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48 rounded-lg bg-gray-800 border-gray-600">
                                    <DropdownMenuItem 
                                        className="text-gray-300 hover:bg-gray-700 hover:text-white"
                                        onClick={() => setSelectedCategory('all')}
                                    >
                                        <Package className="mr-2 h-4 w-4" />
                                        <span>All Categories</span>
                                    </DropdownMenuItem>
                                    {mockCategories.map((category) => (
                                        <DropdownMenuItem 
                                            key={category.id}
                                            className="text-gray-300 hover:bg-gray-700 hover:text-white"
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
                                        className="flex items-center space-x-2 px-3 py-2 border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                                    >
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm">
                                            {selectedStore === 'all' ? 'All Stores' : mockStores.find(s => s.id === selectedStore)?.name}
                                        </span>
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48 rounded-lg bg-gray-800 border-gray-600">
                                    <DropdownMenuItem 
                                        className="text-gray-300 hover:bg-gray-700 hover:text-white"
                                        onClick={() => setSelectedStore('all')}
                                    >
                                        <MapPin className="mr-2 h-4 w-4" />
                                        <span>All Stores</span>
                                    </DropdownMenuItem>
                                    {mockStores.map((store) => (
                                        <DropdownMenuItem 
                                            key={store.id}
                                            className="text-gray-300 hover:bg-gray-700 hover:text-white"
                                            onClick={() => setSelectedStore(store.id)}
                                        >
                                            <MapPin className="mr-2 h-4 w-4" />
                                            <div className="flex flex-col">
                                                <span>{store.name}</span>
                                                <span className="text-xs text-gray-400">{store.address}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Keyboard Shortcuts */}
                        {/* <div className="flex items-center justify-between text-gray-400 text-sm">
                            <div className="flex items-center space-x-2">
                                <span>Press</span>
                                {navigator.platform.toLowerCase().includes('mac') ? (
                                    <>
                                        <Kbd>
                                            <Command className="h-3 w-3" />
                                        </Kbd>
                                        <Kbd>K</Kbd>
                                    </>
                                ) : (
                                    <>
                                        <Kbd>Ctrl</Kbd>
                                        <Kbd>K</Kbd>
                                    </>
                                )}
                                <span>to search</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span>Press</span>
                                <Kbd>Esc</Kbd>
                                <span>to close</span>
                            </div>
                        </div> */}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
