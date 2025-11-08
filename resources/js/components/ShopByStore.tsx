import { useEffect, useRef, useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { Store as StoreIcon, MapPin, Truck } from 'lucide-react';

interface Store {
    id: string;
    name: string;
    address: string;
    distance?: number;
    delivery_radius?: number;
    product_count?: number;
}

interface ShopByStoreProps {
    onStoreSelect?: (storeName: string) => void;
    selectedStores?: string[];
}

// Store icon colors for variety
const storeColors = [
    'bg-blue-50 dark:bg-blue-900/20',
    'bg-green-50 dark:bg-green-900/20',
    'bg-purple-50 dark:bg-purple-900/20',
    'bg-orange-50 dark:bg-orange-900/20',
    'bg-pink-50 dark:bg-pink-900/20',
    'bg-yellow-50 dark:bg-yellow-900/20',
    'bg-red-50 dark:bg-red-900/20',
    'bg-indigo-50 dark:bg-indigo-900/20',
];

export default function ShopByStore({ onStoreSelect, selectedStores = [] }: ShopByStoreProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const scrollPositionRef = useRef(0);
    const { nearbyStores, allStores, isLoading } = useLocation();
    
    // Use nearby stores if available, otherwise all stores
    const stores: Store[] = nearbyStores.length > 0 ? nearbyStores : allStores;

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || stores.length === 0) return;

        let animationId: number;
        const scrollSpeed = 0.5; // pixels per frame

        const animate = () => {
            if (!isHovered) {
                scrollPositionRef.current += scrollSpeed;
                const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
                
                if (scrollPositionRef.current >= maxScroll) {
                    scrollPositionRef.current = 0;
                }
                
                scrollContainer.scrollLeft = scrollPositionRef.current;
            }
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [isHovered, stores.length]);

    if (isLoading) {
        return (
            <div className="w-full py-8 bg-white dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
                        Shop By Store
                    </h2>
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading stores...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (stores.length === 0) {
        return (
            <div className="w-full py-8 bg-white dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
                        Shop By Store
                    </h2>
                    <div className="text-center py-12">
                        <StoreIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No stores available</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full py-8 bg-white dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Title */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Shop By Store
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {nearbyStores.length > 0 
                            ? `${nearbyStores.length} stores near you` 
                            : `${allStores.length} stores available`
                        }
                    </p>
                </div>

                {/* Infinite Scrolling Stores */}
                <div className="relative overflow-hidden">
                    <div 
                        ref={scrollRef}
                        className="flex gap-4 overflow-x-hidden scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Duplicate stores for seamless loop */}
                        {[...stores, ...stores, ...stores].map((store, index) => {
                            const isSelected = selectedStores.includes(store.name);
                            const colorClass = storeColors[parseInt(store.id) % storeColors.length];
                            
                            return (
                                <div
                                    key={`${store.id}-${index}`}
                                    className={`${colorClass} rounded-xl p-4 hover:shadow-md transition-all duration-300 cursor-pointer group flex-shrink-0 w-64 relative border-2 ${
                                        isSelected
                                            ? 'border-green-500 shadow-lg bg-green-50 dark:bg-green-900/20' 
                                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                    onClick={() => {
                                        onStoreSelect?.(store.name);
                                        // Smooth scroll to products section
                                        setTimeout(() => {
                                            const productsSection = document.getElementById('products-section');
                                            if (productsSection) {
                                                productsSection.scrollIntoView({ 
                                                    behavior: 'smooth', 
                                                    block: 'start' 
                                                });
                                            }
                                        }, 100);
                                    }}
                                >
                                    {/* Selected indicator */}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}

                                    {/* Store Icon */}
                                    <div className="flex justify-center items-center mb-3 h-16">
                                        <div className="relative">
                                            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                <StoreIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                                            </div>
                                            {store.distance !== undefined && store.distance <= 5 && (
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                    <Truck className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Store Info */}
                                    <div className="text-center">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">
                                            {store.name}
                                        </h3>
                                        <div className="flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            <span className="truncate">{store.address}</span>
                                        </div>
                                        {store.distance !== undefined && (
                                            <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                                {store.distance.toFixed(1)} miles away
                                            </p>
                                        )}
                                        {store.product_count !== undefined && store.product_count > 0 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {store.product_count} {store.product_count === 1 ? 'product' : 'products'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Delivery Badge */}
                                    {store.delivery_radius && store.distance !== undefined && store.distance <= store.delivery_radius && (
                                        <div className="mt-2 text-center">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                <Truck className="h-3 w-3 mr-1" />
                                                Delivers here
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Helper Text */}
                <div className="text-center mt-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Click on a store to filter products • Hover to pause scrolling
                    </p>
                </div>
            </div>
        </div>
    );
}
