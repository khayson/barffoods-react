import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    Package, 
    Clock, 
    CheckCircle, 
    AlertCircle,
    Store,
    Calendar,
    Search,
    Filter,
    Eye,
    Edit,
    Star,
    User,
    Truck,
    Home,
    ChevronDown,
    ChevronUp,
    ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';

interface OrderItem {
    id: number;
    product: {
        id: string;
        name: string;
    };
    store: {
        id: string;
        name: string;
    };
    quantity: number;
    unit_price: number | string;
    total_price: number | string;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    total_amount: number | string;
    is_ready_for_delivery: boolean;
    created_at: string;
    store_names: string[];
    is_multi_store: boolean;
    user: {
        id: number;
        name: string;
        email: string;
    };
    shipping_method?: 'shipping' | 'fast_delivery';
}

interface OrdersPageProps {
    orders: {
        data: Order[];
        links: any[];
        meta: any;
    };
    stores: Array<{
        id: string;
        name: string;
    }>;
    filters: {
        status: string;
        store_id: string;
        search: string;
    };
}

export default function OrdersPage({ orders, stores, filters }: OrdersPageProps) {
    const [sortField, setSortField] = useState<string>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'processing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
            case 'shipped': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
            case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const formatPrice = (price: number | string) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return numPrice.toFixed(2);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const toggleExpanded = (orderId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedRows(newExpanded);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    return (
        <AdminLayout>
            <Head title="Orders Management" />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all orders in one place</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                    {orders?.meta?.total || 0} total orders
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6 shadow-sm border-0 bg-white dark:bg-gray-800">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="Search by order number, customer name, or email..."
                                            defaultValue={filters.search}
                                            className="pl-10 h-11 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>
                                <Select defaultValue={filters.status}>
                                    <SelectTrigger className="w-full sm:w-48 h-11 border-gray-200 dark:border-gray-700">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select defaultValue={filters.store_id}>
                                    <SelectTrigger className="w-full sm:w-48 h-11 border-gray-200 dark:border-gray-700">
                                        <SelectValue placeholder="Store" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Stores</SelectItem>
                                        {stores.map((store) => (
                                            <SelectItem key={store.id} value={store.id}>
                                                {store.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button className="h-11 px-6 bg-green-600 hover:bg-green-700 text-white">
                                    <Filter className="w-4 h-4 mr-2" />
                                    Apply
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Orders Table */}
                    <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-gray-200 dark:border-gray-700">
                                            <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                                            <th 
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                                onClick={() => handleSort('order_number')}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <span>Order</span>
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </div>
                                            </th>
                                            <th 
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                                onClick={() => handleSort('status')}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <span>Status</span>
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </div>
                                            </th>
                                            <th 
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                                onClick={() => handleSort('total_amount')}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <span>Amount</span>
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </div>
                                            </th>
                                            <th 
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                                onClick={() => handleSort('created_at')}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <span>Date</span>
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </div>
                                            </th>
                                            <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders?.data?.length ? orders.data.map((order) => {
                                            const isExpanded = expandedRows.has(order.id);
                                            
                                            return (
                                                <React.Fragment key={order.id}>
                                                    <tr className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => toggleExpanded(order.id)}
                                                                className="w-8 h-8 p-0"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="w-4 h-4" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                                                    <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                                        #{order.order_number}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                                                <Badge className={getStatusColor(order.status)}>
                                                                    {order.status}
                                                                </Badge>
                                                                {order.is_ready_for_delivery ? (
                                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                                ) : (
                                                                    <Clock className="w-4 h-4 text-orange-500" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                                ${formatPrice(order.total_amount)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                {formatDate(order.created_at)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <Link href={`/admin/orders/${order.id}`}>
                                                                <Button variant="outline" size="sm">
                                                                    <Eye className="w-4 h-4 mr-2" />
                                                                    View Details
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                    
                                                    {/* Expanded Row */}
                                                    {isExpanded && (
                                                        <tr className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                            <td colSpan={6}>
                                                                <div className="p-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Order Details</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                                                                                    <span className="text-gray-900 dark:text-white">{order.id}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-gray-600 dark:text-gray-400">Ready Status:</span>
                                                                                    <span className={order.is_ready_for_delivery ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                                                                                        {order.is_ready_for_delivery ? 'Ready' : 'Preparing'}
                                                                                    </span>
                                                                                </div>
                                                                                {order.shipping_method && (
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-gray-600 dark:text-gray-400">Delivery:</span>
                                                                                        <div className="flex items-center space-x-1">
                                                                                            {order.shipping_method === 'shipping' ? (
                                                                                                <Truck className="w-3 h-3 text-blue-500" />
                                                                                            ) : (
                                                                                                <Home className="w-3 h-3 text-green-500" />
                                                                                            )}
                                                                                            <span className="text-gray-900 dark:text-white">
                                                                                                {order.shipping_method === 'shipping' ? 'Shipping' : 'Local Express'}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* Store Information */}
                                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Store Information</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                {order.store_names?.length > 0 ? (
                                                                                    order.store_names.map((storeName, index) => (
                                                                                        <div key={index} className="flex items-center space-x-2">
                                                                                            <Store className="w-4 h-4 text-gray-400" />
                                                                                            <span className="text-gray-900 dark:text-white">{storeName}</span>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-gray-500 dark:text-gray-400">No stores</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={6} className="text-center py-12">
                                                    <div className="flex flex-col items-center space-y-4">
                                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                            <Package className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No orders found</h3>
                                                            <p className="text-gray-600 dark:text-gray-400">No orders have been created yet.</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {orders?.links && orders.links.length > 3 && (
                        <div className="mt-6 flex items-center justify-center">
                            <div className="flex items-center space-x-2">
                                {orders.links.map((link: any, index: number) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && (window.location.href = link.url)}
                                        className="w-10 h-10"
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}