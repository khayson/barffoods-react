import { Head, Link, usePage } from '@inertiajs/react';
import CustomerLayout from '@/layouts/customer-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
    MapPin, 
    Phone, 
    Package, 
    Search,
    Store as StoreIcon,
    ArrowRight,
    Navigation2,
    Truck
} from 'lucide-react';
import { type SharedData } from '@/types';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
}

interface DefaultMapLocation {
    latitude: number;
    longitude: number;
    address: string;
    zoom: number;
}

interface StoresPageProps {
    stores: Store[];
    defaultMapLocation: DefaultMapLocation;
}

export default function StoresIndex() {
    const { stores, defaultMapLocation } = usePage<SharedData & StoresPageProps>().props;
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Helper function to check if image is a URL (not emoji)
    const isImageUrl = (image: string | null) => {
        if (!image) return false;
        return image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/');
    };

    // Filter stores based on search
    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        // Initialize map
        const DEFAULT_LOCATION = defaultMapLocation || {
            latitude: 40.7128,
            longitude: -74.0060,
            zoom: 13
        };

        const map = L.map(mapRef.current).setView(
            [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude],
            DEFAULT_LOCATION.zoom
        );

        mapInstance.current = map;

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        // Add markers for all stores
        stores.forEach((store) => {
            if (store.latitude && store.longitude) {
                const marker = L.marker([store.latitude, store.longitude], {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: `
                            <div style="
                                background: #10B981;
                                width: 40px;
                                height: 40px;
                                border-radius: 50% 50% 50% 0;
                                border: 3px solid white;
                                transform: rotate(-45deg);
                                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <span style="transform: rotate(45deg); font-size: 20px;">🏪</span>
                            </div>
                        `,
                        iconSize: [40, 40],
                        iconAnchor: [20, 40],
                    }),
                }).addTo(map);

                marker.bindPopup(`
                    <div style="min-width: 220px;">
                        <h3 style="font-weight: 600; margin-bottom: 10px; font-size: 16px; color: #111;">${store.name}</h3>
                        <p style="font-size: 13px; color: #666; margin-bottom: 6px; display: flex; gap: 6px;">
                            <span>📍</span> ${store.address}
                        </p>
                        ${store.phone ? `<p style="font-size: 13px; color: #666; margin-bottom: 6px; display: flex; gap: 6px;">
                            <span>📞</span> ${store.phone}
                        </p>` : ''}
                        <p style="font-size: 13px; color: #666; margin-bottom: 12px; display: flex; gap: 6px;">
                            <span>📦</span> ${store.products_count} products
                        </p>
                        <a href="/stores/${store.id}" style="
                            display: block;
                            padding: 8px 16px;
                            background: #10B981;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                            font-size: 14px;
                            font-weight: 500;
                            text-align: center;
                        ">View Store</a>
                    </div>
                `);

                // Click handler to select store
                marker.on('click', () => {
                    setSelectedStore(store);
                });
            }
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [stores, defaultMapLocation]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const handleStoreClick = (store: Store) => {
        setSelectedStore(store);
        if (mapInstance.current && store.latitude && store.longitude) {
            mapInstance.current.setView([store.latitude, store.longitude], 15);
        }
    };

    return (
        <CustomerLayout>
            <Head title="Find Stores" />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Store Locator
                                </h1>
                                <p className="mt-1 text-gray-600 dark:text-gray-400">
                                    Find fresh products from local stores near you
                                </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-6 text-sm">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stores.length}</div>
                                    <div className="text-gray-600 dark:text-gray-400">Stores</div>
                                </div>
                                <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stores.reduce((sum, s) => sum + s.products_count, 0)}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400">Products</div>
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative max-w-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by store name or location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Store List */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {filteredStores.length} {filteredStores.length === 1 ? 'Store' : 'Stores'}
                                </h2>
                            </div>

                            <div className="space-y-3 max-h-[700px] overflow-y-auto">
                                {filteredStores.map((store) => (
                                    <motion.div
                                        key={store.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <Card
                                            onClick={() => handleStoreClick(store)}
                                            className={`cursor-pointer transition-all hover:shadow-md ${
                                                selectedStore?.id === store.id
                                                    ? 'ring-2 ring-green-500 shadow-md'
                                                    : ''
                                            }`}
                                        >
                                            <Link href={`/stores/${store.id}`} className="block p-4">
                                                <div className="flex gap-4">
                                                    {/* Store Image/Icon */}
                                                    <div className="flex-shrink-0">
                                                        {isImageUrl(store.image) ? (
                                                            <img
                                                                src={store.image || ''}
                                                                alt={store.name}
                                                                loading="lazy"
                                                                className="w-16 h-16 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                                {store.image ? (
                                                                    <span className="text-3xl">{store.image}</span>
                                                                ) : (
                                                                    <StoreIcon className="h-8 w-8 text-gray-400" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Store Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                            {store.name}
                                                        </h3>
                                                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                            <p className="flex items-start gap-1.5 line-clamp-1">
                                                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                <span className="line-clamp-1">{store.address}</span>
                                                            </p>
                                                            <p className="flex items-center gap-1.5">
                                                                <Package className="h-4 w-4 flex-shrink-0" />
                                                                <span>{store.products_count} products</span>
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                From {formatCurrency(store.min_order_amount)}
                                                            </span>
                                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatCurrency(store.delivery_fee)} delivery
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Arrow */}
                                                    <div className="flex-shrink-0 self-center">
                                                        <ArrowRight className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                </div>
                                            </Link>
                                        </Card>
                                    </motion.div>
                                ))}

                                {filteredStores.length === 0 && (
                                    <Card className="p-8 text-center">
                                        <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            No stores found
                                        </p>
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                                        >
                                            Clear search
                                        </button>
                                    </Card>
                                )}
                            </div>
                        </div>

                        {/* Map */}
                        <div className="lg:col-span-2">
                            <Card className="p-0 overflow-hidden sticky top-8">
                                <div 
                                    ref={mapRef} 
                                    className="w-full h-[700px]"
                                />
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
