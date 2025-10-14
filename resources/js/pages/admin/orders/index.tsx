import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Edit,
    Copy,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Search,
    Plus,
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import AdminLayout from '@/layouts/admin-layout';

interface Order {
    id: number;
    order_number: string;
    status: string;
    total_amount: number | string;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    order_items: Array<{
        id: number;
        quantity: number;
    }>;
    payment_transactions: Array<{
        id: number;
        status: string;
    }>;
}

interface OrdersPageProps {
    orders: {
        data: Order[];
        links: any[];
        meta: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
        };
    };
}

export default function OrdersPage({ orders }: OrdersPageProps) {
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const filterOptions = [
        { key: 'All', label: 'All', color: 'bg-gray-900' },
        { key: 'Pending', label: 'Pending', color: 'bg-orange-500' },
        { key: 'In Transit', label: 'In Transit', color: 'bg-blue-500' },
        { key: 'Completed', label: 'Completed', color: 'bg-green-500' },
        { key: 'Canceled', label: 'Canceled', color: 'bg-red-500' },
    ];

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        // Map filter to actual status values
        let status = '';
        switch (filter) {
            case 'Pending':
                status = 'confirmed';
                break;
            case 'In Transit':
                status = 'processing';
                break;
            case 'Completed':
                status = 'delivered';
                break;
            case 'Canceled':
                status = 'refunded';
                break;
            default:
                status = 'all';
        }
        
        router.get('/admin/orders', { status }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = () => {
        router.get('/admin/orders', { search: searchTerm }, {
            preserveState: true,
            preserveScroll: true,
        });
    };


    const handleCreateOrder = () => {
        // Navigate to create order page
        router.visit('/admin/orders/create');
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending_payment':
            case 'confirmed':
                return { bg: 'bg-orange-500', text: 'Pending' };
            case 'processing':
            case 'shipped':
                return { bg: 'bg-blue-500', text: 'In Transit' };
            case 'delivered':
                return { bg: 'bg-green-500', text: 'Completed' };
            case 'refunded':
                return { bg: 'bg-red-500', text: 'Canceled' };
            default:
                return { bg: 'bg-gray-500', text: status };
        }
    };

    const getPaymentStatus = (order: Order) => {
        const latestTransaction = order.payment_transactions?.[0];
        if (!latestTransaction) return 'Unpaid';
        return latestTransaction.status === 'completed' ? 'Paid' : 'Unpaid';
    };

    const formatPrice = (price: number | string) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return `$${numPrice.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        const year = date.getFullYear();
        const time = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        return `${month} ${day}, ${year} at ${time}`;
    };

    const getItemCount = (order: Order) => {
        return order.order_items?.reduce((total, item) => total + item.quantity, 0) || 0;
    };

    return (
        <AdminLayout>
            <Head title="Orders Management" />
            
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Filter and Action Bar */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            {/* Left Section - Filter Container */}
                            <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center space-x-0">
                                {filterOptions.map((option, index) => (
                                    <div key={option.key} className="flex items-center">
                                        <button
                                            onClick={() => handleFilterChange(option.key)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center ${
                                                activeFilter === option.key
                                                    ? 'bg-gray-800 text-white'
                                                    : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {option.key === 'All' && activeFilter === 'All' && (
                                                <ChevronDown className="w-3 h-3 mr-1 text-white" />
                                            )}
                                            <div className={`w-2 h-2 ${option.color} rounded-full mr-2`}></div>
                                            {option.label}
                                        </button>
                                        {index < filterOptions.length - 1 && (
                                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                        )}
                                    </div>
                                ))}
                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                <button className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
                                    <Plus className="w-3 h-3 text-gray-600" />
                                </button>
                            </div>

                            {/* Right Section - Action Buttons */}
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search Order..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="pl-10 pr-12 py-2 w-64 h-10 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-medium cursor-pointer p-1 rounded-full border border-gray-200"
                                    >
                                        Search
                                        {/* <Search className="w-4 h-4" /> */}
                                    </button>
                                </div>
                                <button 
                                    onClick={handleCreateOrder}
                                    className="px-4 py-2 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Order
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-12 px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Item
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders?.data?.map((order) => {
                                        const statusInfo = getStatusColor(order.status);
                                        const paymentStatus = getPaymentStatus(order);
                                        const itemCount = getItemCount(order);
                                        
                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        #{order.order_number}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {formatDate(order.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                            <span className="text-xs font-medium text-gray-600">
                                                                {order.user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {order.user.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {itemCount}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatPrice(order.total_amount)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`w-1 h-6 ${statusInfo.bg} rounded-full mr-2`}></div>
                                                        <span className="text-sm text-gray-900">{statusInfo.text}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className={`text-sm font-medium ${
                                                        paymentStatus === 'Paid' 
                                                            ? 'text-green-600' 
                                                            : 'text-red-600'
                                                    }`}>
                                                        {paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <Link href={`/admin/orders/${order.id}`}>
                                                                <Eye className="w-4 h-4" />
                                                        </Link>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <button className="p-1 text-gray-400 hover:text-gray-600">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete order #{order.order_number}? 
                                                                        This action cannot be undone and will permanently remove the order and all its data.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => {
                                                                            router.delete(`/admin/orders/${order.id}`, {
                                                                                onSuccess: () => {
                                                                                    // Order deleted successfully - page will redirect
                                                                                },
                                                                                onError: (errors) => {
                                                                                    console.error('Delete failed:', errors);
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                                    >
                                                                        Delete Order
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {orders?.links && orders.links.length > 3 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {orders.links.map((link: any, index: number) => {
                                    if (index === 0) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                disabled={!link.url}
                                                onClick={() => link.url && (window.location.href = link.url)}
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-1" />
                                                Previous
                                            </Button>
                                        );
                                    }
                                    
                                    if (index === orders.links.length - 1) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                disabled={!link.url}
                                                onClick={() => link.url && (window.location.href = link.url)}
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        );
                                    }
                                    
                                    if (link.label === '...') {
                                        return (
                                            <span key={index} className="text-gray-500 px-2">
                                                ...
                                            </span>
                                        );
                                    }
                                    
                                    return (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            className={`h-8 w-8 ${link.active ? 'bg-gray-900 text-white' : ''}`}
                                            disabled={!link.url}
                                            onClick={() => link.url && (window.location.href = link.url)}
                                        >
                                            {link.label}
                                        </Button>
                                    );
                                })}
                            </div>
                            <div className="text-sm text-gray-600">
                                Showing {((orders.meta.current_page - 1) * orders.meta.per_page) + 1} to {Math.min(orders.meta.current_page * orders.meta.per_page, orders.meta.total)} of {orders.meta.total} entries
                                <button className="ml-2 text-blue-600 hover:text-blue-800">Show All</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}