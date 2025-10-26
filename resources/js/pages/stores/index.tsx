import { Head, Link, usePage } from '@inertiajs/react';
import CustomerLayout from '@/layouts/customer-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
    MapPin, 
    Phone, 
    Package, 
    DollarSign,
    Clock,
    Navigation,
    Search,
    Store as StoreIcon
} from 'lucide-react';
import { type SharedData } from '@/types';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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
                    <div style="min-width: 200px;">
                        <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${store.name}</h3>
                        <p style="font-size: 14px; color: #666; margin-bottom: 4px;">
                            <strong>📍</strong> ${store.address}
                        </p>
                        ${store.phone ? `<p style="font-size: 14px; color: #666; margin-bottom: 4px;">
                            <strong>📞</strong> ${store.phone}
                        </p>` : ''}
                        <p style="font-size: 14px; color: #666; margin-bottom: 8px;">
                            <strong>📦</strong> ${store.products_count} products available
                        </p>
                        <a href="/stores/${store.id}" style="
                            display: inline-block;
                            padding: 6px 12px;
                            background: #10B981;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                            font-size: 14px;
                            font-weight: 500;
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
            
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                            <StoreIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                            Find Stores Near You
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Discover local stores and browse their fresh products
                        </p>
                    </motion.div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Stores List */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-1 space-y-4"
                        >
                            {/* Search */}
                            <Card className="p-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search stores..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                                    />
                                </div>
                            </Card>

                            {/* Store Count */}
                            <Card className="p-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredStores.length}</span> {filteredStores.length === 1 ? 'store' : 'stores'}
                                </p>
                            </Card>

                            {/* Stores List */}
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                                {filteredStores.map((store) => (
                                    <motion.div
                                        key={store.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <Card
                                            className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                                                selectedStore?.id === store.id
                                                    ? 'border-green-500 shadow-lg ring-2 ring-green-200 dark:ring-green-800'
                                                    : 'hover:border-green-300'
                                            }`}
                                            onClick={() => handleStoreClick(store)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                                                    <StoreIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                        {store.name}
                                                    </h3>
                                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                        <p className="flex items-start gap-1">
                                                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                                            <span className="line-clamp-2">{store.address}</span>
                                                        </p>
                                                        {store.phone && (
                                                            <p className="flex items-center gap-1">
                                                                <Phone className="h-4 w-4 flex-shrink-0" />
                                                                <span>{store.phone}</span>
                                                            </p>
                                                        )}
                                                        <p className="flex items-center gap-1">
                                                            <Package className="h-4 w-4 flex-shrink-0" />
                                                            <span>{store.products_count} products</span>
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <Badge className="text-xs bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                                            Min: {formatCurrency(store.min_order_amount)}
                                                        </Badge>
                                                        <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                                                            Delivery: {formatCurrency(store.delivery_fee)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}

                                {filteredStores.length === 0 && (
                                    <Card className="p-8 text-center">
                                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 dark:text-gray-400">
                                            No stores found matching "{searchQuery}"
                                        </p>
                                    </Card>
                                )}
                            </div>
                        </motion.div>

                        {/* Map */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-2"
                        >
                            <Card className="p-4 h-[700px]">
                                <div 
                                    ref={mapRef} 
                                    className="w-full h-full rounded-lg overflow-hidden"
                                    style={{ minHeight: '650px' }}
                                />
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}

