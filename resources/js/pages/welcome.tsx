import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import HeroCarousel from '@/components/HeroCarousel';
import FeaturesSection from '@/components/FeaturesSection';
import ShopByCategory from '@/components/ShopByCategory';
import ShopByStore from '@/components/ShopByStore';
import ProductSection from '@/components/ProductSection';
import StoreLocationsMap from '@/components/StoreLocationsMap';
import Footer from '@/components/Footer';
import { LocationProvider } from '@/contexts/LocationContext';
import { MapPin, X, Navigation as NavigationIcon } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface PageProps {
    nearbyStores: Array<{
        id: string;
        name: string;
        address: string;
        phone: string;
        latitude: number;
        longitude: number;
        delivery_radius: number;
        min_order_amount: number;
        delivery_fee: number;
        distance: number;
    }>;
    allStores: Array<{
        id: string;
        name: string;
        address: string;
        phone: string;
        latitude: number;
        longitude: number;
        delivery_radius: number;
        min_order_amount: number;
        delivery_fee: number;
        distance: number;
    }>;
    products: Array<{
        id: string;
        name: string;
        price: number | string;
        originalPrice?: number | string | null;
        rating: number | string;
        reviews: number | string;
        image: string;
        store: string;
        category: string;
        badges?: Array<{ text: string; color: 'red' | 'orange' | 'green' | 'yellow' | 'blue' | 'brown' | 'purple' }>;
    }>;
    categories: Array<{
        id: string;
        name: string;
        product_count: number;
    }>;
    userLocation: {
        latitude: number;
        longitude: number;
    };
    defaultMapLocation: {
        latitude: number;
        longitude: number;
        address: string;
        zoom: number;
    };
    [key: string]: any;
}

export default function Welcome() {
    const { props } = usePage<PageProps>();
    const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
    const [selectedStores, setSelectedStores] = useState<string[]>([]);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationInput, setLocationInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Check if user has saved location on first visit
    useEffect(() => {
        const savedLocation = localStorage.getItem('barffoods_user_location');
        
        if (!savedLocation) {
            // First visit - show modal after a short delay for better UX
            const timer = setTimeout(() => {
                setShowLocationModal(true);
                toast.info('📍 Help us find stores near you!', {
                    duration: 5000,
                });
            }, 1500);
            
            return () => clearTimeout(timer);
        } else {
            // Use saved location
            const location = JSON.parse(savedLocation);
            
            // Update page data with saved location if it's different from default
            if (location.latitude !== props.userLocation.latitude || 
                location.longitude !== props.userLocation.longitude) {
                router.get('/', {
                    latitude: location.latitude,
                    longitude: location.longitude
                }, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true
                });
            }
        }
    }, []);

    // Search and save location
    const saveLocation = async () => {
        if (!locationInput.trim()) {
            toast.error('Please enter your location');
            return;
        }

        setIsSearching(true);

        try {
            // Geocode the location
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: locationInput,
                    format: 'json',
                    limit: 1,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': 'BarfFoods-Store-Locator'
                }
            });

            if (response.data && response.data.length > 0) {
                const location = response.data[0];
                const lat = parseFloat(location.lat);
                const lng = parseFloat(location.lon);

                // Save to localStorage
                const locationData = {
                    latitude: lat,
                    longitude: lng,
                    address: location.display_name,
                    savedAt: new Date().toISOString()
                };
                localStorage.setItem('barffoods_user_location', JSON.stringify(locationData));

                // Update page with new location
                router.get('/', {
                    latitude: lat,
                    longitude: lng
                }, {
                    preserveState: false,
                    preserveScroll: false,
                    replace: true,
                    onSuccess: () => {
                        setShowLocationModal(false);
                        toast.success(`✅ Location saved: ${location.display_name}`);
                    }
                });
            } else {
                toast.error('Location not found. Please try a different address.');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            toast.error('Failed to find location. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    // Skip and use default location
    const skipLocationSetup = () => {
        const defaultLocation = {
            latitude: 40.7128,
            longitude: -74.0060,
            address: 'New York, NY (Default)',
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('barffoods_user_location', JSON.stringify(defaultLocation));
        setShowLocationModal(false);
        toast.info('Using default location. You can update it anytime from the map.');
    };

    // Use browser geolocation
    const useAutoDetect = () => {
        setIsSearching(true);
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Save to localStorage
                const locationData = {
                    latitude: lat,
                    longitude: lng,
                    address: 'Auto-detected location',
                    savedAt: new Date().toISOString()
                };
                localStorage.setItem('barffoods_user_location', JSON.stringify(locationData));

                // Update page
                router.get('/', {
                    latitude: lat,
                    longitude: lng
                }, {
                    preserveState: false,
                    preserveScroll: false,
                    replace: true,
                    onSuccess: () => {
                        setShowLocationModal(false);
                        toast.success('✅ Location detected and saved!');
                        setIsSearching(false);
                    }
                });
            },
            (error) => {
                setIsSearching(false);
                toast.error('Could not detect location. Please enter it manually.');
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    return (
        <>
            <Head title="BarfFoods - Fresh Groceries Delivered">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            
            <LocationProvider
                initialLocation={props.userLocation}
                initialNearbyStores={props.nearbyStores}
                initialAllStores={props.allStores}
            >
                <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
                {/* First Visit Location Modal */}
                {showLocationModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Close button */}
                            <button
                                onClick={skipLocationSetup}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Skip for now"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>

                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                                    <MapPin className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    Welcome to BarfFoods! 🎉
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Help us find the best stores near you
                                </p>
                            </div>

                            {/* Location Input */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Enter your location
                                    </label>
                                    <input
                                        type="text"
                                        value={locationInput}
                                        onChange={(e) => setLocationInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && saveLocation()}
                                        placeholder="e.g., 7856 Richmond Hwy, Alexandria, VA 22306"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        disabled={isSearching}
                                        autoFocus
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        We'll save this and use it to show you nearby stores
                                    </p>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={saveLocation}
                                    disabled={isSearching || !locationInput.trim()}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                                >
                                    {isSearching ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Finding location...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="h-5 w-5" />
                                            <span>Save Location</span>
                                        </>
                                    )}
                                </button>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                                    </div>
                                </div>

                                {/* Auto-detect Button */}
                                <button
                                    onClick={useAutoDetect}
                                    disabled={isSearching}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                                >
                                    <NavigationIcon className="h-5 w-5" />
                                    <span>Auto-Detect My Location</span>
                                </button>

                                {/* Skip Button */}
                                <button
                                    onClick={skipLocationSetup}
                                    className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                                >
                                    Skip for now
                                </button>
                            </div>

                            {/* Privacy Note */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    🔒 Your location is stored locally on your device and can be updated anytime from the store map below.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                <Navigation />
                
                
                {/* Hero Carousel */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-6">
                    <HeroCarousel />
                </section>

                {/* Features Section */}
                <FeaturesSection />

                {/* Shop By Category */}
                <ShopByCategory 
                    onCategorySelect={setSelectedCategory} 
                    selectedCategory={selectedCategory}
                />

                {/* Shop By Store */}
                <ShopByStore 
                    onStoreSelect={(storeName) => {
                        setSelectedStores(prev => 
                            prev.includes(storeName) 
                                ? prev.filter(s => s !== storeName)
                                : [...prev, storeName]
                        );
                    }}
                    selectedStores={selectedStores}
                />

                {/* Product Section */}
                <div id="products">
                    <ProductSection 
                        nearbyStores={props.nearbyStores}
                        allStores={props.allStores}
                        initialProducts={props.products}
                        initialCategories={props.categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        externalSelectedStores={selectedStores}
                        onStoresChange={setSelectedStores}
                    />
                </div>
                
                {/* Store Locations & Delivery Zones */}
                <StoreLocationsMap defaultMapLocation={props.defaultMapLocation} />
                
                {/* Footer */}
                <Footer />
                </div>
            </LocationProvider>
        </>
    );
}