import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Phone, CheckCircle, XCircle, Store, Truck } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
}

interface DeliveryZone {
  id: string;
  name: string;
  coordinates: [number, number][]; // Polygon coordinates
  deliveryTime: string;
  minOrder: number;
  deliveryFee: number;
}

export default function StoreLocationsMap() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Mock data - in a real app, this would come from an API
  const stores: Store[] = [
    {
      id: '1',
      name: 'Downtown Store',
      address: '123 Main St, Downtown',
      phone: '(555) 123-4567',
      hours: 'Mon-Sun: 7AM-10PM',
      coordinates: [40.7128, -74.0060], // NYC coordinates
      features: ['Parking', 'Pickup', 'Fresh Produce']
    },
    {
      id: '2',
      name: 'Mall Location',
      address: '456 Mall Ave, Shopping Center',
      phone: '(555) 234-5678',
      hours: 'Mon-Sun: 8AM-9PM',
      coordinates: [40.7589, -73.9851],
      features: ['Mall Access', 'Parking', 'Express Checkout']
    },
    {
      id: '3',
      name: 'Suburban Branch',
      address: '789 Suburb St, Suburban',
      phone: '(555) 345-6789',
      hours: 'Mon-Sun: 6AM-11PM',
      coordinates: [40.7505, -73.9934],
      features: ['Large Parking', 'Drive-thru', 'Bulk Items']
    },
    {
      id: '4',
      name: 'Express Store',
      address: '321 Quick Lane, Express',
      phone: '(555) 456-7890',
      hours: 'Mon-Sun: 24/7',
      coordinates: [40.7614, -73.9776],
      features: ['24/7', 'Quick Checkout', 'Grab & Go']
    }
  ];

  const deliveryZones: DeliveryZone[] = [
    {
      id: '1',
      name: 'Downtown Zone',
      coordinates: [
        [40.7000, -74.0200],
        [40.7200, -74.0200],
        [40.7200, -73.9900],
        [40.7000, -73.9900]
      ],
      deliveryTime: '2-4 hours',
      minOrder: 50,
      deliveryFee: 0
    },
    {
      id: '2',
      name: 'Mall Area Zone',
      coordinates: [
        [40.7400, -74.0000],
        [40.7700, -74.0000],
        [40.7700, -73.9700],
        [40.7400, -73.9700]
      ],
      deliveryTime: '1-3 hours',
      minOrder: 75,
      deliveryFee: 5
    }
  ];

  // Function to detect user location
  const detectUserLocation = () => {
    if (!leafletMap) return;
    
    setIsDetectingLocation(true);
    setLocationError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          findNearbyStores([latitude, longitude], leafletMap);
          
          // Update map center
          leafletMap.setView([latitude, longitude], 13);
          
          // Add user location marker
          if (userMarkerRef.current) {
            leafletMap.removeLayer(userMarkerRef.current);
          }
          
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div class="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse">
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userMarkerRef.current = L.marker([latitude, longitude], {
            icon: userIcon,
            title: 'Your Location'
          }).addTo(leafletMap);

          userMarkerRef.current.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-blue-600">📍 Your Location</h3>
              <p class="text-sm text-gray-600">Lat: ${latitude.toFixed(4)}</p>
              <p class="text-sm text-gray-600">Lng: ${longitude.toFixed(4)}</p>
            </div>
          `);

          setIsDetectingLocation(false);
        },
        (error) => {
          let errorMessage = 'Unable to detect your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please allow location access in your browser.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setLocationError(errorMessage);
          setIsDetectingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      setIsDetectingLocation(false);
    }
  };

  // Initialize Leaflet Map and get user location
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([40.7128, -74.0060], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    setLeafletMap(map);
    setMapLoaded(true);

    // Set default location immediately
    const defaultLocation: [number, number] = [40.7128, -74.0060];
    setUserLocation(defaultLocation);
    findNearbyStores(defaultLocation, map);

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

  // Find stores near user location
  const findNearbyStores = (userCoords: [number, number], map?: L.Map) => {
    const nearby = stores
      .map(store => ({
        ...store,
        distance: calculateDistance(userCoords[0], userCoords[1], store.coordinates[0], store.coordinates[1])
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3); // Show top 3 nearest stores

    setNearbyStores(nearby);
    
    // Add markers to Leaflet Map
    if (map) {
      addStoreMarkers(nearby, map);
    }
  };

  // Add store markers to Leaflet Map
  const addStoreMarkers = (storesToMark: Store[], map: L.Map) => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    storesToMark.forEach((store) => {
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
      const marker = L.marker([store.coordinates[0], store.coordinates[1]], {
        icon: customIcon,
        title: store.name
      }).addTo(map);

      // Create popup content
      const popupContent = `
        <div class="p-3">
          <h3 class="font-semibold text-gray-900 mb-2">${store.name}</h3>
          <div class="space-y-1 text-sm text-gray-600">
            <p>📍 ${store.address}</p>
            <p>📞 ${store.phone}</p>
            <p>🕒 ${store.hours}</p>
            <p class="font-medium text-blue-600">${store.distance?.toFixed(1)} miles away</p>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click event
      marker.on('click', () => {
        setSelectedStore(store);
      });

      markersRef.current.push(marker);
    });
  };

  // Check if user is in delivery zone
  const isInDeliveryZone = (userCoords: [number, number]): DeliveryZone | null => {
    // Simple bounding box check - in a real app, you'd use proper polygon intersection
    for (const zone of deliveryZones) {
      const [minLat, minLon] = zone.coordinates[0];
      const [maxLat, maxLon] = zone.coordinates[2];
      
      if (userCoords[0] >= minLat && userCoords[0] <= maxLat &&
          userCoords[1] >= minLon && userCoords[1] <= maxLon) {
        return zone;
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
              {/* Fallback Map - Static Image with Overlays */}
              {!leafletMap && mapLoaded && (
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
                  {userLocation && stores.map((store, index) => {
                    // Calculate position relative to user location
                    const userLat = userLocation[0];
                    const userLng = userLocation[1];
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
                          {currentZone.name}
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
                      <div className="text-xs text-yellow-600 mt-1">⚠️ Fallback mode - Loading Leaflet map...</div>
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

        {/* Store Information - Below Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Location Status */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Navigation className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Location</h3>
              </div>
              <button
                onClick={detectUserLocation}
                disabled={isDetectingLocation}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors flex items-center space-x-1"
              >
                {isDetectingLocation ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                    <span>Detecting...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="h-3 w-3" />
                    <span>Detect Location</span>
                  </>
                )}
              </button>
            </div>
            
            {userLocation && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Coordinates: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
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
