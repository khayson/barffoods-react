import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { MapPin, Phone, Truck, DollarSign, Package, ChevronLeft, Store as StoreIcon, Navigation as NavigationIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';

interface Store {
    id: number;
    name: string;
    image: string | null;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
    delivery_radius: number;
    min_order_amount: number;
    delivery_fee: number;
    products_count: number;
    is_active: boolean;
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
    stock_quantity: number;
    inStock: boolean;
}

interface StorePageProps {
    store: Store;
    products: Product[];
}

export default function StorePage({ store, products }: StorePageProps) {
    const [activeTab, setActiveTab] = useState('products');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Helper function to check if image is a URL (not emoji)
    const isImageUrl = (image: string | null) => {
        if (!image) return false;
        return image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/');
    };

    return (
        <>
            <Head title={store.name} />
            <Navigation />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <Link
                            href="/stores"
                            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors text-sm"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back to Stores
                        </Link>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            {/* Store Image/Icon */}
                            <div className="flex-shrink-0">
                                {isImageUrl(store.image) ? (
                                    <img
                                        src={store.image || ''}
                                        alt={store.name}
                                        className="w-20 h-20 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        {store.image ? (
                                            <span className="text-4xl">{store.image}</span>
                                        ) : (
                                            <StoreIcon className="h-10 w-10 text-gray-400" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Store Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                        {store.name}
                                    </h1>
                                    <Badge className={store.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800'}>
                                        {store.is_active ? 'Open' : 'Closed'}
                                    </Badge>
                                </div>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{store.address}</span>
                                    </div>
                                    {store.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            <span>{store.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex sm:flex-col gap-4 sm:gap-2 text-sm">
                                <div className="text-center sm:text-right">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Min Order</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(store.min_order_amount)}</div>
                                </div>
                                <div className="text-center sm:text-right">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Delivery</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(store.delivery_fee)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <div className="lg:col-span-1 order-2 lg:order-1">
                            <div className="sticky top-8 space-y-4">
                                {/* Quick Actions */}
                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Quick Actions</h3>
                                        <div className="space-y-2">
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                                                    <MapPin className="h-4 w-4 mr-2" />
                                                    Get Directions
                                                </Button>
                                            </a>
                                            {store.phone && (
                                                <a href={`tel:${store.phone}`} className="block">
                                                    <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                                                        <Phone className="h-4 w-4 mr-2" />
                                                        Call Store
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Delivery Info */}
                                <Card>
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Delivery Info</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Min Order</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(store.min_order_amount)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(store.delivery_fee)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Radius</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{store.delivery_radius} mi</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Products</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{store.products_count}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Info Notice */}
                                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    <CardContent className="p-4">
                                        <div className="flex gap-2">
                                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-blue-900 dark:text-blue-300">
                                                Delivery times vary by location. Contact store for details.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3 order-1 lg:order-2">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                                    <TabsTrigger 
                                        value="products" 
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-4 py-3"
                                    >
                                        Products ({products.length})
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="about"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-4 py-3"
                                    >
                                        About
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="delivery"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-4 py-3"
                                    >
                                        Delivery
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="products" className="mt-6">
                                    {products.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {products.map((product) => (
                                                <motion.div
                                                    key={product.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    <ProductCard product={product} />
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card>
                                            <CardContent className="p-12 text-center">
                                                <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                    No Products Available
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    This store doesn't have any products listed yet.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>

                                <TabsContent value="about" className="mt-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                                Store Information
                                            </h3>
                                            <dl className="space-y-3">
                                                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                                                    <dt className="text-sm text-gray-600 dark:text-gray-400">Store Name</dt>
                                                    <dd className="text-sm font-medium text-gray-900 dark:text-white">{store.name}</dd>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                                                    <dt className="text-sm text-gray-600 dark:text-gray-400">Address</dt>
                                                    <dd className="text-sm text-gray-900 dark:text-white text-right max-w-xs">{store.address}</dd>
                                                </div>
                                                {store.phone && (
                                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                                                        <dt className="text-sm text-gray-600 dark:text-gray-400">Phone</dt>
                                                        <dd className="text-sm text-gray-900 dark:text-white">{store.phone}</dd>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                                                    <dt className="text-sm text-gray-600 dark:text-gray-400">Total Products</dt>
                                                    <dd className="text-sm font-medium text-gray-900 dark:text-white">{store.products_count}</dd>
                                                </div>
                                                <div className="flex items-center justify-between py-2">
                                                    <dt className="text-sm text-gray-600 dark:text-gray-400">Status</dt>
                                                    <dd>
                                                        <Badge className={store.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800'}>
                                                            {store.is_active ? 'Open' : 'Closed'}
                                                        </Badge>
                                                    </dd>
                                                </div>
                                            </dl>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="delivery" className="mt-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                                Delivery Information
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Minimum Order</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {formatCurrency(store.min_order_amount)} minimum order required
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                                            <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Delivery Fee</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {formatCurrency(store.delivery_fee)} flat delivery fee
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                                            <NavigationIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Delivery Radius</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            Delivers within {store.delivery_radius} miles
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}
