import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useAdminTrackingUpdates } from '@/hooks/useTrackingUpdates';
import { Trash2, Target, FileText, Package, Download, Navigation, ExternalLink, Calendar, Clock, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { BackIcon } from '@/components/icons/back-icon';
import { MailIcon } from '@/components/icons/mail-icon';
import { ProgressIcon } from '@/components/icons/progress-icon';
import { TruckIcon } from '@/components/icons/truck-icon';
import { ShippingIcon } from '@/components/icons/shipping-icon';

interface StatusHistory {
    id: number;
    status: string;
    created_at: string;
    updated_at: string;
}

interface TrackingEvent {
    id: number;
    tracking_code: string;
    status: string;
    message: string;
    location: string | null;
    carrier: string | null;
    occurred_at: string;
    source: string;
}

interface Order {
    id: number;
    order_number: string;
    created_at: string;
    status: string;
    total_amount: number | string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    order_items: Array<{
        id: number;
        order_id: number;
        product_id: number;
        store_id: number;
        status: string;
        product: {
            id: string;
            name: string;
            image: string;
            price: number | string;
        };
        quantity: number;
        unit_price: number | string;
        total_price: number | string;
        store: {
            id: string;
            name: string;
        };
    }>;
    statusHistory: StatusHistory[];
    tracking_code: string | null;
    label_url: string | null;
    carrier: string | null;
    service: string | null;
    shipping_cost: number | string | null;
    shipping_method: 'shipping' | 'fast_delivery';
    tracking_events: TrackingEvent[];
    delivery_status: string | null;
    estimated_delivery_date: string | null;
    last_tracking_update: string | null;
    rate_id: string | null;
    shipment_id: string | null;
}

interface ProgressData {
    currentStatus: string;
    currentStep: number;
    currentPercentage: number;
    completedSteps: { [key: string]: boolean };
    statusHistory: StatusHistory[];
    progressSteps: { [key: string]: { step: number; label: string; percentage: number; description: string } };
    itemStatusCounts: { [key: string]: number };
    totalItems: number;
    overallProgress: string;
}

interface OrderShowPageProps {
    order: Order;
    progressData: ProgressData;
}

export default function OrderShowPage({ order, progressData }: OrderShowPageProps) {
    const [localOrder, setLocalOrder] = useState(order);
    const { props } = usePage<any>();
    
    // Use real-time tracking updates for admin
    useAdminTrackingUpdates();
    
    // Update local order when prop changes (after label creation, etc.)
    React.useEffect(() => {
        setLocalOrder(order);
    }, [order]);
    
    // Handle flash messages
    React.useEffect(() => {
        if (props.flash) {
            if (props.flash.success) {
                toast.success(props.flash.success);
            }
            if (props.flash.error) {
                toast.error(props.flash.error);
            }
            if (props.flash.warning) {
                toast.warning(props.flash.warning);
            }
            if (props.flash.info) {
                toast.info(props.flash.info);
            }
        }
    }, [props.flash]);
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Progress steps configuration (updated to match item statuses)
    const progressSteps = [
        { id: 'pending', label: 'Pending', icon: MailIcon },
        { id: 'ready', label: 'Ready', icon: FileText },
        { id: 'collected', label: 'Collected', icon: ProgressIcon },
        { id: 'packaged', label: 'Packaged', icon: ShippingIcon },
        { id: 'shipped', label: 'Shipped', icon: TruckIcon }
    ];

    // Use progress data from controller (now based on item statuses)
    const { currentStep, currentPercentage, itemStatusCounts, totalItems, overallProgress } = progressData;

    // Handle creating shipping label
    const handleCreateLabel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Create label button clicked for order:', localOrder.id);
        console.log('Event details:', e);
        console.log('Current URL:', window.location.href);
        
        toast.loading('Creating shipping label...', {
            id: 'create-label'
        });
        
        router.post(`/admin/orders/${localOrder.id}/create-label`, {}, {
            preserveState: false, // Allow state to update with new order data
            preserveScroll: true,
            onSuccess: (page) => {
                console.log('Label creation successful');
                console.log('Page props:', page.props);
                toast.dismiss('create-label');
                // Page will automatically update with new order data
            },
            onError: (errors) => {
                console.error('Label creation failed:', errors);
                toast.error('Failed to create shipping label', {
                    description: errors.message || 'An error occurred',
                    id: 'create-label'
                });
            }
        });
    };

    // Handle item status update with optimistic updates
    const handleItemStatusUpdate = (itemId: number, newStatus: string) => {
        const oldStatus = localOrder.order_items.find(item => item.id === itemId)?.status;
        
        // Show immediate feedback toast
        toast.success('Status updated', {
            description: `Changed from ${oldStatus} to ${newStatus}`,
            duration: 2000,
        });
        
        // Optimistic update - update UI immediately
        setLocalOrder(prevOrder => ({
            ...prevOrder,
            order_items: prevOrder.order_items.map(item => 
                item.id === itemId ? { ...item, status: newStatus } : item
            )
        }));
        
        router.patch(`/admin/orders/${localOrder.id}/items/${itemId}/status`, {
            status: newStatus
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Toast will be handled by the backend redirect message
            },
            onError: (errors) => {
                // Revert optimistic update on error
                setLocalOrder(prevOrder => ({
                    ...prevOrder,
                    order_items: prevOrder.order_items.map(item => 
                        item.id === itemId ? { ...item, status: oldStatus || 'pending' } : item
                    )
                }));
                
                // Check if it's a payment-related error
                if (errors.message && errors.message.includes('Payment is')) {
                    toast.error('Payment Status Error', {
                        description: errors.message,
                        duration: 5000,
                    });
                } else {
                    toast.error('Failed to update status', {
                        description: errors.status || 'An error occurred',
                        duration: 4000,
                    });
                }
            }
        });
    };

    return (
        <AdminLayout>
            <Head title={`Order ${localOrder.order_number}`} />
            
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            {/* Left Side - Back Button and Order Info */}
                            <div className="flex items-center space-x-4">
                                <Link href="/admin/orders">
                                    <Button variant="outline" className="border-2 border-black dark:border-white">
                                        <BackIcon className="w-8 h-auto text-black dark:text-white" />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        #{localOrder.order_number} - <span className="text-gray-600 text-lg">{formatDate(localOrder.created_at)}</span>
                                    </h1>
                                </div>
                            </div>
                            
                            {/* Right Side - Action Buttons */}
                            <div className="flex items-center space-x-3">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-800"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Order
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    <Target className="w-4 h-4 mr-2" />
                                    Track Order
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Progress Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                                <div className="mb-4">
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Progress</h2>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {overallProgress} ({totalItems} items)
                                    </p>
                                </div>
                                
                                {/* Progress Steps - Individual Cards */}
                                <div className="flex items-center justify-between gap-2">
                                    {progressSteps.map((step, index) => {
                                        const IconComponent = step.icon;
                                        const isCompleted = index <= currentStep;
                                        const isCurrent = index === currentStep;
                                        const itemCount = itemStatusCounts[step.id] || 0;
                                        
                                        // Determine progress bar color and width for each step
                                        let progressBarColor = 'bg-gray-200';
                                        let progressBarStyle = { width: '0%' };
                                        
                                        // Calculate percentage of items in this status
                                        const statusPercentage = totalItems > 0 ? (itemCount / totalItems) * 100 : 0;
                                        
                                        if (itemCount > 0) {
                                            if (step.id === 'delivered') {
                                                progressBarColor = 'bg-emerald-500';
                                            } else {
                                                progressBarColor = isCompleted ? 'bg-green-500' : 'bg-blue-500';
                                            }
                                            progressBarStyle = { width: `${statusPercentage}%` };
                                        }
                                        
                                        return (
                                            <div key={step.id} className="flex-1">
                                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 text-start">
                                                    {/* Icon */}
                                                    <div className="flex justify-start mb-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                            step.id === 'delivered' && itemCount > 0 
                                                                ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' 
                                                                : isCompleted 
                                                                ? 'bg-green-500' 
                                                                : 'bg-black dark:bg-white'
                                                        }`}>
                                                            <IconComponent className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Label */}
                                                    <div className="mb-2">
                                                        <span className={`text-xs font-medium transition-all duration-300 ${
                                                            step.id === 'delivered' && itemCount > 0
                                                                ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                                                                : isCompleted 
                                                                ? 'text-gray-900 dark:text-white' 
                                                                : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Item Count */}
                                                    <div className="mb-2">
                                                        <span className={`text-xs transition-all duration-300 ${
                                                            step.id === 'delivered' && itemCount > 0
                                                                ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                                                                : itemCount > 0 
                                                                ? 'text-gray-900 dark:text-white font-semibold' 
                                                                : 'text-gray-400 dark:text-gray-500'
                                                        }`}>
                                                            {itemCount}/{totalItems}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Individual Progress Bar */}
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                                        <div 
                                                            className={`h-1 rounded-full transition-all duration-300 ${
                                                                step.id === 'delivered' && itemCount > 0
                                                                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                                                                    : progressBarColor
                                                            }`}
                                                            style={progressBarStyle}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Product Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Product</h2>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Your Package</p>
                                    </div>
                                    <Link 
                                        href={`/admin/orders/${localOrder.id}/csv`}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download CSV
                                    </Link>
                                </div>

                                {/* Product Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">Item</th>
                                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">Status</th>
                                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">Quantity</th>
                                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">Price</th>
                                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">Tax</th>
                                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {localOrder.order_items && localOrder.order_items.length > 0 ? (
                                                localOrder.order_items.map((item, index) => (
                                                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                                                        {/* Item Column */}
                                                        <td className="py-3 px-2">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                                                    {item.product.image ? (
                                                                        // Check if image is an emoji (not a URL) or actual image URL
                                                                        item.product.image.startsWith('http') || item.product.image.startsWith('/') || item.product.image.includes('.') ? (
                                                                            <img 
                                                                                src={item.product.image} 
                                                                                alt={item.product.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-2xl">{item.product.image}</span>
                                                                        )
                                                                    ) : (
                                                                        <Package className="w-6 h-6 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {item.product?.name || `Product ID: ${item.product_id}`}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {item.store?.name || `Store ID: ${item.store_id}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Status Column */}
                                                        <td className="py-3 px-2">
                                                            <Select
                                                                value={item.status}
                                                                onValueChange={(value) => handleItemStatusUpdate(item.id, value)}
                                                            >
                                                                    <SelectTrigger className={`w-fit text-xs font-semibold transition-all duration-200 ${
                                                                        item.status === 'pending'
                                                                            ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                                                                            : item.status === 'ready'
                                                                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/30'
                                                                            : item.status === 'collected'
                                                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700 dark:hover:bg-yellow-900/30'
                                                                            : item.status === 'packaged'
                                                                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700 dark:hover:bg-purple-900/30'
                                                                            : item.status === 'shipped'
                                                                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/30'
                                                                            : item.status === 'delivered'
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/30'
                                                                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                                                                    }`}>
                                                                    <SelectValue>
                                                                        {item.status === 'pending' && '⏳ Pending'}
                                                                        {item.status === 'ready' && '✅ Ready'}
                                                                        {item.status === 'collected' && '📦 Collected'}
                                                                        {item.status === 'packaged' && '📋 Packaged'}
                                                                        {item.status === 'shipped' && '🚚 Shipped'}
                                                                        {item.status === 'delivered' && '✅ Delivered'}
                                                                    </SelectValue>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="pending">⏳ Pending</SelectItem>
                                                                    <SelectItem value="ready">✅ Ready</SelectItem>
                                                                    <SelectItem value="collected">📦 Collected</SelectItem>
                                                                    <SelectItem value="packaged">📋 Packaged</SelectItem>
                                                                    <SelectItem value="shipped">🚚 Shipped</SelectItem>
                                                                    <SelectItem value="delivered">✅ Delivered</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </td>

                                                        {/* Quantity Column */}
                                                        <td className="py-3 px-2">
                                                            <span className="text-sm text-gray-900 dark:text-white">
                                                                {item.quantity}
                                                            </span>
                                                        </td>

                                                        {/* Price Column */}
                                                        <td className="py-3 px-2">
                                                            <span className="text-sm text-gray-900 dark:text-white">
                                                                ${typeof item.unit_price === 'string' ? parseFloat(item.unit_price).toFixed(2) : item.unit_price.toFixed(2)}
                                                            </span>
                                                        </td>

                                                        {/* Tax Column */}
                                                        <td className="py-3 px-2">
                                                            <span className="text-sm text-gray-900 dark:text-white">
                                                                ${typeof item.total_price === 'string' ? (parseFloat(item.total_price) * 0.1).toFixed(2) : (item.total_price * 0.1).toFixed(2)}
                                                            </span>
                                                        </td>

                                                        {/* Amount Column */}
                                                        <td className="py-3 px-2">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                ${typeof item.total_price === 'string' ? parseFloat(item.total_price).toFixed(2) : item.total_price.toFixed(2)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                                        No items found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tracking Section - Only show for shipping orders */}
                            {localOrder.shipping_method === 'shipping' && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900 dark:text-white">Shipping & Tracking</h2>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Manage shipping labels and track packages</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {!localOrder.tracking_code && (
                                                <>
                                                    <Button 
                                                        type="button"
                                                        onClick={handleCreateLabel}
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Create Label
                                                    </Button>
                                                    {localOrder.rate_id && (
                                                        <Button 
                                                            type="button"
                                                            onClick={() => {
                                                                if (confirm('This will reset the shipping label data and allow you to create a new label. Continue?')) {
                                                                    router.post(`/admin/orders/${localOrder.id}/reset-label`);
                                                                }
                                                            }}
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-orange-600 text-orange-600 hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-900/20"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Reset Label
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                            {localOrder.label_url && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => localOrder.label_url && window.open(localOrder.label_url, '_blank')}
                                                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Label
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Shipping Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Carrier</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {localOrder.carrier || 'Not set'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Service</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {localOrder.service || 'Not set'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Shipping Cost</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                ${localOrder.shipping_cost ? (typeof localOrder.shipping_cost === 'string' ? parseFloat(localOrder.shipping_cost).toFixed(2) : localOrder.shipping_cost.toFixed(2)) : '0.00'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current Status</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {localOrder.delivery_status?.replace('_', ' ').toUpperCase() || 'No tracking'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tracking Code */}
                                    {localOrder.tracking_code && (
                                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Tracking Number</p>
                                                    <p className="text-lg font-mono font-semibold text-blue-900 dark:text-blue-100">
                                                        {localOrder.tracking_code}
                                                    </p>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => window.open(`https://www.google.com/search?q=${localOrder.carrier}+tracking+${localOrder.tracking_code}`, '_blank')}
                                                    className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Track with {localOrder.carrier}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Estimated Delivery */}
                                    {localOrder.estimated_delivery_date && (
                                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Estimated Delivery</p>
                                                    <p className="text-sm text-green-700 dark:text-green-300">
                                                        {(() => {
                                                            const date = new Date(localOrder.estimated_delivery_date);
                                                            if (isNaN(date.getTime())) {
                                                                return 'Date not available';
                                                            }
                                                            return date.toLocaleDateString('en-US', {
                                                                weekday: 'long',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            });
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tracking Events */}
                                    {localOrder.tracking_events && localOrder.tracking_events.length > 0 ? (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tracking Events</h3>
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {localOrder.tracking_events.map((event, index) => (
                                                    <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                                index === 0 ? 'bg-green-500' : 'bg-gray-400'
                                                            }`}>
                                                                <Navigation className={`w-3 h-3 ${
                                                                    index === 0 ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                                                                }`} />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className="text-xs font-medium text-gray-900 dark:text-white">
                                                                    {event.status.replace('_', ' ').toUpperCase()}
                                                                </span>
                                                                {index === 0 && (
                                                                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 px-2 py-0.5 rounded">
                                                                        Latest
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                                                                {event.message}
                                                            </p>
                                                            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                                                <div className="flex items-center space-x-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>
                                                                        {(() => {
                                                                            const date = new Date(event.occurred_at);
                                                                            if (isNaN(date.getTime())) {
                                                                                return 'Date not available';
                                                                            }
                                                                            return date.toLocaleString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            });
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                                {event.location && (
                                                                    <div className="flex items-center space-x-1">
                                                                        <MapPin className="w-3 h-3" />
                                                                        <span>{event.location}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : localOrder.tracking_code ? (
                                        <div className="text-center py-6">
                                            <Navigation className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                No tracking events yet. Updates will appear here.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Create a shipping label to enable tracking.
                                            </p>
                                        </div>
                                    )}

                                    {/* Last Update */}
                                    {localOrder.last_tracking_update && (
                                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Last updated: {(() => {
                                                    const date = new Date(localOrder.last_tracking_update);
                                                    if (isNaN(date.getTime())) {
                                                        return 'Date not available';
                                                    }
                                                    return date.toLocaleString();
                                                })()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            {/* Placeholder for right column content */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sidebar Content</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Right column content will go here</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}