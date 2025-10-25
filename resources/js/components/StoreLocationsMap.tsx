import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Phone, CheckCircle, XCircle, Store, Truck } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  coordinates: [number, number]; // [lat, lng]
  features: string[];
  distance?: number; // Distance from user location
  delivery_radius?: number;
  min_order_amount?: number;
  delivery_fee?: number;
}

interface DeliveryZone {
  id: string;
  name: string;
  coordinates: [number, number][]; // Polygon coordinates
  deliveryTime: string;
  minOrder: number;
  deliveryFee: number;
}

interface DefaultMapLocation {
  latitude: number;
  longitude: number;
  address: string;
  zoom: number;
}

interface StoreLocationsMapProps {
  defaultMapLocation?: DefaultMapLocation;
}

export default function StoreLocationsMap({ defaultMapLocation }: StoreLocationsMapProps = { defaultMapLocation: undefined }) {
  // Use system settings default location or fallback to New York
  const DEFAULT_LOCATION: DefaultMapLocation = defaultMapLocation || {
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'New York, NY',
    zoom: 13
  };

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [savedLocationInfo, setSavedLocationInfo] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Fetch stores from API
  const fetchNearbyStores = async (userCoords: [number, number], mapInstance?: L.Map) => {
    try {
      const response = await axios.get('/api/stores/nearby', {
        params: {
          latitude: userCoords[0],
          longitude: userCoords[1],
          radius: 25
        }
      });
      
      const stores = response.data.map((store: any) => ({
        id: store.id.toString(),
        name: store.name,
        address: store.address,
        phone: store.phone,
        hours: 'Mon-Sun: 7AM-10PM', // Default hours
        coordinates: [parseFloat(store.latitude), parseFloat(store.longitude)],
        features: ['Parking', 'Pickup', 'Fresh Produce'], // Default features
        distance: store.distance,
        delivery_radius: store.delivery_radius,
        min_order_amount: store.min_order_amount,
        delivery_fee: store.delivery_fee
      }));
      
      setNearbyStores(stores);
      
      // Use provided map instance or fallback to state
      const targetMap = mapInstance || leafletMap;
      if (targetMap) {
        // Ensure map is ready before adding markers
        targetMap.whenReady(() => {
          addStoreMarkers(stores, targetMap);
        });
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to load nearby stores. Please try again.');
    }
  };

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);

  // Load saved location info on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('barffoods_user_location');
    if (savedLocation) {
      setSavedLocationInfo(JSON.parse(savedLocation));
    }
  }, []);

  // Function to search location by address using Nominatim (OpenStreetMap geocoding)
  const searchLocation = async () => {
    if (!locationInput.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setIsSearching(true);
    setLocationError(null);

    try {
      // Use Nominatim API for geocoding (free, no API key needed)
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
        const userCoords: [number, number] = [lat, lng];

        setUserLocation(userCoords);

        if (leafletMap) {
          leafletMap.setView(userCoords, 13);

          // Update URL with searched location
          router.get('/', {
            latitude: lat,
            longitude: lng
          }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
          });

          // Remove existing user marker
          if (userMarkerRef.current) {
            leafletMap.removeLayer(userMarkerRef.current);
          }

          // Add new user location marker
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div class="w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg animate-pulse">
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userMarkerRef.current = L.marker(userCoords, {
            icon: userIcon,
            title: 'Searched Location'
          }).addTo(leafletMap);

          userMarkerRef.current.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-green-600">📍 ${location.display_name}</h3>
              <p class="text-sm text-gray-600">Lat: ${lat.toFixed(4)}</p>
              <p class="text-sm text-gray-600">Lng: ${lng.toFixed(4)}</p>
            </div>
          `);

          // Fetch nearby stores
          fetchNearbyStores(userCoords);

          toast.success(`Location found: ${location.display_name}`);
        }
      } else {
        toast.error('Location not found. Please try a different address.');
        setLocationError('Location not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to search location. Please try again.');
      setLocationError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Function to manually detect user location (refresh location)
  const detectUserLocation = () => {
    if (!leafletMap) return;
    
    setIsDetectingLocation(true);
    setLocationError(null);

    if (navigator.geolocation) {
      // Check if we have permissions first
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'denied') {
            toast.error('Location access denied. Please enable location permissions in your browser settings.');
            setLocationError('Location permissions denied');
            setIsDetectingLocation(false);
            return;
          }
        });
      }

      toast.info('Detecting your location...', { duration: 2000 });

      // Try high accuracy first - NO CACHE for manual refresh
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const userCoords: [number, number] = [latitude, longitude];
          
          setUserLocation(userCoords);
          
          // Update map center
          leafletMap.setView(userCoords, 13);
          
          // Update URL with detected location to refresh page data
          router.get('/', {
            latitude: latitude,
            longitude: longitude
          }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
          });

          // Remove existing user marker
          if (userMarkerRef.current) {
            leafletMap.removeLayer(userMarkerRef.current);
          }

          // Add new user location marker
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div class="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse">
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userMarkerRef.current = L.marker(userCoords, {
            icon: userIcon,
            title: 'Your Location'
          }).addTo(leafletMap);

          userMarkerRef.current.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-blue-600">📍 Your Location</h3>
              <p class="text-sm text-gray-600">Lat: ${latitude.toFixed(4)}</p>
              <p class="text-sm text-gray-600">Lng: ${longitude.toFixed(4)}</p>
              <p class="text-xs text-gray-500 mt-1">Accuracy: ${Math.round(accuracy)}m</p>
            </div>
          `);

          // Fetch nearby stores for the new location
          fetchNearbyStores(userCoords);

          toast.success(`Location detected! Accuracy: ${Math.round(accuracy)}m`);
          setIsDetectingLocation(false);
        },
        (error) => {
          let errorMessage = 'Unable to detect your location';
          
          // Provide specific, helpful error messages
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
              toast.error(errorMessage);
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Please ensure location services are enabled on your device.';
              toast.error(errorMessage);
              break;
            case error.TIMEOUT:
              toast.warning('GPS taking too long, trying network location...', { duration: 2000 });
              // Fallback to low accuracy mode
              setTimeout(() => detectUserLocationLowAccuracy(), 500);
              return;
          }
          
          console.warn('Geolocation error:', error.message);
          setLocationError(errorMessage);
          setIsDetectingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 25000, // 25 seconds for GPS
          maximumAge: 0 // NO CACHE - always get fresh location on manual refresh
        }
      );
    } else {
      const errorMessage = 'Geolocation is not supported by this browser.';
      toast.error(errorMessage);
      setLocationError(errorMessage);
      setIsDetectingLocation(false);
    }
  };

  // Fallback method with lower accuracy for faster results (network/WiFi location)
  const detectUserLocationLowAccuracy = () => {
    if (!leafletMap || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const userCoords: [number, number] = [latitude, longitude];
        
        setUserLocation(userCoords);
        leafletMap.setView(userCoords, 13);
        
        router.get('/', {
          latitude: latitude,
          longitude: longitude
        }, {
          preserveState: true,
          preserveScroll: true,
          replace: true
        });

        // Remove existing user marker
        if (userMarkerRef.current) {
          leafletMap.removeLayer(userMarkerRef.current);
        }

        // Add new user location marker
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div class="w-6 h-6 bg-orange-500 rounded-full border-3 border-white shadow-lg animate-pulse">
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        userMarkerRef.current = L.marker(userCoords, {
          icon: userIcon,
          title: 'Your Location (Network-based)'
        }).addTo(leafletMap);

        userMarkerRef.current.bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-orange-600">📍 Your Location (Network-based)</h3>
            <p class="text-sm text-gray-600">Lat: ${latitude.toFixed(4)}</p>
            <p class="text-sm text-gray-600">Lng: ${longitude.toFixed(4)}</p>
            <p class="text-xs text-gray-500 mt-1">Accuracy: ~${Math.round(accuracy)}m</p>
          </div>
        `);

        fetchNearbyStores(userCoords);
        setLocationError(null);
        setIsDetectingLocation(false);
        
        toast.success(`Location detected using network. Accuracy: ~${Math.round(accuracy)}m`);
      },
      (error) => {
        console.warn('Low accuracy geolocation also failed:', error.message);
        
        const errorMsg = 'Could not detect your location. Please ensure:\n• Location services are enabled\n• Browser has location permission\n• You have internet connection';
        toast.error('Location detection failed', {
          description: error.code === error.TIMEOUT 
            ? 'Timeout expired. Location services may be disabled or unavailable.' 
            : `Using default location (${DEFAULT_LOCATION.address}). You can manually refresh when ready.`,
          duration: 5000
        });
        
        setLocationError('Location detection failed. Using default location.');
        setIsDetectingLocation(false);
        
        // Use default location as final fallback
        const defaultLocation: [number, number] = [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude];
        setUserLocation(defaultLocation);
        fetchNearbyStores(defaultLocation);
      },
      {
        enableHighAccuracy: false, // Network/WiFi location (faster, less accurate)
        timeout: 15000, // Increased to 15 seconds
        maximumAge: 0 // NO CACHE - fresh location
      }
    );
  };

  // Initialize Leaflet Map and get user location
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude], DEFAULT_LOCATION.zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    setLeafletMap(map);
    setMapLoaded(true);

    // Check for saved location from first-visit modal
    const savedLocation = localStorage.getItem('barffoods_user_location');
    
    if (savedLocation) {
      // Use saved location from localStorage
      const locationData = JSON.parse(savedLocation);
      const userCoords: [number, number] = [locationData.latitude, locationData.longitude];
      
      setUserLocation(userCoords);
      map.setView(userCoords, 13);
      
      // Add user location marker
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg animate-pulse">
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      userMarkerRef.current = L.marker(userCoords, {
        icon: userIcon,
        title: 'Your Saved Location'
      }).addTo(map);

      userMarkerRef.current.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-green-600">📍 Your Saved Location</h3>
          <p class="text-sm text-gray-600">${locationData.address}</p>
          <p class="text-xs text-gray-500 mt-1">Click "Update" below to change</p>
        </div>
      `);

      fetchNearbyStores(userCoords, map);
      console.log(`Using saved location: ${locationData.address}`);
    } else {
      // Use default location - user will be prompted by the first-visit modal
      const defaultLocation: [number, number] = [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude];
      setUserLocation(defaultLocation);
      fetchNearbyStores(defaultLocation, map);
      console.log(`No saved location, using default (${DEFAULT_LOCATION.address}). First-visit modal will prompt user.`);
    }

    // Cleanup function
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };


  // Add store markers to Leaflet Map
  const addStoreMarkers = (storesToMark: Store[], map: L.Map) => {
    // Comprehensive map validation
    if (!map) {
      console.warn('Map instance is null');
      return;
    }

    const container = map.getContainer();
    if (!container) {
      console.warn('Map container is null');
      return;
    }

    // Check if container is in the DOM
    if (!document.body.contains(container)) {
      console.warn('Map container is not in the DOM');
      return;
    }

    // Check if map is ready
    if (!map.getPane('overlayPane')) {
      console.warn('Map panes not initialized yet');
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try {
        if (map && marker) {
          map.removeLayer(marker);
        }
      } catch (e) {
        console.warn('Error removing marker:', e);
      }
    });
    markersRef.current = [];

    storesToMark.forEach((store) => {
      try {
        // Validate store coordinates
        if (!store.coordinates || store.coordinates.length !== 2) {
          console.warn('Invalid coordinates for store:', store.name);
          return;
        }

        const lat = parseFloat(String(store.coordinates[0]));
        const lng = parseFloat(String(store.coordinates[1]));
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn('Invalid lat/lng for store:', store.name);
          return;
        }

        // Create custom icon
        const customIcon = L.divIcon({
          className: 'custom-store-marker',
          html: `
            <div class="w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 ${
              selectedStore?.id === store.id ? 'bg-green-500' : 'bg-red-500'
            }">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z"/>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        // Create marker
        const marker = L.marker([lat, lng], {
          icon: customIcon,
          title: store.name
        });

        // Add marker to map only if map is still valid
        if (map && map.getContainer() && document.body.contains(map.getContainer())) {
          marker.addTo(map);

          // Create popup content
          const popupContent = `
            <div class="p-3">
              <h3 class="font-semibold text-gray-900 mb-2">${store.name}</h3>
              <div class="space-y-1 text-sm text-gray-600">
                <p>📍 ${store.address}</p>
                <p>📞 ${store.phone}</p>
                <p>🕒 ${store.hours}</p>
                <p class="font-medium text-blue-600">${store.distance ? store.distance.toFixed(1) : '0.0'} miles away</p>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);

          // Add click event
          marker.on('click', () => {
            setSelectedStore(store);
          });

          markersRef.current.push(marker);
        }
      } catch (error) {
        console.error('Error adding marker for store:', store.name, error);
      }
    });

    console.log(`Successfully added ${markersRef.current.length} store markers`);
  };

  // Check if user is in delivery zone based on nearby stores
  const isInDeliveryZone = (userCoords: [number, number]): DeliveryZone | null => {
    // Find the closest store within delivery radius
    for (const store of nearbyStores) {
      if (store.distance && store.delivery_radius && store.distance <= store.delivery_radius) {
        return {
          id: `zone-${store.id}`,
          name: `${store.name} Delivery Zone`,
          coordinates: [], // Not needed for this check
          deliveryTime: '1-3 hours',
          minOrder: store.min_order_amount || 25,
          deliveryFee: store.delivery_fee || 5.99
        };
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your location...</p>
          </div>
        </div>
      </section>
    );
  }

  const currentZone = userLocation ? isInDeliveryZone(userLocation) : null;

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Store Locations & Delivery Zones
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find stores near you and check delivery availability in your area
          </p>
        </div>

        {/* Interactive Map - Landscape Layout */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="h-96 relative">
            {/* Leaflet Map Container */}
            <div
              ref={mapRef}
              className="w-full h-full relative"
              style={{ minHeight: '384px' }}
            >
              {/* Loading State */}
              {!leafletMap && mapLoaded && (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
                  </div>
                </div>
              )}
              
              {/* Fallback Map - Static Image with Overlays */}
              {false && (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                  {/* Map Background Pattern */}
                  <div className="absolute inset-0 opacity-30">
                    <svg className="w-full h-full" viewBox="0 0 400 300">
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" className="text-gray-400"/>
                    </svg>
                  </div>

                  {/* User Location Indicator */}
                  {userLocation && (
                    <div 
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{
                        left: '50%',
                        top: '50%'
                      }}
                    >
                      <div className="relative">
                        <div className="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-medium">
                          You are here
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Store Locations Overlay */}
                  {userLocation && nearbyStores.map((store: Store, index: number) => {
                    // Calculate position relative to user location
                    const userLat = userLocation![0];
                    const userLng = userLocation![1];
                    const storeLat = store.coordinates[0];
                    const storeLng = store.coordinates[1];
                    
                    // Convert to map position (simplified positioning)
                    const latDiff = storeLat - userLat;
                    const lngDiff = storeLng - userLng;
                    
                    // Scale to map coordinates
                    const x = 50 + (lngDiff * 2000); // Scale longitude
                    const y = 50 + (latDiff * 2000); // Scale latitude
                    
                    // Ensure markers stay within bounds
                    const clampedX = Math.max(15, Math.min(85, x));
                    const clampedY = Math.max(15, Math.min(85, y));
                    
                    return (
                      <div
                        key={store.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
                        style={{
                          left: `${clampedX}%`,
                          top: `${clampedY}%`
                        }}
                        onClick={() => setSelectedStore(store)}
                      >
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                            selectedStore?.id === store.id ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            <Store className="w-4 h-4 text-white" />
                          </div>
                          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-200">
                            {store.name}
                          </div>
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded border shadow-sm font-medium">
                            {store.distance ? store.distance.toFixed(1) : '0.0'} mi
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Delivery Zone Overlay */}
                  {currentZone && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-3 border-green-400 border-dashed rounded-lg bg-green-100 dark:bg-green-900/20 opacity-60">
                        <div className="absolute top-3 left-3 bg-green-500 text-white text-sm px-3 py-1 rounded font-medium">
                          {currentZone!.name}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Map Legend */}
                  <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg text-sm">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Your Location</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Store</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 border-2 border-green-400 border-dashed rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Delivery Zone</span>
                      </div>
                    </div>
                  </div>

                  {/* Map Info */}
                  <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg text-sm">
                    <div className="text-gray-600 dark:text-gray-400">
                      <div className="font-semibold text-gray-900 dark:text-white">Interactive Map</div>
                      <div className="text-xs">Click stores to view details</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Loading State */}
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Search Input - Above Store Information */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search Location</h3>
          </div>
          
          {savedLocationInfo && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    📍 Saved Location
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    {savedLocationInfo.address}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to remove your saved location?')) {
                      localStorage.removeItem('barffoods_user_location');
                      setSavedLocationInfo(null);
                      toast.info('Saved location removed. You can set a new one below.');
                    }
                  }}
                  className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              placeholder={savedLocationInfo ? "Update your location..." : "Enter address, city, or ZIP code..."}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isSearching}
            />
            <button
              onClick={searchLocation}
              disabled={isSearching || !locationInput.trim()}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span>{savedLocationInfo ? 'Update' : 'Search'}</span>
                </>
              )}
            </button>
            <button
              onClick={detectUserLocation}
              disabled={isDetectingLocation}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
              title="Use my current location"
            >
              {isDetectingLocation ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Auto-Detect</span>
            </button>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {savedLocationInfo 
              ? 'Update your saved location or use Auto-Detect to refresh'
              : 'Enter an address or click "Auto-Detect" to use your current location'}
          </p>
        </div>

        {/* Store Information - Below Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Location Status */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <Navigation className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Location</h3>
            </div>
            
            {userLocation && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Location: {userLocation[0].toFixed(2)}, {userLocation[1].toFixed(2)}
                </p>
                
                {/* Delivery Zone Status */}
                <div className="flex items-center space-x-2">
                  {currentZone ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        Delivery Available: {currentZone.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">
                        Delivery Not Available
                      </span>
                    </>
                  )}
                </div>

                {currentZone && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Delivery Time: {currentZone.deliveryTime}</p>
                    <p>Min Order: ${currentZone.minOrder}</p>
                    <p>Delivery Fee: {currentZone.deliveryFee === 0 ? 'Free' : `$${currentZone.deliveryFee}`}</p>
                  </div>
                )}
              </div>
            )}

            {/* Location Error */}
            {locationError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{locationError}</p>
              </div>
            )}
          </div>

          {/* Selected Store Details */}
          {selectedStore && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Store className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Selected Store</h3>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {selectedStore.name}
                </h4>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedStore.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{selectedStore.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{selectedStore.hours}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {selectedStore.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-400 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nearby Stores List */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Stores Near You
            </h3>
            
            <div className="space-y-3">
              {nearbyStores.map((store) => (
                <div
                  key={store.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStore?.id === store.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
                  }`}
                  onClick={() => setSelectedStore(store)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {store.name}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {store.distance ? store.distance.toFixed(1) : '0.0'} mi
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{store.address}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
