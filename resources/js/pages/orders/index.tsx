import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import CustomerLayout from '@/layouts/customer-layout';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface OrderRow {
    id: number;
    order_number: string;
    status: string;
    total_amount: number | string;
    created_at: string;
    items_count: number;
    payment_status?: string | null;
}

interface OrdersIndexProps {
    orders: {
        data: OrderRow[];
        links: any[];
        meta: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
        };
    };
}

export default function OrdersIndex({ orders }: OrdersIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const handleSearch = () => {
        router.get('/orders', { search: searchTerm, status: activeFilter }, { preserveState: true, preserveScroll: true });
    };

    const setFilter = (status: string) => {
        setActiveFilter(status);
        router.get('/orders', { status, search: searchTerm }, { preserveState: true, preserveScroll: true });
    };

    const statusBadge = (status: string) => {
        const s = status.toLowerCase();
        const map: Record<string, string> = {
            pending_payment: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
            confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
            processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
            shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
            delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
            refunded: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
        };
        return map[s] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
    };

    const formatPrice = (price: number | string) => {
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return `$${num.toFixed(2)}`;
    };

    const formatDate = (d: string) => {
        const dt = new Date(d);
        return dt.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <CustomerLayout>
            <Head title="My Orders" />
            <div className="px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between py-6">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">My Orders</h1>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'confirmed', label: 'Pending' },
                            { key: 'processing', label: 'In Transit' },
                            { key: 'delivered', label: 'Completed' },
                            { key: 'refunded', label: 'Canceled' },
                        ].map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                    activeFilter === f.key
                                        ? 'bg-gray-900 text-white dark:bg-gray-200 dark:text-gray-900'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search by order # or status"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 h-10 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                        />
                    </div>
                </div>

                {/* Orders List */}
                <div className="mt-6 space-y-4">
                    {orders.data.map((o) => (
                        <div key={o.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Order</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">#{o.order_number}</div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(o.status)}`}>{o.status}</span>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-gray-700 dark:text-gray-200">{o.items_count} items</div>
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(o.total_amount)}</div>
                                    <div className="text-gray-500 dark:text-gray-400">{formatDate(o.created_at)}</div>
                                    <Link href={`/orders/${o.id}`} className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 dark:text-green-400">
                                        <Eye className="h-4 w-4" /> View
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {orders.links && orders.links.length > 3 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {orders.links.map((link: any, i: number) => {
                                if (i === 0)
                                    return (
                                        <button key={i} disabled={!link.url} onClick={() => link.url && (window.location.href = link.url)} className="h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-sm flex items-center gap-1">
                                            <ChevronLeft className="h-4 w-4" /> Prev
                                        </button>
                                    );
                                if (i === orders.links.length - 1)
                                    return (
                                        <button key={i} disabled={!link.url} onClick={() => link.url && (window.location.href = link.url)} className="h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-sm flex items-center gap-1">
                                            Next <ChevronRight className="h-4 w-4" />
                                        </button>
                                    );
                                if (link.label === '...') return <span key={i} className="px-2 text-gray-500">...</span>;
                                return (
                                    <button key={i} disabled={!link.url} onClick={() => link.url && (window.location.href = link.url)} className={`h-8 w-8 rounded-lg border border-gray-300 dark:border-gray-700 text-sm ${link.active ? 'bg-gray-900 text-white dark:bg-gray-200 dark:text-gray-900' : ''}`}>
                                        {link.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {((orders.meta.current_page - 1) * orders.meta.per_page) + 1} to {Math.min(orders.meta.current_page * orders.meta.per_page, orders.meta.total)} of {orders.meta.total}
                        </div>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}


