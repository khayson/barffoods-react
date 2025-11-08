import { Head, usePage } from '@inertiajs/react';
import CustomerLayout from '@/layouts/customer-layout';
import ProductSection from '@/components/ProductSection';
import ShopByCategory from '@/components/ShopByCategory';
import ShopByStore from '@/components/ShopByStore';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { type SharedData } from '@/types';
import { useState } from 'react';

interface Category {
    id: number;
    name: string;
    icon: string;
    products_count: number;
}

interface Store {
    id: number;
    name: string;
    address: string;
    products_count: number;
}

interface Filters {
    search: string;
    category_id?: number;
    store_id?: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    rating: number;
    reviews: number;
    image: string;
    images?: string[];
    store: string;
    category: string;
    badges?: Array<{
        text: string;
        color: 'red' | 'orange' | 'green' | 'yellow' | 'blue' | 'brown' | 'purple';
    }>;
}

interface ProductsPageProps {
    categories: Category[];
    stores: Store[];
    products: Product[];
    filters: Filters;
}

export default function ProductsIndex() {
    const { categories, stores, products, filters } = usePage<SharedData & ProductsPageProps>().props;
    const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(
        filters.category_id ? categories.find(c => c.id === filters.category_id)?.name : undefined
    );

    const totalProducts = categories.reduce((sum, cat) => sum + cat.products_count, 0);

    return (
        <CustomerLayout>
            <Head title="Browse Products" />
            
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    {/* Simple Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                    Browse Products
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {totalProducts.toLocaleString()} products from {stores.length} stores
                                </p>
                            </div>
                        </div>

                        {/* Categories Section */}
                        <ShopByCategory 
                            onCategorySelect={setSelectedCategoryName}
                            selectedCategory={selectedCategoryName}
                        />

                        {/* Stores Section */}
                        <div className="mt-8">
                            <ShopByStore />
                        </div>
                    </motion.div>

                    {/* Products Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="border-t border-gray-200 dark:border-gray-700 pt-8"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {selectedCategoryName || 'All Products'}
                            </h2>
                        </div>

                        <ProductSection 
                            nearbyStores={[]}
                            allStores={stores.map(s => ({
                                id: String(s.id),
                                name: s.name,
                                address: s.address,
                            }))}
                            initialProducts={products}
                            initialCategories={categories.map(c => ({
                                id: String(c.id),
                                name: c.name,
                                product_count: c.products_count,
                            }))}
                            selectedCategory={selectedCategoryName}
                        />
                    </motion.div>
                </div>
            </div>
        </CustomerLayout>
    );
}
