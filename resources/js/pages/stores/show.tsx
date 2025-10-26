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

    return (
        <>
            <Head title={store.name} />
            <Navigation />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Hero Banner */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <Link
                            href="/stores"
                            className="inline-flex items-center text-white hover:text-green-100 mb-6 transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5 mr-1" />
                            Back to Stores
                        </Link>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
                        >
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0 w-24 h-24 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-xl">
                                    <StoreIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                                        {store.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 text-white">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            <span className="text-green-100">{store.address}</span>
                                        </div>
                                        {store.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-5 w-5" />
                                                <span className="text-green-100">{store.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                            {store.products_count} Products
                                        </Badge>
                                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                            {store.delivery_radius} mi radius
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-shrink-0">
                                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-green-100 mb-1">Minimum Order</p>
                                                <p className="text-2xl font-bold text-white">{formatCurrency(store.min_order_amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-green-100 mb-1">Delivery Fee</p>
                                                <p className="text-2xl font-bold text-white">{formatCurrency(store.delivery_fee)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="w-full">
                                    <TabsTrigger value="products" className="flex-1">
                                        Products ({products.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="about" className="flex-1">
                                        About
                                    </TabsTrigger>
                                    <TabsTrigger value="delivery" className="flex-1">
                                        Delivery
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="products" className="mt-6">
                                    {products.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {products.map((product, index) => (
                                                <motion.div
                                                    key={product.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <ProductCard product={product} />
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card>
                                            <CardContent className="p-12 text-center">
                                                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                    No Products Available
                                                </h3>
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    This store doesn't have any products listed at the moment.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>

                                <TabsContent value="about" className="mt-6">
                                    <Card>
                                        <CardContent className="p-6 space-y-6">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                    <StoreIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                    Store Information
                                                </h3>
                                                <dl className="space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Store Name</dt>
                                                        <dd className="text-sm text-gray-900 dark:text-white font-semibold">{store.name}</dd>
                                                    </div>
                                                    <div className="flex items-start justify-between">
                                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
                                                        <dd className="text-sm text-gray-900 dark:text-white text-right">{store.address}</dd>
                                                    </div>
                                                    {store.phone && (
                                                        <div className="flex items-start justify-between">
                                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                                                            <dd className="text-sm text-gray-900 dark:text-white">{store.phone}</dd>
                                                        </div>
                                                    )}
                                                    <div className="flex items-start justify-between">
                                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</dt>
                                                        <dd className="text-sm text-gray-900 dark:text-white font-semibold">{store.products_count}</dd>
                                                    </div>
                                                    <div className="flex items-start justify-between">
                                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                                                        <dd>
                                                            <Badge className={store.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800'}>
                                                                {store.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="delivery" className="mt-6">
                                    <Card>
                                        <CardContent className="p-6 space-y-6">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                    <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                    Delivery Information
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Minimum Order</h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {formatCurrency(store.min_order_amount)} minimum order required
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <Truck className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Delivery Fee</h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {formatCurrency(store.delivery_fee)} flat delivery fee
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <NavigationIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Delivery Radius</h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                Delivers within {store.delivery_radius} miles
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm text-blue-900 dark:text-blue-300">
                                                            Delivery times may vary based on your location and order size. 
                                                            Contact the store directly for more specific delivery information.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-20 space-y-6">
                                {/* Quick Actions */}
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                                        <div className="space-y-3">
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full"
                                            >
                                                <Button variant="outline" className="w-full justify-start">
                                                    <MapPin className="h-4 w-4 mr-2" />
                                                    Get Directions
                                                </Button>
                                            </a>
                                            {store.phone && (
                                                <a href={`tel:${store.phone}`} className="w-full">
                                                    <Button variant="outline" className="w-full justify-start">
                                                        <Phone className="h-4 w-4 mr-2" />
                                                        Call Store
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Store Stats */}
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Store Stats</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Products</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{store.products_count}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Delivery Radius</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{store.delivery_radius} mi</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Min Order</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(store.min_order_amount)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Delivery Fee</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(store.delivery_fee)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

