import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, CreditCard, MapPin, Phone, ShoppingBag, CheckCircle, ChevronRight, Search, MapPinIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import CustomerLayout from '@/layouts/customer-layout';

interface UserAddress {
    id: number;
    user_id: number;
    type: 'home' | 'work' | 'other';
    label: string;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    latitude?: number;
    longitude?: number;
    delivery_instructions?: string;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface DeliveryMethod {
    id: string;
    name: string;
    type: 'shipping' | 'fast_delivery';
    description: string;
    estimated_days: string;
    cost?: number;
}

interface Carrier {
    id: string;
    name: string;
    service: string;
    cost: number;
    delivery_days: string;
    description: string;
}

interface AddressSuggestion {
    id: string;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    formatted_address: string;
}

interface AddressAutocompleteState {
    streetSuggestions: AddressSuggestion[];
    citySuggestions: string[];
    stateSuggestions: string[];
    zipSuggestions: string[];
    showStreetDropdown: boolean;
    showCityDropdown: boolean;
    showStateDropdown: boolean;
    showZipDropdown: boolean;
    isLoading: boolean;
}

interface CheckoutPageProps {
    cartItems: any[];
    calculations: {
        subtotal: number;
        discount: number;
        delivery_fee: number;
        tax: number;
        total: number;
        discount_breakdown: any[];
        applied_discounts: any[];
        available_discounts: any[];
    };
    availablePaymentMethods: any[];
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
    };
    userAddresses: UserAddress[];
    defaultAddress?: UserAddress;
}

export default function CheckoutPage({ 
    cartItems, 
    calculations, 
    availablePaymentMethods, 
    user,
    userAddresses,
    defaultAddress
}: CheckoutPageProps) {
    const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState('shipping');
    const [selectedCarrier, setSelectedCarrier] = useState('');
    const [discountCode, setDiscountCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
    const [shippingConfigError, setShippingConfigError] = useState(false);
    
    // Address autocomplete state
    const [addressAutocomplete, setAddressAutocomplete] = useState<AddressAutocompleteState>({
        streetSuggestions: [],
        citySuggestions: [],
        stateSuggestions: [],
        zipSuggestions: [],
        showStreetDropdown: false,
        showCityDropdown: false,
        showStateDropdown: false,
        showZipDropdown: false,
        isLoading: false,
    });

            const { data, setData, post, processing, errors } = useForm({
                type: defaultAddress?.type || 'home',
                label: defaultAddress?.label || '',
                street_address: defaultAddress?.street_address || '',
                city: defaultAddress?.city || '',
                state: defaultAddress?.state || '',
                zip_code: defaultAddress?.zip_code || '',
                delivery_instructions: defaultAddress?.delivery_instructions || '',
                delivery_method: selectedDeliveryMethod,
                carrier: selectedCarrier,
                discount_code: discountCode,
                // Only keep delivery instructions
                shipping_instructions: '',
            });

    // Calculate delivery methods when address changes
    const calculateDeliveryMethods = async () => {
        if (!data.street_address || !data.city || !data.state || !data.zip_code) {
            return;
        }

        setIsCalculatingDelivery(true);
        
        try {
            const response = await fetch('/api/shipping/methods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    street_address: data.street_address,
                    city: data.city,
                    state: data.state,
                    zip_code: data.zip_code,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    setDeliveryMethods(result.delivery_methods || []);
                    setCarriers(result.carriers || []);
                    
                    // Check if we got empty arrays (EasyPost not configured)
                    if ((result.delivery_methods || []).length === 0 && (result.carriers || []).length === 0) {
                        setShippingConfigError(true);
                    } else {
                        setShippingConfigError(false);
                    }
                } else {
                    // Handle configuration errors
                    if (result.error_type === 'configuration_error') {
                        setShippingConfigError(true);
                        toast.error('Shipping service is not configured. Please contact support.');
                    } else {
                        setShippingConfigError(false);
                        toast.error(result.message || 'Failed to calculate delivery methods');
                    }
                }
            } else {
                const result = await response.json();
                if (result.error_type === 'configuration_error') {
                    setShippingConfigError(true);
                    toast.error('Shipping service is not configured. Please contact support.');
                } else {
                    setShippingConfigError(false);
                    toast.error(result.message || 'Failed to calculate delivery methods');
                }
            }
        } catch (error) {
            console.error('Failed to calculate delivery methods:', error);
            toast.error('Failed to calculate delivery methods');
        } finally {
            setIsCalculatingDelivery(false);
        }
    };

    // Load delivery methods on component mount
    useEffect(() => {
        // Only load delivery methods if address is complete
        if (data.street_address && data.city && data.state && data.zip_code) {
            calculateDeliveryMethods();
        }
    }, []);

    // Address autocomplete functions
    const fetchAddressSuggestions = async (query: string, type: 'street' | 'city' | 'state' | 'zip') => {
        if (query.length < 2) return;

        setAddressAutocomplete(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await fetch('/api/address/suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    query,
                    type,
                    street_address: data.street_address,
                    city: data.city,
                    state: data.state,
                    zip_code: data.zip_code,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    setAddressAutocomplete(prev => ({
                        ...prev,
                        [`${type}Suggestions`]: result.suggestions || [],
                        [`show${type.charAt(0).toUpperCase() + type.slice(1)}Dropdown`]: true,
                        isLoading: false,
                    }));
                }
            }
        } catch (error) {
            console.error('Address suggestions failed:', error);
            setAddressAutocomplete(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleStreetAddressChange = (value: string) => {
        setData('street_address', value);
        
        if (value.length >= 2) {
            fetchAddressSuggestions(value, 'street');
        } else {
            setAddressAutocomplete(prev => ({
                ...prev,
                showStreetDropdown: false,
                streetSuggestions: [],
            }));
        }
    };

    const handleCityChange = (value: string) => {
        setData('city', value);
        
        if (value.length >= 2) {
            fetchAddressSuggestions(value, 'city');
        } else {
            setAddressAutocomplete(prev => ({
                ...prev,
                showCityDropdown: false,
                citySuggestions: [],
            }));
        }
    };

    const handleStateChange = (value: string) => {
        setData('state', value);
        
        if (value.length >= 1) {
            fetchAddressSuggestions(value, 'state');
        } else {
            setAddressAutocomplete(prev => ({
                ...prev,
                showStateDropdown: false,
                stateSuggestions: [],
            }));
        }
    };

    const handleZipChange = (value: string) => {
        setData('zip_code', value);
        
        if (value.length >= 3) {
            fetchAddressSuggestions(value, 'zip');
        } else {
            setAddressAutocomplete(prev => ({
                ...prev,
                showZipDropdown: false,
                zipSuggestions: [],
            }));
        }
    };

    const selectAddressSuggestion = (suggestion: AddressSuggestion) => {
        setData('street_address', suggestion.street_address);
        setData('city', suggestion.city);
        setData('state', suggestion.state);
        setData('zip_code', suggestion.zip_code);
        
        setAddressAutocomplete(prev => ({
            ...prev,
            showStreetDropdown: false,
            showCityDropdown: false,
            showStateDropdown: false,
            showZipDropdown: false,
        }));
        
        // Trigger delivery method calculation
        calculateDeliveryMethods();
    };

    const selectCitySuggestion = (city: string) => {
        setData('city', city);
        setAddressAutocomplete(prev => ({
            ...prev,
            showCityDropdown: false,
        }));
    };

    const selectStateSuggestion = (state: string) => {
        setData('state', state);
        setAddressAutocomplete(prev => ({
            ...prev,
            showStateDropdown: false,
        }));
    };

    const selectZipSuggestion = (zip: string) => {
        setData('zip_code', zip);
        setAddressAutocomplete(prev => ({
            ...prev,
            showZipDropdown: false,
        }));
    };

    // Calculate delivery methods when address fields change
    useEffect(() => {
        const timer = setTimeout(() => {
            calculateDeliveryMethods();
        }, 1000); // Debounce for 1 second

        return () => clearTimeout(timer);
    }, [data.street_address, data.city, data.state, data.zip_code]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.address-dropdown-container')) {
                setAddressAutocomplete(prev => ({
                    ...prev,
                    showStreetDropdown: false,
                    showCityDropdown: false,
                    showStateDropdown: false,
                    showZipDropdown: false,
                }));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate final totals including delivery cost and shipping options
    const selectedCarrierInfo = carriers.find(carrier => carrier.id === selectedCarrier);
    const baseDeliveryCost = selectedCarrierInfo ? selectedCarrierInfo.cost : 0;
    
            // No shipping options costs - simplified checkout
            const shippingOptionsCost = 0;
    
    // Calculate total delivery cost based on method
    let totalDeliveryCost = 0;
    if (selectedDeliveryMethod === 'fast_delivery') {
        totalDeliveryCost = 12.99; // Fixed cost for fast delivery
    } else if (selectedDeliveryMethod === 'shipping' && selectedCarrierInfo && data.street_address && data.city && data.state && data.zip_code) {
        totalDeliveryCost = baseDeliveryCost + shippingOptionsCost;
    }
    
    const finalTotal = calculations.subtotal - calculations.discount + totalDeliveryCost + calculations.tax;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsProcessing(true);
        
        try {
            await post('/checkout', {
                onSuccess: (page) => {
                    toast.success('Order placed successfully!');
                    // Redirect to order confirmation page
                    window.location.href = `/orders/${page.props.order_id}`;
                },
                onError: (errors) => {
                    toast.error('Failed to place order. Please try again.');
                }
            });
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const applyDiscountCode = () => {
        if (discountCode.trim()) {
            toast.info('Discount code applied!', {
                description: 'Your discount has been applied to the order.'
            });
        } else {
            toast.error('Please enter a discount code');
        }
    };


    return (
        <CustomerLayout>
            <Head title="Checkout - BarfFoods" />
            
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0">
                    {/* Breadcrumb Navigation */}
                    <div className="mb-8">
                        <nav className="flex items-center space-x-2 text-sm text-gray-600">
                            <Link href="/cart" className="hover:text-gray-900">Cart</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-gray-900 font-medium">Shipping</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-gray-400">Payment</span>
                        </nav>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Shipping Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Shipping Address */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Address</h2>
                                
                                {/* Address Selection */}
                                {userAddresses.length > 0 && (
                                    <div className="mb-6">
                                        <Label htmlFor="address_selection">Select Saved Address</Label>
                                        <select 
                                            id="address_selection"
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onChange={(e) => {
                                                const selectedAddress = userAddresses.find(addr => addr.id === parseInt(e.target.value));
                                                if (selectedAddress) {
                                                    setData('type', selectedAddress.type);
                                                    setData('label', selectedAddress.label || '');
                                                    setData('street_address', selectedAddress.street_address);
                                                    setData('city', selectedAddress.city);
                                                    setData('state', selectedAddress.state);
                                                    setData('zip_code', selectedAddress.zip_code);
                                                    setData('delivery_instructions', selectedAddress.delivery_instructions || '');
                                                }
                                            }}
                                        >
                                            <option value="">Select a saved address...</option>
                                            {userAddresses.map((address) => (
                                                <option key={address.id} value={address.id}>
                                                    {address.label} - {address.street_address}, {address.city}, {address.state} {address.zip_code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Customer Info Display */}
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Customer Information</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">{user.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">{user.email}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">{user.phone || 'Not provided'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Fields */}
                                    <div className="space-y-4 address-dropdown-container">
                                        <div className="relative">
                                            <Label htmlFor="street_address">Street Address</Label>
                                            <div className="relative">
                                                <Input
                                                    id="street_address"
                                                    value={data.street_address}
                                                    onChange={(e) => handleStreetAddressChange(e.target.value)}
                                                    className="mt-1 pr-10"
                                                    placeholder="Enter street address"
                                                />
                                                {addressAutocomplete.isLoading && (
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Street Address Suggestions */}
                                            {addressAutocomplete.showStreetDropdown && addressAutocomplete.streetSuggestions.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {addressAutocomplete.streetSuggestions.map((suggestion) => (
                                                        <div
                                                            key={suggestion.id}
                                                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                                                            onClick={() => selectAddressSuggestion(suggestion)}
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <MapPinIcon className="w-4 h-4 text-gray-400" />
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{suggestion.street_address}</div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {suggestion.city}, {suggestion.state} {suggestion.zip_code}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {errors.street_address && (
                                                <p className="text-red-500 text-sm mt-1">{errors.street_address}</p>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="relative">
                                                <Label htmlFor="city">City</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="city"
                                                        value={data.city}
                                                        onChange={(e) => handleCityChange(e.target.value)}
                                                        className="mt-1 pr-10"
                                                        placeholder="Enter city"
                                                    />
                                                    {addressAutocomplete.isLoading && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* City Suggestions */}
                                                {addressAutocomplete.showCityDropdown && addressAutocomplete.citySuggestions.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                        {addressAutocomplete.citySuggestions.map((city, index) => (
                                                            <div
                                                                key={index}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => selectCitySuggestion(city)}
                                                            >
                                                                {city}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {errors.city && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                                                )}
                                            </div>
                                            
                                            <div className="relative">
                                                <Label htmlFor="state">State</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="state"
                                                        value={data.state}
                                                        onChange={(e) => handleStateChange(e.target.value)}
                                                        className="mt-1 pr-10"
                                                        placeholder="Enter state"
                                                    />
                                                    {addressAutocomplete.isLoading && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* State Suggestions */}
                                                {addressAutocomplete.showStateDropdown && addressAutocomplete.stateSuggestions.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                        {addressAutocomplete.stateSuggestions.map((state, index) => (
                                                            <div
                                                                key={index}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => selectStateSuggestion(state)}
                                                            >
                                                                {state}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {errors.state && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                                                )}
                                            </div>
                                            
                                            <div className="relative">
                                                <Label htmlFor="zip_code">Zip Code</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="zip_code"
                                                        value={data.zip_code}
                                                        onChange={(e) => handleZipChange(e.target.value)}
                                                        className="mt-1 pr-10"
                                                        placeholder="Enter zip code"
                                                    />
                                                    {addressAutocomplete.isLoading && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* ZIP Suggestions */}
                                                {addressAutocomplete.showZipDropdown && addressAutocomplete.zipSuggestions.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                        {addressAutocomplete.zipSuggestions.map((zip, index) => (
                                                            <div
                                                                key={index}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => selectZipSuggestion(zip)}
                                                            >
                                                                {zip}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {errors.zip_code && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.zip_code}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Type */}
                                    <div>
                                        <Label htmlFor="type">Address Type</Label>
                                        <select
                                            id="type"
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value as 'home' | 'work' | 'other')}
                                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="home">Home</option>
                                            <option value="work">Work</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {errors.type && (
                                            <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                                        )}
                                    </div>

                                    {/* Address Label */}
                                    <div>
                                        <Label htmlFor="label">Address Label (Optional)</Label>
                                        <Input
                                            id="label"
                                            value={data.label}
                                            onChange={(e) => setData('label', e.target.value)}
                                            className="mt-1"
                                            placeholder="e.g., My Home, Office"
                                        />
                                        {errors.label && (
                                            <p className="text-red-500 text-sm mt-1">{errors.label}</p>
                                        )}
                                    </div>


                                    {/* Delivery Instructions */}
                                    <div>
                                        <Label htmlFor="delivery_instructions">Delivery Instructions (Optional)</Label>
                                        <Textarea
                                            id="delivery_instructions"
                                            value={data.delivery_instructions}
                                            onChange={(e) => setData('delivery_instructions', e.target.value)}
                                            className="mt-1"
                                            rows={2}
                                            placeholder="Any special delivery instructions..."
                                        />
                                        {errors.delivery_instructions && (
                                            <p className="text-red-500 text-sm mt-1">{errors.delivery_instructions}</p>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Delivery Method */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Method</h2>
                                
                                {isCalculatingDelivery ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 text-gray-600">Calculating delivery options...</span>
                                    </div>
                                ) : deliveryMethods.length > 0 ? (
                                    <div className="space-y-6">
                                        {/* Delivery Method Selection */}
                                        <RadioGroup 
                                            value={selectedDeliveryMethod} 
                                            onValueChange={setSelectedDeliveryMethod}
                                            className="space-y-4"
                                        >
                                            {deliveryMethods.map((method) => (
                                                <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-all border-gray-200">
                                                    <RadioGroupItem value={method.id} id={method.id} />
                                                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium text-gray-900">{method.name}</div>
                                                                <div className="text-sm text-gray-600">{method.description}</div>
                                                                <div className="text-sm text-gray-500">Delivery: {method.estimated_days}</div>
                                                            </div>
                                                            {method.cost && (
                                                                <div className="font-medium text-gray-900">
                                                                    ${method.cost.toFixed(2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>

                                        {/* Shipping Options (only for shipping method) */}
                                        {selectedDeliveryMethod === 'shipping' && !(data.street_address && data.city && data.state && data.zip_code) && (
                                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-blue-800 text-sm">
                                                    Please complete your delivery address above to see shipping options and carriers.
                                                </p>
                                            </div>
                                        )}
                                        
                                        {selectedDeliveryMethod === 'shipping' && data.street_address && data.city && data.state && data.zip_code && (
                                            <div className="mt-6 space-y-6">
                                                {/* Carrier Selection */}
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Carrier</h3>
                                                    {carriers.length > 0 ? (
                                                        <RadioGroup 
                                                            value={selectedCarrier} 
                                                            onValueChange={setSelectedCarrier}
                                                            className="space-y-3"
                                                        >
                                                            {carriers.map((carrier) => (
                                                                <div key={carrier.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-all border-gray-200">
                                                                    <RadioGroupItem value={carrier.id} id={carrier.id} />
                                                                    <Label htmlFor={carrier.id} className="flex-1 cursor-pointer">
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                <div className="font-medium text-gray-900">{carrier.name} - {carrier.service}</div>
                                                                                <div className="text-sm text-gray-600">{carrier.description}</div>
                                                                                <div className="text-sm text-gray-500">Delivery: {carrier.delivery_days}</div>
                                                                            </div>
                                                                            <div className="font-medium text-gray-900">
                                                                                ${carrier.cost.toFixed(2)}
                                                                            </div>
                                                                        </div>
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500">
                                                            <p>Please enter your delivery address to see available carriers.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Delivery Instructions */}
                                                <div>
                                                    <Label htmlFor="shipping_instructions" className="text-sm font-medium text-gray-700">
                                                        Delivery Instructions (Optional)
                                                    </Label>
                                                    <Textarea
                                                        id="shipping_instructions"
                                                        placeholder="e.g., Leave at front door, Ring doorbell, etc."
                                                        className="mt-1"
                                                        rows={3}
                                                        onChange={(e) => setData('shipping_instructions', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        {shippingConfigError && data.street_address && data.city && data.state && data.zip_code ? (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <p className="text-yellow-800 text-sm">
                                                        <strong>Shipping Service Not Configured</strong><br/>
                                                        The shipping service is not currently available. Please contact support to enable shipping options.
                                                    </p>
                                                </div>
                                                <p className="text-gray-500 text-sm">
                                                    You can still proceed with local delivery options if available.
                                                </p>
                                            </div>
                                        ) : (
                                            <p>Please enter your delivery address to see available delivery options.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Cart Summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h2>
                                    
                                    {/* Cart Items */}
                                    <div className="space-y-4 mb-6">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="flex items-center space-x-3">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    {item.product.image && item.product.image.startsWith('http') ? (
                                                        <img
                                                            src={item.product.image}
                                                            alt={item.product.name}
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="text-2xl opacity-80">
                                                            {item.product.image || '📦'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 text-sm">
                                                        {item.product.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-600">
                                                        {item.product.category?.name || 'Category'}
                                                    </p>
                                                    <p className="font-medium text-gray-900">
                                                        ${typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price}
                                                    </p>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Qty: {item.quantity}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Discount Code */}
                                    <div className="mb-6">
                                        <Label htmlFor="discount_code">Discount Code</Label>
                                        <div className="flex mt-1">
                                            <Input
                                                id="discount_code"
                                                value={discountCode}
                                                onChange={(e) => setDiscountCode(e.target.value)}
                                                placeholder="Enter discount code"
                                                className="rounded-r-none"
                                            />
                                            <Button
                                                type="button"
                                                onClick={applyDiscountCode}
                                                className="rounded-l-none bg-gray-600 hover:bg-gray-700"
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Order Summary */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">${calculations.subtotal.toFixed(2)}</span>
                                        </div>
                                        
                                        {calculations.discount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Discount</span>
                                                <span className="font-medium text-green-600">-${calculations.discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Delivery</span>
                                            <span className="font-medium">
                                                {selectedDeliveryMethod === 'fast_delivery' ? `$${totalDeliveryCost.toFixed(2)}` : 
                                                 selectedDeliveryMethod === 'shipping' && selectedCarrierInfo ? `$${totalDeliveryCost.toFixed(2)}` : 
                                                 selectedDeliveryMethod === 'shipping' && !(data.street_address && data.city && data.state && data.zip_code) ? 'Enter address' :
                                                 'Calculating...'}
                                            </span>
                                        </div>
                                        
                                        
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tax</span>
                                            <span className="font-medium">${calculations.tax.toFixed(2)}</span>
                                        </div>
                                        
                                        <Separator className="my-4" />
                                        
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span>${finalTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Continue to Payment Button */}
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={processing || isProcessing}
                                        className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 text-base rounded-lg mt-6"
                                    >
                                        {processing || isProcessing ? (
                                            'Processing...'
                                        ) : (
                                            'Continue to Payment'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}