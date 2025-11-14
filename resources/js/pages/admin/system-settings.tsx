import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Settings, DollarSign, Percent, Gift, CreditCard, Save, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/admin-layout';

interface DiscountRule {
    enabled: boolean;
    percentage?: number;
    threshold?: number;
    description?: string;
}

interface PaymentMethod {
    enabled: boolean;
    name: string;
    description: string;
}

interface StoreAddress {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    company_name: string;
    phone: string;
    email: string;
}

interface DefaultMapLocation {
    latitude: number;
    longitude: number;
    address: string;
    zoom: number;
}

interface ContactInfo {
    email: string;
    phone: string;
    address: string;
    business_hours: string;
}

interface SystemSettingsProps {
    settings: {
        global_delivery_fee: number;
        global_tax_rate: number;
        discount_rules: Record<string, DiscountRule>;
        payment_methods: Record<string, PaymentMethod>;
        store_address: StoreAddress;
        default_map_location: DefaultMapLocation;
        contact_info: ContactInfo;
    };
}

interface FormData {
    global_delivery_fee: number;
    global_tax_rate: number;
    discount_rules: Record<string, DiscountRule>;
    payment_methods: Record<string, PaymentMethod>;
    store_address: StoreAddress;
    default_map_location: DefaultMapLocation;
    contact_info: ContactInfo;
}

export default function SystemSettings({ settings }: SystemSettingsProps) {
    // Debug: Log the settings received from backend
    // console.log('SystemSettings - Settings received from backend:', settings);
    // console.log('SystemSettings - Discount rules:', settings.discount_rules);
    // console.log('SystemSettings - Payment methods:', settings.payment_methods);
    // console.log('SystemSettings - Store address:', settings.store_address);
    
    const { data, setData, post, processing, errors } = useForm<FormData>({
        global_delivery_fee: settings.global_delivery_fee || 4.99,
        global_tax_rate: settings.global_tax_rate || 8.5,
        discount_rules: settings.discount_rules || {},
        payment_methods: settings.payment_methods || {},
        store_address: typeof settings.store_address === 'string' 
            ? JSON.parse(settings.store_address)
            : settings.store_address || {
                street_address: '123 Main Street',
                city: 'New York',
                state: 'NY',
                zip_code: '10001',
                country: 'US',
                company_name: 'BarfFoods',
                phone: '+1 (555) 123-4567',
                email: 'orders@barffoods.com'
            },
        default_map_location: typeof settings.default_map_location === 'string'
            ? JSON.parse(settings.default_map_location)
            : settings.default_map_location || {
                latitude: 40.7128,
                longitude: -74.0060,
                address: 'New York, NY',
                zoom: 13
            },
        contact_info: typeof settings.contact_info === 'string'
            ? JSON.parse(settings.contact_info)
            : settings.contact_info || {
                email: 'support@barffoods.com',
                phone: '+1 (555) 123-4567',
                address: '123 Grocery Street, Food City, FC 12345',
                business_hours: 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday - Sunday: 10:00 AM - 4:00 PM'
            },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/api/admin/system-settings');
    };

    const updateDiscountRule = (rule: string, field: string, value: any) => {
        setData('discount_rules', {
            ...data.discount_rules,
            [rule]: {
                ...data.discount_rules[rule],
                [field]: value,
            },
        });
    };

    const updatePaymentMethod = (method: string, field: string, value: any) => {
        setData('payment_methods', {
            ...data.payment_methods,
            [method]: {
                ...data.payment_methods[method],
                [field]: value,
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="System Settings - BarfFoods Admin" />
            
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        System Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Configure global system settings that apply to all stores
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Global Delivery Fee */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    Global Delivery Fee
                                </CardTitle>
                                <CardDescription>
                                    Default delivery fee for all stores. Individual stores can override this.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="global_delivery_fee">Delivery Fee ($)</Label>
                                    <Input
                                        id="global_delivery_fee"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.global_delivery_fee}
                                        onChange={(e) => setData('global_delivery_fee', parseFloat(e.target.value))}
                                        className="max-w-xs"
                                    />
                                    {errors.global_delivery_fee && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {errors.global_delivery_fee}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Global Tax Rate */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Percent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Global Tax Rate
                                </CardTitle>
                                <CardDescription>
                                    Default tax rate percentage for all stores. Individual stores can override this.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="global_tax_rate">Tax Rate (%)</Label>
                                    <Input
                                        id="global_tax_rate"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={data.global_tax_rate}
                                        onChange={(e) => setData('global_tax_rate', parseFloat(e.target.value))}
                                        className="max-w-xs"
                                    />
                                    {errors.global_tax_rate && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {errors.global_tax_rate}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Discount Rules */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    Discount Rules
                                </CardTitle>
                                <CardDescription>
                                    Configure automatic discount rules for customers
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Object.entries(data.discount_rules).map(([key, rule]) => (
                                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h4 className="font-medium capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {rule.description || 'No description available'}
                                            </p>
                                            {rule.percentage && (
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    {rule.percentage}% discount
                                                </p>
                                            )}
                                            {rule.threshold && (
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    Minimum order: ${rule.threshold}
                                                </p>
                                            )}
                                        </div>
                                        <Switch
                                            checked={rule.enabled || false}
                                            onCheckedChange={(checked) => 
                                                updateDiscountRule(key, 'enabled', checked)
                                            }
                                        />
                                    </div>
                                ))}
                                {Object.keys(data.discount_rules).length === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                        No discount rules configured
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Methods */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    Payment Methods
                                </CardTitle>
                                <CardDescription>
                                    Enable or disable payment methods for customers
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Object.entries(data.payment_methods).map(([key, method]) => (
                                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h4 className="font-medium capitalize">
                                                {method.name || key.replace(/_/g, ' ')}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {method.description || 'No description available'}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={method.enabled || false}
                                            onCheckedChange={(checked) => 
                                                updatePaymentMethod(key, 'enabled', checked)
                                            }
                                        />
                                    </div>
                                ))}
                                {Object.keys(data.payment_methods).length === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                        No payment methods configured
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Store Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    Store Address
                                </CardTitle>
                                <CardDescription>
                                    Store address used as shipping origin for all orders
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="company_name">Company Name</Label>
                                        <Input
                                            id="company_name"
                                            value={data.store_address.company_name}
                                            onChange={(e) => setData('store_address', {
                                                ...data.store_address,
                                                company_name: e.target.value
                                            })}
                                            placeholder="Enter company name"
                                        />
                                        {errors.store_address && typeof errors.store_address === 'object' && 'company_name' in errors.store_address && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {(errors.store_address as any).company_name}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={data.store_address.phone}
                                            onChange={(e) => setData('store_address', {
                                                ...data.store_address,
                                                phone: e.target.value
                                            })}
                                            placeholder="Enter phone number"
                                        />
                                        {errors.store_address && typeof errors.store_address === 'object' && 'phone' in errors.store_address && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {(errors.store_address as any).phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.store_address.email}
                                        onChange={(e) => setData('store_address', {
                                            ...data.store_address,
                                            email: e.target.value
                                        })}
                                        placeholder="Enter email address"
                                    />
                                    {errors.store_address && typeof errors.store_address === 'object' && 'email' in errors.store_address && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {(errors.store_address as any).email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="street_address">Street Address</Label>
                                    <Input
                                        id="street_address"
                                        value={data.store_address.street_address}
                                        onChange={(e) => setData('store_address', {
                                            ...data.store_address,
                                            street_address: e.target.value
                                        })}
                                        placeholder="Enter street address"
                                    />
                                    {errors.store_address && typeof errors.store_address === 'object' && 'street_address' in errors.store_address && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {(errors.store_address as any).street_address}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={data.store_address.city}
                                            onChange={(e) => setData('store_address', {
                                                ...data.store_address,
                                                city: e.target.value
                                            })}
                                            placeholder="Enter city"
                                        />
                                        {errors.store_address && typeof errors.store_address === 'object' && 'city' in errors.store_address && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {(errors.store_address as any).city}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            value={data.store_address.state}
                                            onChange={(e) => setData('store_address', {
                                                ...data.store_address,
                                                state: e.target.value
                                            })}
                                            placeholder="Enter state"
                                        />
                                        {errors.store_address && typeof errors.store_address === 'object' && 'state' in errors.store_address && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {(errors.store_address as any).state}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="zip_code">ZIP Code</Label>
                                        <Input
                                            id="zip_code"
                                            value={data.store_address.zip_code}
                                            onChange={(e) => setData('store_address', {
                                                ...data.store_address,
                                                zip_code: e.target.value
                                            })}
                                            placeholder="Enter ZIP code"
                                        />
                                        {errors.store_address && typeof errors.store_address === 'object' && 'zip_code' in errors.store_address && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {(errors.store_address as any).zip_code}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={data.store_address.country}
                                        onChange={(e) => setData('store_address', {
                                            ...data.store_address,
                                            country: e.target.value
                                        })}
                                        placeholder="Enter country"
                                    />
                                    {errors.store_address && typeof errors.store_address === 'object' && 'country' in errors.store_address && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {(errors.store_address as any).country}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Default Map Location Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Default Map Location
                                </CardTitle>
                                <CardDescription>
                                    Set the default location displayed on maps when user location is not available
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="map_address">Location Name/Address</Label>
                                    <Input
                                        id="map_address"
                                        value={data.default_map_location.address}
                                        onChange={(e) => setData('default_map_location', {
                                            ...data.default_map_location,
                                            address: e.target.value
                                        })}
                                        placeholder="e.g., New York, NY"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Descriptive name shown to users
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="latitude">Latitude</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            value={data.default_map_location.latitude}
                                            onChange={(e) => setData('default_map_location', {
                                                ...data.default_map_location,
                                                latitude: parseFloat(e.target.value) || 0
                                            })}
                                            placeholder="e.g., 40.7128"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Geographic coordinate
                                        </p>
                                    </div>
                                    <div>
                                        <Label htmlFor="longitude">Longitude</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            value={data.default_map_location.longitude}
                                            onChange={(e) => setData('default_map_location', {
                                                ...data.default_map_location,
                                                longitude: parseFloat(e.target.value) || 0
                                            })}
                                            placeholder="e.g., -74.0060"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Geographic coordinate
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="zoom">Default Zoom Level</Label>
                                    <Input
                                        id="zoom"
                                        type="number"
                                        min="1"
                                        max="18"
                                        value={data.default_map_location.zoom}
                                        onChange={(e) => setData('default_map_location', {
                                            ...data.default_map_location,
                                            zoom: parseInt(e.target.value) || 13
                                        })}
                                        placeholder="1-18"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Map zoom level (1 = world view, 18 = street level). Recommended: 13
                                    </p>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                        💡 <strong>Tip:</strong> You can find coordinates by searching for a location on{' '}
                                        <a 
                                            href="https://www.google.com/maps" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="underline hover:text-blue-600"
                                        >
                                            Google Maps
                                        </a>
                                        {' '}and right-clicking on the location to copy the coordinates.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Contact Information
                                </CardTitle>
                                <CardDescription>
                                    Contact details displayed on the Contact Us page
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="contact_email">Email</Label>
                                        <Input
                                            id="contact_email"
                                            type="email"
                                            value={data.contact_info.email}
                                            onChange={(e) => setData('contact_info', {
                                                ...data.contact_info,
                                                email: e.target.value
                                            })}
                                            placeholder="support@barffoods.com"
                                        />
                                        {errors.contact_info && typeof errors.contact_info === 'object' && 'email' in errors.contact_info && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {(errors.contact_info as any).email}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="contact_phone">Phone</Label>
                                        <Input
                                            id="contact_phone"
                                            value={data.contact_info.phone}
                                            onChange={(e) => setData('contact_info', {
                                                ...data.contact_info,
                                                phone: e.target.value
                                            })}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                        {errors.contact_info && typeof errors.contact_info === 'object' && 'phone' in errors.contact_info && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {(errors.contact_info as any).phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="contact_address">Address</Label>
                                    <Input
                                        id="contact_address"
                                        value={data.contact_info.address}
                                        onChange={(e) => setData('contact_info', {
                                            ...data.contact_info,
                                            address: e.target.value
                                        })}
                                        placeholder="123 Grocery Street, Food City, FC 12345"
                                    />
                                    {errors.contact_info && typeof errors.contact_info === 'object' && 'address' in errors.contact_info && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {(errors.contact_info as any).address}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="business_hours">Business Hours</Label>
                                    <Textarea
                                        id="business_hours"
                                        value={data.contact_info.business_hours}
                                        onChange={(e) => setData('contact_info', {
                                            ...data.contact_info,
                                            business_hours: e.target.value
                                        })}
                                        placeholder="Monday - Friday: 9:00 AM - 6:00 PM&#10;Saturday - Sunday: 10:00 AM - 4:00 PM"
                                        rows={3}
                                    />
                                    {errors.contact_info && typeof errors.contact_info === 'object' && 'business_hours' in errors.contact_info && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {(errors.contact_info as any).business_hours}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Use line breaks to separate different days or time ranges
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                </form>
            </div>
        </AdminLayout>
    );
}
