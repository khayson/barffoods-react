import React, { useState, useEffect } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
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
    
    // Get flash messages from Inertia
    const { flash } = usePage().props as any;
    
    // Handle flash messages from server
    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error, {
                duration: 5000,
            });
        }
        
        if (flash?.success) {
            toast.success(flash.success, {
                duration: 5000,
            });
        }
        
        if (flash?.warning) {
            toast.warning(flash.warning, {
                duration: 5000,
            });
        }
        
        if (flash?.info) {
            toast.info(flash.info, {
                duration: 5000,
            });
        }
    }, [flash]);
    
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
                payment_intent_id: '',
                // Only keep delivery instructions
                shipping_instructions: '',
                save_address: false, // New field to control address saving
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
    
    // Calculate total delivery cost based on method
    let totalDeliveryCost = 0;
    if (selectedDeliveryMethod === 'fast_delivery') {
        totalDeliveryCost = 12.99; // Fixed cost for fast delivery
    } else if (selectedDeliveryMethod === 'shipping' && selectedCarrierInfo && data.street_address && data.city && data.state && data.zip_code) {
        totalDeliveryCost = baseDeliveryCost;
    }
    
    const finalTotal = calculations.subtotal - calculations.discount + totalDeliveryCost + calculations.tax;

    // Validation state
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showValidationSummary, setShowValidationSummary] = useState(false);
    const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

    // Helper functions for validation display
    const getFieldError = (fieldName: string): string | undefined => {
        if (!touchedFields.has(fieldName) && !showValidationSummary) {
            return undefined;
        }
        
        const errors = validateCheckoutForm();
        return errors.find(error => 
            error.toLowerCase().includes(fieldName.toLowerCase())
        );
    };

    const markFieldAsTouched = (fieldName: string) => {
        setTouchedFields(prev => new Set(prev).add(fieldName));
    };

    const isFieldValid = (fieldName: string) => {
        return !getFieldError(fieldName);
    };

    const getFieldClassName = (fieldName: string, baseClassName: string = '') => {
        const hasError = getFieldError(fieldName);
        return `${baseClassName} ${hasError ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
    };

    // Comprehensive validation function
    const validateCheckoutForm = () => {
        const errors: string[] = [];

        // 1. Address validation
        if (!data.street_address?.trim()) {
            errors.push('Street address is required');
        }
        if (!data.city?.trim()) {
            errors.push('City is required');
        }
        if (!data.state?.trim()) {
            errors.push('State is required');
        }
        if (!data.zip_code?.trim()) {
            errors.push('ZIP code is required');
        }

        // 2. ZIP code format validation
        if (data.zip_code && !/^\d{5}(-\d{4})?$/.test(data.zip_code.trim())) {
            errors.push('Please enter a valid ZIP code (e.g., 12345 or 12345-6789)');
        }

        // 3. Delivery method validation
        if (!selectedDeliveryMethod) {
            errors.push('Please select a delivery method');
        }

        // 4. Shipping-specific validation
        if (selectedDeliveryMethod === 'shipping') {
            if (!selectedCarrier) {
                errors.push('Please select a shipping carrier');
            }
            
            // Check if carriers are available
            if (carriers.length === 0) {
                errors.push('No shipping carriers available. Please try Local Express delivery instead.');
            }
            
            // Check if address is complete for shipping calculation
            if (!(data.street_address && data.city && data.state && data.zip_code)) {
                errors.push('Complete address is required for shipping calculation');
            }
        }

        // 5. Cart validation
        if (!cartItems || cartItems.length === 0) {
            errors.push('Your cart is empty. Please add items before checkout');
        }

        // 6. Total validation
        if (finalTotal <= 0) {
            errors.push('Invalid order total. Please refresh the page and try again');
        }

        // 7. Address type validation
        if (!data.type || !['home', 'work', 'other'].includes(data.type)) {
            errors.push('Please select a valid address type');
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Comprehensive validation
        const errors = validateCheckoutForm();
        
        if (errors.length > 0) {
            // Show validation summary
            setValidationErrors(errors);
            setShowValidationSummary(true);
            
            // Mark all fields as touched to show errors
            setTouchedFields(new Set(['street_address', 'city', 'state', 'zip_code', 'type']));
            
            // Show the first error as a toast
            toast.error('Please fix the errors below', {
                description: `${errors.length} error${errors.length > 1 ? 's' : ''} found`
            });
            
            // Scroll to validation summary
            setTimeout(() => {
                document.getElementById('validation-summary')?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 100);
            
            // Log all errors for debugging
            console.error('Checkout validation errors:', errors);
            return;
        }
        
        // Clear validation errors if form is valid
        setValidationErrors([]);
        setShowValidationSummary(false);

        // Additional checks before proceeding
        if (isProcessing || processing) {
            toast.error('Please wait, processing your order...');
            return;
        }

        // Create Stripe Checkout Session and redirect
        setIsProcessing(true);
        
        // Debug what we're sending
        const requestData = {
            type: data.type,
            label: data.label,
            street_address: data.street_address,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            delivery_instructions: data.delivery_instructions,
            shipping_method: selectedDeliveryMethod,
            carrier_id: selectedCarrier,
            carrier_name: selectedCarrierInfo?.name,
            carrier_service: selectedCarrierInfo?.service,
            carrier_cost: selectedCarrierInfo?.cost,
            discount_code: discountCode,
            save_address: data.save_address,
        };
        
        console.log('Checkout request data:', requestData);
        console.log('Selected carrier info:', selectedCarrierInfo);
        console.log('Available carriers:', carriers);
        
        try {
            const response = await fetch('/checkout/create-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Show success message before redirect
                toast.success('Redirecting to payment...', {
                    description: 'Please complete your payment to confirm your order'
                });
                
                // Small delay to show the toast
                setTimeout(() => {
                    window.location.href = result.checkout_url;
                }, 1000);
            } else {
                // Handle specific error messages from backend
                const errorMessage = result.error || result.message || 'Failed to create checkout session';
                toast.error('Checkout Error', {
                    description: errorMessage
                });
                
                // Log detailed error for debugging
                console.error('Checkout session creation failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    result: result
                });
            }
        } catch (error) {
            console.error('Checkout session error:', error);
            toast.error('Network Error', {
                description: 'Unable to connect to payment service. Please check your internet connection and try again.'
            });
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
            
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0">
                    {/* Breadcrumb Navigation */}
                    {/* <div className="mb-8">
                        <nav className="flex items-center space-x-2 text-sm text-gray-600">
                            <Link href="/cart" className="hover:text-gray-900">Cart</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-gray-900 font-medium">Shipping</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-gray-400">Payment</span>
                        </nav>
                    </div> */}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Shipping Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Shipping Address */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Shipping Address</h2>
                                
                                {/* Address Selection */}
                                {userAddresses.length > 0 && (
                                    <div className="mb-6">
                                        <Label htmlFor="address_selection" className="text-gray-900 dark:text-white">Select Saved Address</Label>
                                        <select 
                                            id="address_selection"
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Select a saved address...</option>
                                            {userAddresses.map((address) => (
                                                <option key={address.id} value={address.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                                    {address.label} - {address.street_address}, {address.city}, {address.state} {address.zip_code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Validation Summary */}
                                    {showValidationSummary && validationErrors.length > 0 && (
                                        <div 
                                            id="validation-summary"
                                            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
                                        >
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                                                        {validationErrors.length === 1 
                                                            ? 'Please fix the following issue:' 
                                                            : `Please fix the following ${validationErrors.length} issues:`
                                                        }
                                                    </h3>
                                                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1.5 list-disc list-inside">
                                                        {validationErrors.map((error, index) => (
                                                            <li key={index}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowValidationSummary(false)}
                                                    className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                                >
                                                    <span className="sr-only">Dismiss</span>
                                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}

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
                                            <Label htmlFor="street_address" className="text-gray-900 dark:text-white">
                                                Street Address <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="street_address"
                                                    value={data.street_address}
                                                    onChange={(e) => handleStreetAddressChange(e.target.value)}
                                                    onBlur={() => markFieldAsTouched('street_address')}
                                                    className={getFieldClassName('street_address', 'mt-1 pr-10')}
                                                    placeholder="Enter street address"
                                                    aria-invalid={!isFieldValid('street_address')}
                                                />
                                                {addressAutocomplete.isLoading && (
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Street Address Suggestions */}
                                            {addressAutocomplete.showStreetDropdown && addressAutocomplete.streetSuggestions.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {addressAutocomplete.streetSuggestions.map((suggestion) => (
                                                        <div
                                                            key={suggestion.id}
                                                            className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                                                            onClick={() => selectAddressSuggestion(suggestion)}
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <MapPinIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                                <div>
                                                                    <div className="font-medium text-gray-900 dark:text-white">{suggestion.street_address}</div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {suggestion.city}, {suggestion.state} {suggestion.zip_code}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {getFieldError('street_address') && (
                                                <p id="street_address-error" className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center">
                                                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {getFieldError('street_address')}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="relative">
                                                <Label htmlFor="city" className="text-gray-900 dark:text-white">
                                                    City <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="city"
                                                        value={data.city}
                                                        onChange={(e) => handleCityChange(e.target.value)}
                                                        onBlur={() => markFieldAsTouched('city')}
                                                        className={getFieldClassName('city', 'mt-1 pr-10')}
                                                        placeholder="Enter city"
                                                        aria-invalid={!isFieldValid('city')}
                                                    />
                                                    {addressAutocomplete.isLoading && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* City Suggestions */}
                                                {addressAutocomplete.showCityDropdown && addressAutocomplete.citySuggestions.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                        {addressAutocomplete.citySuggestions.map((city, index) => (
                                                            <div
                                                                key={index}
                                                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                                                                onClick={() => selectCitySuggestion(city)}
                                                            >
                                                                {city}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {getFieldError('city') && (
                                                    <p id="city-error" className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center">
                                                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        {getFieldError('city')}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div className="relative">
                                                <Label htmlFor="state" className="text-gray-900 dark:text-white">
                                                    State <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="state"
                                                        value={data.state}
                                                        onChange={(e) => handleStateChange(e.target.value)}
                                                        onBlur={() => markFieldAsTouched('state')}
                                                        className={getFieldClassName('state', 'mt-1 pr-10')}
                                                        placeholder="Enter state"
                                                        aria-invalid={!isFieldValid('state')}
                                                    />
                                                    {addressAutocomplete.isLoading && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* State Suggestions */}
                                                {addressAutocomplete.showStateDropdown && addressAutocomplete.stateSuggestions.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                        {addressAutocomplete.stateSuggestions.map((state, index) => (
                                                            <div
                                                                key={index}
                                                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                                                                onClick={() => selectStateSuggestion(state)}
                                                            >
                                                                {state}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {getFieldError('state') && (
                                                    <p id="state-error" className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center">
                                                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        {getFieldError('state')}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div className="relative">
                                                <Label htmlFor="zip_code" className="text-gray-900 dark:text-white">
                                                    Zip Code <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="zip_code"
                                                        value={data.zip_code}
                                                        onChange={(e) => handleZipChange(e.target.value)}
                                                        onBlur={() => markFieldAsTouched('zip_code')}
                                                        className={getFieldClassName('zip_code', 'mt-1 pr-10')}
                                                        placeholder="Enter zip code"
                                                        aria-invalid={!isFieldValid('zip_code')}
                                                    />
                                                    {addressAutocomplete.isLoading && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* ZIP Suggestions */}
                                                {addressAutocomplete.showZipDropdown && addressAutocomplete.zipSuggestions.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                        {addressAutocomplete.zipSuggestions.map((zip, index) => (
                                                            <div
                                                                key={index}
                                                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                                                                onClick={() => selectZipSuggestion(zip)}
                                                            >
                                                                {zip}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {getFieldError('zip_code') && (
                                                    <p id="zip_code-error" className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center">
                                                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        {getFieldError('zip_code')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Type */}
                                    <div>
                                        <Label htmlFor="type" className="text-gray-900 dark:text-white">
                                            Address Type <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            id="type"
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value as 'home' | 'work' | 'other')}
                                            onBlur={() => markFieldAsTouched('type')}
                                            className={getFieldClassName('type', 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500')}
                                            aria-invalid={!isFieldValid('type')}
                                        >
                                            <option value="home">Home</option>
                                            <option value="work">Work</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {getFieldError('type') && (
                                            <p id="type-error" className="text-red-600 dark:text-red-400 text-sm mt-1.5 flex items-center">
                                                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {getFieldError('type')}
                                            </p>
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

                                    {/* Save Address Checkbox */}
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="save_address"
                                            checked={data.save_address}
                                            onChange={(e) => setData('save_address', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <Label htmlFor="save_address" className="text-sm text-gray-700 dark:text-gray-300">
                                            Save this address for future orders
                                        </Label>
                                    </div>
                                </form>
                            </div>

                            {/* Delivery Method */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Delivery Method</h2>
                                
                                {/* Delivery Method Validation */}
                                {!selectedDeliveryMethod && (
                                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                            ⚠️ Please select a delivery method to continue
                                        </p>
                                    </div>
                                )}
                                
                                {selectedDeliveryMethod === 'shipping' && !selectedCarrier && (
                                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                            {carriers.length === 0 ? 
                                                '⚠️ No shipping carriers available for this address. Please try Local Express delivery instead.' :
                                                '⚠️ Please select a shipping carrier to continue'
                                            }
                                        </p>
                                    </div>
                                )}
                                
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
                                                    <RadioGroupItem value={method.id} id={method.id} className="dark:bg-gray-700"/>
                                                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-gray-400">{method.name}</div>
                                                                <div className="text-sm text-gray-600 dark:text-gray-400">{method.description}</div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">Delivery: {method.estimated_days}</div>
                                                            </div>
                                                            {method.cost && (
                                                                <div className="font-medium text-gray-900 dark:text-gray-400">
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
                                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                <p className="text-blue-800 dark:text-blue-200 text-sm">
                                                    Please complete your delivery address above to see shipping options and carriers.
                                                </p>
                                            </div>
                                        )}
                                        
                                        {selectedDeliveryMethod === 'shipping' && data.street_address && data.city && data.state && data.zip_code && (
                                            <div className="mt-6 space-y-6">
                                                {/* Carrier Selection */}
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Carrier</h3>
                                                    {carriers.length > 0 ? (
                                                        <RadioGroup 
                                                            value={selectedCarrier} 
                                                            onValueChange={setSelectedCarrier}
                                                            className="space-y-3"
                                                        >
                                                            {carriers.map((carrier) => (
                                                                <div key={carrier.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border-gray-200 dark:border-gray-600">
                                                                    <RadioGroupItem value={carrier.id} id={carrier.id} />
                                                                    <Label htmlFor={carrier.id} className="flex-1 cursor-pointer">
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                <div className="font-medium text-gray-900 dark:text-white">{carrier.name} - {carrier.service}</div>
                                                                                <div className="text-sm text-gray-600 dark:text-gray-400">{carrier.description}</div>
                                                                                <div className="text-sm text-gray-500 dark:text-gray-500">Delivery: {carrier.delivery_days}</div>
                                                                            </div>
                                                                            <div className="font-medium text-gray-900 dark:text-white">
                                                                                ${carrier.cost.toFixed(2)}
                                                                            </div>
                                                                        </div>
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                            {data.street_address && data.city && data.state && data.zip_code ? (
                                                                <div>
                                                                    <p className="text-red-600 dark:text-red-400 font-medium">No shipping carriers available for this address.</p>
                                                                    <p className="text-sm mt-1">Please try Local Express delivery instead.</p>
                                                                </div>
                                                            ) : (
                                                                <p>Please enter your delivery address to see available carriers.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Delivery Instructions */}
                                                <div>
                                                    <Label htmlFor="shipping_instructions" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        {shippingConfigError && data.street_address && data.city && data.state && data.zip_code ? (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                                        <strong>Shipping Service Not Configured</strong><br/>
                                                        The shipping service is not currently available. Please contact support to enable shipping options.
                                                    </p>
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
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
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Cart</h2>
                                    
                                    {/* Cart Items */}
                                    <div className="space-y-4 mb-6">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="flex items-center space-x-3">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
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
                                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                                        {item.product.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        {item.product.category?.name || 'Category'}
                                                    </p>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        ${typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price}
                                                    </p>
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Qty: {item.quantity}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Discount Code */}
                                    <div className="mb-6">
                                        <Label htmlFor="discount_code" className="text-gray-900 dark:text-white">Discount Code</Label>
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
                                            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                            <span className="font-medium text-gray-900 dark:text-white">${calculations.subtotal.toFixed(2)}</span>
                                        </div>
                                        
                                        {calculations.discount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Discount</span>
                                                <span className="font-medium text-green-600 dark:text-green-400">-${calculations.discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Delivery</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {selectedDeliveryMethod === 'fast_delivery' ? `$${totalDeliveryCost.toFixed(2)}` : 
                                                 selectedDeliveryMethod === 'shipping' && selectedCarrierInfo ? `$${totalDeliveryCost.toFixed(2)}` : 
                                                 selectedDeliveryMethod === 'shipping' && !(data.street_address && data.city && data.state && data.zip_code) ? 'Enter address' :
                                                 'Calculating...'}
                                            </span>
                                        </div>
                                        
                                        
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Tax</span>
                                            <span className="font-medium text-gray-900 dark:text-white">${calculations.tax.toFixed(2)}</span>
                                        </div>
                                        
                                        <Separator className="my-4" />
                                        
                                        <div className="flex justify-between text-lg font-bold">
                                            <span className="text-gray-900 dark:text-white">Total</span>
                                            <span className="text-gray-900 dark:text-white">${finalTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Continue to Payment Button */}
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={processing || isProcessing || validateCheckoutForm().length > 0}
                                        className={`w-full font-semibold py-3 text-base rounded-lg mt-6 ${
                                            validateCheckoutForm().length > 0 
                                                ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                                                : 'bg-black hover:bg-gray-800'
                                        } text-white`}
                                    >
                                        {processing || isProcessing ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Creating Checkout...
                                            </div>
                                        ) : validateCheckoutForm().length > 0 ? (
                                            `Fix ${validateCheckoutForm().length} Error${validateCheckoutForm().length > 1 ? 's' : ''} to Continue`
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