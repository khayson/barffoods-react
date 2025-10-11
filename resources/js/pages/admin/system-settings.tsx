import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Settings, DollarSign, Percent, Gift, CreditCard, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface SystemSettingsProps {
    settings: {
        global_delivery_fee: number;
        global_tax_rate: number;
        discount_rules: Record<string, DiscountRule>;
        payment_methods: Record<string, PaymentMethod>;
        store_address: StoreAddress;
    };
}

interface FormData {
    global_delivery_fee: number;
    global_tax_rate: number;
    discount_rules: Record<string, DiscountRule>;
    payment_methods: Record<string, PaymentMethod>;
    store_address: StoreAddress;
}

export default function SystemSettings({ settings }: SystemSettingsProps) {
    // Debug: Log the settings received from backend
    console.log('SystemSettings - Settings received from backend:', settings);
    console.log('SystemSettings - Discount rules:', settings.discount_rules);
    console.log('SystemSettings - Payment methods:', settings.payment_methods);
    console.log('SystemSettings - Store address:', settings.store_address);
    
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
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            </div>
        </AdminLayout>
    );
}
