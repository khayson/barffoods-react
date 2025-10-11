import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, CreditCard, MapPin, Phone, ShoppingBag, CheckCircle, ChevronRight } from 'lucide-react';
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
    const [selectedShippingMethod, setSelectedShippingMethod] = useState('free');
    const [discountCode, setDiscountCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        type: defaultAddress?.type || 'home',
        label: defaultAddress?.label || '',
        street_address: defaultAddress?.street_address || '',
        city: defaultAddress?.city || '',
        state: defaultAddress?.state || '',
        zip_code: defaultAddress?.zip_code || '',
        delivery_instructions: defaultAddress?.delivery_instructions || '',
        shipping_method: selectedShippingMethod,
        discount_code: discountCode,
    });

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

    const shippingMethods = [
        {
            id: 'free',
            name: 'Free Shipping',
            description: '7-20 Days',
            price: 0,
            selected: selectedShippingMethod === 'free'
        },
        {
            id: 'express',
            name: 'Express Shipping',
            description: '1-3 Days',
            price: 9,
            selected: selectedShippingMethod === 'express'
        }
    ];

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
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="street_address">Street Address</Label>
                                            <Input
                                                id="street_address"
                                                value={data.street_address}
                                                onChange={(e) => setData('street_address', e.target.value)}
                                                className="mt-1"
                                                placeholder="Enter street address"
                                            />
                                            {errors.street_address && (
                                                <p className="text-red-500 text-sm mt-1">{errors.street_address}</p>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    value={data.city}
                                                    onChange={(e) => setData('city', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="Enter city"
                                                />
                                                {errors.city && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor="state">State</Label>
                                                <Input
                                                    id="state"
                                                    value={data.state}
                                                    onChange={(e) => setData('state', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="Enter state"
                                                />
                                                {errors.state && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor="zip_code">Zip Code</Label>
                                                <Input
                                                    id="zip_code"
                                                    value={data.zip_code}
                                                    onChange={(e) => setData('zip_code', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="Enter zip code"
                                                />
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

                            {/* Shipping Method */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Method</h2>
                                
                                <RadioGroup 
                                    value={selectedShippingMethod} 
                                    onValueChange={setSelectedShippingMethod}
                                    className="space-y-4"
                                >
                                    {shippingMethods.map((method) => (
                                        <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                                            <RadioGroupItem value={method.id} id={method.id} />
                                            <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{method.name}</div>
                                                        <div className="text-sm text-gray-600">{method.description}</div>
                                                    </div>
                                                    <div className="font-medium text-gray-900">
                                                        ${method.price.toFixed(2)}
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
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
                                        
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Shipping</span>
                                            <span className="font-medium">
                                                ${selectedShippingMethod === 'free' ? '0.00' : '9.00'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estimated taxes</span>
                                            <span className="font-medium">${calculations.tax.toFixed(2)}</span>
                                        </div>
                                        
                                        <Separator className="my-4" />
                                        
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span>
                                                ${(calculations.subtotal + (selectedShippingMethod === 'free' ? 0 : 9) + calculations.tax).toFixed(2)}
                                            </span>
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