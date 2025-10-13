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

interface RelatedOrder {
    id: number;
    order_number: string;
    status: string;
    total_amount: number | string;
    is_ready_for_delivery: boolean;
    ready_at: string | null;
    shipping_method: 'shipping' | 'local_delivery';
    store: {
        id: string;
        name: string;
        address: string;
    };
    items: OrderItem[];
}

interface Order {
    id: number;
    order_number: string;
    order_group_id?: number;
    order_group_number?: string;
    is_multi_store: boolean;
    status: string;
    total_amount: number | string;
    delivery_address: string;
    delivery_fee: number | string;
    delivery_time_estimate: number;
    tracking_code: string | null;
    label_url: string | null;
    carrier: string | null;
    service: string | null;
    shipping_cost: number | string | null;
    shipping_method: 'shipping' | 'local_delivery';
    is_ready_for_delivery: boolean;
    ready_at: string | null;
    tax: number;
    subtotal: number;
    group_subtotal: number;
    group_delivery_fee: number;
    group_tax: number;
    group_total: number;
    created_at: string;
    updated_at: string;
    store: {
        id: string;
        name: string;
        address: string;
    };
    related_orders: RelatedOrder[];
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
    items: OrderItem[];
    payment: Payment | null;
    status_history: StatusHistory[];
}

interface OrderShowProps {
    order: Order;
}

export default function OrderShow({ order }: OrderShowProps) {
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

    // Use appropriate totals based on order type
    const displaySubtotal = order.is_multi_store ? order.group_subtotal : order.subtotal;
    const displayDeliveryFee = order.is_multi_store ? order.group_delivery_fee : order.delivery_fee;
    const displayTax = order.is_multi_store ? order.group_tax : order.tax;
    const displayTotal = order.is_multi_store ? order.group_total : order.total_amount;

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
                                                {order.related_orders.length + 1} stores
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

                                        {/* Current Store Shipment */}
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
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="flex items-center space-x-4">
                                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                            <span className="text-2xl">{item.product.image}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900 dark:text-white">{item.product.name}</h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
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
                                                        <p className="font-semibold text-gray-900 dark:text-white">Sold by {order.store.name}</p>
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

                                        {/* Related Store Shipments */}
                                        {order.related_orders.map((relatedOrder) => (
                                            <div key={relatedOrder.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                                <div className="flex items-center space-x-2 mb-4">
                                                    <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                                                        <Package className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Items in this {relatedOrder.shipping_method === 'shipping' ? 'shipment' : 'delivery'}
                                                    </h3>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    {relatedOrder.items.map((item) => (
                                                        <div key={item.id} className="flex items-center space-x-4">
                                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                                <span className="text-2xl">{item.product.image}</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-gray-900 dark:text-white">{item.product.name}</h4>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
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
                                                            <p className="font-semibold text-gray-900 dark:text-white">Sold by {relatedOrder.store.name}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {relatedOrder.is_ready_for_delivery ? '✅ Ready for delivery' : '⏳ Preparing items'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {relatedOrder.shipping_method === 'shipping' ? 'Shipment' : 'Delivery'} Total: ${formatPrice(relatedOrder.total_amount)}
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
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                        <span className="text-2xl">{item.product.image}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.product.name}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
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
                                                    <p className="font-semibold text-gray-900 dark:text-white">Sold by {order.store.name}</p>
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
                                                {order.delivery_time_estimate && (
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        ~{order.delivery_time_estimate} min
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Order Status Timeline */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Order status</h2>
                                
                                <div className="space-y-6">
                                    {/* Created Status */}
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">CREATED</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {order.items.length} items were bought on {order.created_at}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Processing Status */}
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                                <Package className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <Badge className="bg-gray-900 dark:bg-gray-600 text-white dark:text-gray-100">PROCESSING</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Order is being prepared for shipment
                                            </p>
                                        </div>
                                    </div>

                                    {/* Shipped Status (if applicable) */}
                                    {order.tracking_code && (
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                                    <Truck className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Badge className="bg-gray-900 dark:bg-gray-600 text-white dark:text-gray-100">SHIPPED</Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    Parcel shipped via {order.carrier} on {order.updated_at}
                                                </p>
                                                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Shipment tracking
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* In Transit Status */}
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                                <Truck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">IN TRANSIT</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivered Status */}
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">DELIVERED</Badge>
                                            </div>
                                        </div>
                                    </div>
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
