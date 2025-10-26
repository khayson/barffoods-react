import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, DollarSign, Truck, TrendingUp, Package, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface Store {
    id: number;
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
    delivery_radius: number;
    min_order_amount: number;
    delivery_fee: number;
    is_active: boolean;
    products_count: number;
    created_at: string;
    updated_at: string;
}

interface StoreOffCanvasProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'view' | 'edit' | 'create';
    storeId?: number | null;
    onEdit?: (storeId: number) => void;
}

export default function StoreOffCanvas({ isOpen, onClose, mode, storeId, onEdit }: StoreOffCanvasProps) {
    const [store, setStore] = useState<Store>({
        id: 0,
        name: '',
        address: '',
        phone: '',
        latitude: 0,
        longitude: 0,
        delivery_radius: 25,
        min_order_amount: 25.00,
        delivery_fee: 5.99,
        is_active: true,
        products_count: 0,
        created_at: '',
        updated_at: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch store data when in view/edit mode
    useEffect(() => {
        if ((mode === 'view' || mode === 'edit') && storeId && isOpen) {
            fetchStore();
        } else if (mode === 'create') {
            // Reset form for create mode
            setStore({
                id: 0,
                name: '',
                address: '',
                phone: '',
                latitude: 0,
                longitude: 0,
                delivery_radius: 25,
                min_order_amount: 25.00,
                delivery_fee: 5.99,
                is_active: true,
                products_count: 0,
                created_at: '',
                updated_at: '',
            });
        }
    }, [mode, storeId, isOpen]);

    const fetchStore = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/stores/${storeId}`);
            if (!response.ok) throw new Error('Failed to fetch store');
            const data = await response.json();
            
            // Ensure proper type conversion for numeric fields
            setStore({
                ...data,
                latitude: parseFloat(data.latitude) || 0,
                longitude: parseFloat(data.longitude) || 0,
                delivery_radius: parseInt(data.delivery_radius) || 25,
                min_order_amount: parseFloat(data.min_order_amount) || 25.00,
                delivery_fee: parseFloat(data.delivery_fee) || 5.99,
            });
        } catch (error) {
            console.error('Error fetching store:', error);
            toast.error('Failed to load store data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        // Minimal validation - only name is required
        if (!store.name?.trim()) {
            toast.error('Please enter a store name');
            return;
        }

        setIsSaving(true);

        const url = mode === 'create' ? '/admin/stores' : `/admin/stores/${store.id}`;
        const method = mode === 'create' ? 'post' : 'put';

        router[method](url, store, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Store ${mode === 'create' ? 'created' : 'updated'} successfully!`);
                onClose();
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                const firstError = Object.values(errors)[0];
                toast.error(firstError as string || 'Failed to save store');
            },
            onFinish: () => {
                setIsSaving(false);
            },
        });
    };

    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
            return;
        }

        router.delete(`/admin/stores/${store.id}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                // Check if there's a success flash message
                const successMessage = (page.props as any).flash?.success;
                if (successMessage) {
                    toast.success(successMessage);
                    onClose();
                }
            },
            onError: (errors) => {
                // Extract the first error message
                const errorMessage = typeof errors === 'object' && errors !== null 
                    ? Object.values(errors)[0] as string 
                    : 'Failed to delete store';
                toast.error(errorMessage);
            },
        });
    };

    const renderViewMode = () => (
        <div className="space-y-6">
            {/* Store Header */}
            <div className="text-center space-y-2">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MapPin className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{store.name}</h2>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    store.is_active 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${store.is_active ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                    {store.is_active ? 'Active' : 'Inactive'}
                </div>
            </div>

            {/* Store Details */}
            <div className="space-y-4">
                {/* Address */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Address</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{store.address}</p>
                        </div>
                    </div>
                </div>

                {/* Phone */}
                {store.phone && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Phone</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{store.phone}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Coordinates */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Coordinates</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Latitude</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{store.latitude?.toFixed(6)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Longitude</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{store.longitude?.toFixed(6)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                        <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Delivery Radius</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{store.delivery_radius} mi</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Min. Order</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">${store.min_order_amount?.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Delivery Fee</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">${store.delivery_fee?.toFixed(2)}</p>
                    </div>
                </div>

                {/* Products Count */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Total Products</h4>
                        </div>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{store.products_count}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    onClick={() => onEdit && onEdit(store.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Store
                </Button>
                <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="px-4"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    const renderFormMode = () => (
        <div className="space-y-6">
            {/* Store Name */}
            <div>
                <Label htmlFor="name">Store Name *</Label>
                <Input
                    id="name"
                    type="text"
                    value={store.name}
                    onChange={(e) => setStore({ ...store, name: e.target.value })}
                    placeholder="Enter store name"
                    className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    * Required field
                </p>
            </div>

            {/* Address */}
            <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Textarea
                    id="address"
                    value={store.address}
                    onChange={(e) => setStore({ ...store, address: e.target.value })}
                    placeholder="Enter full address (optional)"
                    rows={3}
                    className="mt-1"
                />
            </div>

            {/* Phone */}
            <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                    id="phone"
                    type="tel"
                    value={store.phone}
                    onChange={(e) => setStore({ ...store, phone: e.target.value })}
                    placeholder="(555) 123-4567 (optional)"
                    className="mt-1"
                />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="latitude">Latitude (Optional)</Label>
                    <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={store.latitude}
                        onChange={(e) => setStore({ ...store, latitude: parseFloat(e.target.value) || 0 })}
                        placeholder="40.7128"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="longitude">Longitude (Optional)</Label>
                    <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={store.longitude}
                        onChange={(e) => setStore({ ...store, longitude: parseFloat(e.target.value) || 0 })}
                        placeholder="-74.0060"
                        className="mt-1"
                    />
                </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3">
                Defaults to 0, 0 if not provided
            </p>

            {/* Delivery Settings */}
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Delivery Settings (Optional)</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 -mt-2">
                    Leave blank to use system defaults
                </p>
                
                <div>
                    <Label htmlFor="delivery_radius">Delivery Radius (miles)</Label>
                    <Input
                        id="delivery_radius"
                        type="number"
                        min="1"
                        value={store.delivery_radius}
                        onChange={(e) => setStore({ ...store, delivery_radius: parseInt(e.target.value) || 25 })}
                        placeholder="Default: 25 miles"
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="min_order_amount">Minimum Order Amount ($)</Label>
                    <Input
                        id="min_order_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={store.min_order_amount}
                        onChange={(e) => setStore({ ...store, min_order_amount: parseFloat(e.target.value) || 0 })}
                        placeholder="Default: $25.00"
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="delivery_fee">Delivery Fee ($)</Label>
                    <Input
                        id="delivery_fee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={store.delivery_fee}
                        onChange={(e) => setStore({ ...store, delivery_fee: parseFloat(e.target.value) || 0 })}
                        placeholder="Default: $5.99"
                        className="mt-1"
                    />
                </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                    <Label htmlFor="is_active" className="text-sm font-semibold">Active Status</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Inactive stores won't appear in customer search results
                    </p>
                </div>
                <Switch
                    id="is_active"
                    checked={store.is_active}
                    onCheckedChange={(checked) => setStore({ ...store, is_active: checked })}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
                    disabled={isSaving}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : mode === 'create' ? 'Create Store' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Off-Canvas Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {mode === 'view' ? 'Store Details' : mode === 'edit' ? 'Edit Store' : 'Create New Store'}
                                    </h2>
                                    <p className="text-blue-100 text-sm mt-1">
                                        {mode === 'view' ? 'View store information' : mode === 'edit' ? 'Update store details' : 'Add a new store location'}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : mode === 'view' ? (
                                renderViewMode()
                            ) : (
                                renderFormMode()
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

