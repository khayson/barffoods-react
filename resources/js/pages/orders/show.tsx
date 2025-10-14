import React, { useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { 
    CheckCircle, 
    Package, 
    Truck, 
    MapPin, 
    CreditCard, 
    Calendar,
    ArrowLeft,
    Download,
    ExternalLink,
    Clock,
    User,
    Store,
    ChevronRight,
    Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CustomerLayout from '@/layouts/customer-layout';

interface OrderItem {
    id: number;
    product: {
        id: string;
        name: string;
        image: string;
        price: number | string;
    };
    quantity: number;
    unit_price: number | string;
    total_price: number | string;
    status: string;
}

interface Payment {
    id: number;
    amount: number | string;
    payment_method: string;
    transaction_id: string;
    status: string;
    created_at: string;
}

interface StatusHistory {
    id: number;
    status: string;
    note: string;
    created_at: string;
}

interface StoreGroup {
    store: {
        id: string;
        name: string;
        address: string;
    };
    items: OrderItem[];
    store_subtotal: number;
}

interface Order {
    id: number;
    order_number: string;
    is_multi_store: boolean;
    status: string;
    total_amount: number | string;
    subtotal: number;
    tax: number;
    delivery_address: string;
    delivery_fee: number | string;
    tracking_code: string | null;
    label_url: string | null;
    carrier: string | null;
    service: string | null;
    shipping_cost: number | string | null;
    shipping_method: 'shipping' | 'fast_delivery';
    is_ready_for_delivery: boolean;
    ready_at: string | null;
    created_at: string;
    updated_at: string;
    items_by_store: StoreGroup[];
    user_address: {
        id: number;
        type: string;
        label: string;
        street_address: string;
        city: string;
        state: string;
        zip_code: string;
        delivery_instructions: string | null;
    } | null;
    payment: Payment | null;
    status_history: StatusHistory[];
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

interface OrderShowProps {
    order: Order;
    progressData: ProgressData;
}

export default function OrderShow({ order, progressData }: OrderShowProps) {
    const { flash } = usePage().props as any;

    // Show success message if redirected from checkout
    useEffect(() => {
        if (flash?.toast_message) {
            toast.success(flash.toast_message);
        } else if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return 'bg-blue-100 text-blue-800';
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'shipped':
                return 'bg-purple-100 text-purple-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return <CheckCircle className="w-5 h-5" />;
            case 'processing':
                return <Package className="w-5 h-5" />;
            case 'shipped':
                return <Truck className="w-5 h-5" />;
            case 'delivered':
                return <CheckCircle className="w-5 h-5" />;
            default:
                return <Clock className="w-5 h-5" />;
        }
    };

    const formatPrice = (price: number | string) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return numPrice.toFixed(2);
    };

    // Use order totals (simplified structure)
    const displaySubtotal = order.subtotal;
    const displayDeliveryFee = order.delivery_fee;
    const displayTax = order.tax;
    const displayTotal = order.total_amount;

    return (
        <CustomerLayout>
            <Head title={`Order ${order.order_number}`} />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Success Banner for New Orders */}
                    {flash?.order_confirmed && (
                        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center">
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                                <div>
                                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                                        Order Confirmed!
                                    </h3>
                                    <p className="text-green-700 dark:text-green-300">
                                        Your order has been successfully placed. You'll receive a confirmation email shortly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Header - Matching the image design */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Order #{order.order_number}
                                </h1>
                                <div className="w-3 h-3 bg-purple-600 dark:bg-purple-500 rounded-sm transform rotate-45"></div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{order.status}</span>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{order.created_at}</span>
                                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View invoice
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Order Overview */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Order</h2>
                                    {order.is_multi_store && (
                                        <div className="flex items-center space-x-2">
                                            <Badge className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                                                Multiple Stores
                                            </Badge>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {order.items_by_store && Array.isArray(order.items_by_store) ? order.items_by_store.length : 0} stores
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {order.is_multi_store ? (
                                    <div className="space-y-6">
                                        {/* Multi-Store Information Banner */}
                                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-white text-xs font-bold">i</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                        Multi-Store Order Information
                                                    </h3>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        Your order contains items from different stores. Each store will prepare and deliver their items independently. 
                                                        You'll receive separate deliveries from each store as they become ready. Track the status of each shipment below.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Store Shipments */}
                                        {order.items_by_store && Array.isArray(order.items_by_store) && order.items_by_store.map((storeGroup, index) => (
                                            <div key={storeGroup.store.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                                <div className="flex items-center space-x-2 mb-4">
                                                    <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                                                        <Package className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Items from {storeGroup.store.name}
                                                    </h3>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    {storeGroup.items.map((item) => (
                                                        <div key={item.id} className="flex items-center space-x-4">
                                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                                <span className="text-2xl">{item.product.image}</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-gray-900 dark:text-white">{item.product.name}</h4>
                                                                <div className="flex items-center space-x-2">
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                                                                    <Badge className={`text-xs ${
                                                                        item.status === 'pending' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                                                                        item.status === 'ready' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                                                                        item.status === 'collected' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                                                        item.status === 'packaged' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                                                                        item.status === 'shipped' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                                                                        item.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' :
                                                                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                                    }`}>
                                                                        {item.status === 'pending' && '⏳ Pending'}
                                                                        {item.status === 'ready' && '✅ Ready'}
                                                                        {item.status === 'collected' && '📦 Collected'}
                                                                        {item.status === 'packaged' && '📋 Packaged'}
                                                                        {item.status === 'shipped' && '🚚 Shipped'}
                                                                        {item.status === 'delivered' && '✅ Delivered'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-semibold text-gray-900 dark:text-white">${formatPrice(item.total_price)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <Separator className="my-4" />
                                                
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">🏪</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">Sold by {storeGroup.store.name}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {order.is_ready_for_delivery ? '✅ Ready for delivery' : '⏳ Preparing items'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            Store Total: ${formatPrice(storeGroup.store_subtotal)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Single Store Order */
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                                                <Package className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Items in this {order.shipping_method === 'shipping' ? 'shipment' : 'delivery'}
                                            </h3>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {order.items_by_store && Array.isArray(order.items_by_store) && order.items_by_store[0]?.items?.map((item) => (
                                                <div key={item.id} className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                        <span className="text-2xl">{item.product.image}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.product.name}</h4>
                                                        <div className="flex items-center space-x-2">
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                                                            <Badge className={`text-xs ${
                                                                item.status === 'pending' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                                                                item.status === 'ready' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                                                                item.status === 'collected' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                                                item.status === 'packaged' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                                                                item.status === 'shipped' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                                                                item.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' :
                                                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                            }`}>
                                                                {item.status === 'pending' && '⏳ Pending'}
                                                                {item.status === 'ready' && '✅ Ready'}
                                                                {item.status === 'collected' && '📦 Collected'}
                                                                {item.status === 'packaged' && '📋 Packaged'}
                                                                {item.status === 'shipped' && '🚚 Shipped'}
                                                                {item.status === 'delivered' && '✅ Delivered'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900 dark:text-white">${formatPrice(item.total_price)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <Separator className="my-4" />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">🏪</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">Sold by {order.items_by_store && Array.isArray(order.items_by_store) && order.items_by_store[0]?.store?.name || 'Store'}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {order.is_ready_for_delivery ? '✅ Ready for delivery' : '⏳ Preparing items'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {order.shipping_method === 'shipping' ? 'Shipment' : 'Delivery'} Total: ${formatPrice(order.total_amount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Payment method</h3>
                                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                            {order.payment?.payment_method || 'Stripe'}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Payment status</h3>
                                        <Badge className={getStatusColor(order.payment?.status || 'completed')}>
                                            {order.payment?.status || 'Paid'}
                                        </Badge>
                                    </div>
                                </div>
                                
                                {/* Delivery Method */}
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Delivery method</h3>
                                    <div className="flex items-center space-x-2">
                                        {order.shipping_method === 'shipping' ? (
                                            <>
                                                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    Standard Shipping
                                                </span>
                                                {order.carrier && (
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        via {order.carrier} {order.service}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Home className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    Local Express
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Order Status Timeline */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Order status</h2>
                                
                                <div className="space-y-6">
                                    {/* Created Status - Always completed */}
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <Badge className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">CREATED</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {order.items_by_store && Array.isArray(order.items_by_store) ? 
                                                    order.items_by_store.reduce((total, storeGroup) => total + (storeGroup.items?.length || 0), 0) : 
                                                    0
                                                } items were bought on {order.created_at}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Processing Status - Based on order status */}
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                order.status === 'confirmed' || order.status === 'processing' ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}>
                                                <Package className={`w-4 h-4 ${
                                                    order.status === 'confirmed' || order.status === 'processing' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                                                }`} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <Badge className={`${
                                                    order.status === 'confirmed' || order.status === 'processing' 
                                                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200' 
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                }`}>
                                                    PROCESSING
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {order.status === 'confirmed' || order.status === 'processing' 
                                                    ? 'Order is being prepared for shipment' 
                                                    : 'Order processing completed'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Shipped Status - Based on tracking code and order status */}
                                    {(order.tracking_code || order.status === 'shipped' || order.status === 'delivered') && (
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                    order.status === 'shipped' || order.status === 'delivered' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                                }`}>
                                                    <Truck className={`w-4 h-4 ${
                                                        order.status === 'shipped' || order.status === 'delivered' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                                                    }`} />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Badge className={`${
                                                        order.status === 'shipped' || order.status === 'delivered'
                                                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                    }`}>
                                                        SHIPPED
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    {order.tracking_code 
                                                        ? `Parcel shipped via ${order.carrier || 'carrier'} on ${order.updated_at}`
                                                        : 'Items have been shipped'
                                                    }
                                                </p>
                                                {order.tracking_code && (
                                                    <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Shipment tracking
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Delivered Status - Based on order status */}
                                    {order.status === 'delivered' && (
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Badge className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">DELIVERED</Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Order has been successfully delivered
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Summary */}
                        <div className="space-y-6">
                            {/* Summary Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {order.is_multi_store ? 'All stores total' : 'Order total'}
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">${formatPrice(displaySubtotal)}</span>
                                    </div>
                                    
                                    {(typeof displayDeliveryFee === 'string' ? parseFloat(displayDeliveryFee) : displayDeliveryFee) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {order.shipping_method === 'shipping' ? 'Shipping costs' : 'Delivery fee'}
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">${formatPrice(displayDeliveryFee)}</span>
                                        </div>
                                    )}
                                    
                                    {order.shipping_cost && (typeof order.shipping_cost === 'string' ? parseFloat(order.shipping_cost) : order.shipping_cost) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {order.shipping_method === 'shipping' ? 'Shipping costs' : 'Delivery fee'}
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">${formatPrice(order.shipping_cost)}</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">VAT</span>
                                        <span className="font-medium text-gray-900 dark:text-white">${formatPrice(displayTax)}</span>
                                    </div>
                                    
                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                                        <div className="flex justify-between font-semibold">
                                            <span className="text-gray-900 dark:text-white">
                                                {order.is_multi_store ? 'Total amount payable (all stores)' : 'Total amount payable'}
                                            </span>
                                            <span className="text-gray-900 dark:text-white">${formatPrice(displayTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Status Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Status</h2>
                                <div className="space-y-4">
                                    {/* Overall Progress */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                                        <Badge className={`${
                                            progressData.currentStatus === 'pending' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                                            progressData.currentStatus === 'ready' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                                            progressData.currentStatus === 'collected' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                            progressData.currentStatus === 'packaged' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                                            progressData.currentStatus === 'shipped' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                                            progressData.currentStatus === 'delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' :
                                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {progressData.currentStatus === 'pending' && '⏳ Pending'}
                                            {progressData.currentStatus === 'ready' && '✅ Ready'}
                                            {progressData.currentStatus === 'collected' && '📦 Collected'}
                                            {progressData.currentStatus === 'packaged' && '📋 Packaged'}
                                            {progressData.currentStatus === 'shipped' && '🚚 Shipped'}
                                            {progressData.currentStatus === 'delivered' && '✅ Delivered'}
                                        </Badge>
                                    </div>
                                    
                                    {/* Progress Description */}
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {progressData.overallProgress}
                                    </div>
                                    
                                    {/* Item Status Breakdown */}
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">Item Status Breakdown:</div>
                                        {Object.entries(progressData.itemStatusCounts).map(([status, count]) => {
                                            if (count === 0) return null;
                                            return (
                                                <div key={status} className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400 capitalize">{status}:</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{count} items</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Details Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice details</h2>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Invoice #{order.order_number}</span>
                                    <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
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
