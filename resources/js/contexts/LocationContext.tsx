import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  delivery_radius: number;
  min_order_amount: number;
  delivery_fee: number;
  distance?: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationContextType {
  userLocation: UserLocation | null;
  nearbyStores: Store[];
  allStores: Store[];
  isLoading: boolean;
  error: string | null;
  setUserLocation: (location: UserLocation) => void;
  refreshStores: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ 
  children, 
  initialLocation, 
  initialNearbyStores, 
  initialAllStores 
}: {
  children: ReactNode;
  initialLocation?: UserLocation;
  initialNearbyStores?: Store[];
  initialAllStores?: Store[];
}) {
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(initialLocation || null);
  const [nearbyStores, setNearbyStores] = useState<Store[]>(initialNearbyStores || []);
  const [allStores, setAllStores] = useState<Store[]>(initialAllStores || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stores when location changes
  const fetchStores = async (location: UserLocation) => {
    if (!location || !location.latitude || !location.longitude) {
      // console.warn('Invalid location provided to fetchStores');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch nearby stores
      const response = await axios.get('/api/stores/nearby', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius: 25
        },
        timeout: 30000 // 30 second timeout
      });

      const stores = response.data.map((store: any) => ({
        id: store.id.toString(),
        name: store.name,
        address: store.address,
        phone: store.phone,
        latitude: parseFloat(store.latitude),
        longitude: parseFloat(store.longitude),
        delivery_radius: store.delivery_radius,
        min_order_amount: store.min_order_amount,
        delivery_fee: store.delivery_fee,
        distance: store.distance
      }));

      setNearbyStores(stores);
      
      // Fetch all stores with distances
      const allResponse = await axios.get('/api/stores', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        timeout: 30000 // 30 second timeout
      });

      const allStoresData = allResponse.data.map((store: any) => ({
        id: store.id.toString(),
        name: store.name,
        address: store.address,
        phone: store.phone,
        latitude: parseFloat(store.latitude),
        longitude: parseFloat(store.longitude),
        delivery_radius: store.delivery_radius,
        min_order_amount: store.min_order_amount,
        delivery_fee: store.delivery_fee,
        distance: store.distance
      }));

      setAllStores(allStoresData);
      
      // console.log(`Loaded ${stores.length} nearby stores and ${allStoresData.length} total stores`);
    } catch (err) {
      const errorMsg = axios.isAxiosError(err) 
        ? (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Failed to load stores')
        : 'Failed to load stores';
      
      setError(errorMsg);
      toast.error(errorMsg);
      // console.error('Error fetching stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh stores manually
  const refreshStores = async () => {
    if (userLocation) {
      await fetchStores(userLocation);
    } else {
      toast.error('No location set. Please set your location first.');
    }
  };

  // Update location and fetch stores
  const setUserLocation = (location: UserLocation) => {
    // Validate location
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      // console.error('Invalid location data:', location);
      toast.error('Invalid location data');
      return;
    }

    if (location.latitude < -90 || location.latitude > 90) {
      // console.error('Invalid latitude:', location.latitude);
      toast.error('Invalid latitude value');
      return;
    }

    if (location.longitude < -180 || location.longitude > 180) {
      // console.error('Invalid longitude:', location.longitude);
      toast.error('Invalid longitude value');
      return;
    }

    setUserLocationState(location);
    
    // Save to localStorage
    localStorage.setItem('barffoods_user_location', JSON.stringify(location));
    
    // Fetch stores for new location
    fetchStores(location);
  };

  // Initialize with saved location if no initial location provided
  useEffect(() => {
    if (!initialLocation) {
      const savedLocation = localStorage.getItem('barffoods_user_location');
      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          setUserLocationState(location);
          fetchStores(location);
        } catch (err) {
          // console.error('Error parsing saved location:', err);
          localStorage.removeItem('barffoods_user_location');
        }
      }
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        nearbyStores,
        allStores,
        isLoading,
        error,
        setUserLocation,
        refreshStores
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
