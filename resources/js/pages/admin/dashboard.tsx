import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    Store as StoreIcon,
    Tag,
    AlertTriangle,
    Eye,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    XCircle,
    Zap,
    BarChart3,
    PieChart as PieChartIcon,
    Download,
    ChevronDown,
    Calendar
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { SharedData } from '@/types';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface Stats {
    total_orders: number;
    total_products: number;
    total_customers: number;
    total_stores: number;
    total_categories: number;
    total_revenue: number;
    monthly_revenue: number;
    revenue_growth: number;
    monthly_orders: number;
    orders_growth: number;
}

interface RecentOrder {
    id: number;
    order_number: string;
    customer_name: string;
    store_name: string;
    total_amount: number;
    status: string;
    created_at: string;
}

interface LowStockProduct {
    id: number;
    name: string;
    stock_quantity: number;
    image: string;
}

interface SalesData {
    date: string;
    sales: number;
}

interface OrdersByStatus {
    status: string;
    count: number;
}

interface DashboardProps {
    stats: Stats;
    recent_orders: RecentOrder[];
    low_stock_products: LowStockProduct[];
    sales_chart_data: SalesData[];
    orders_by_status: OrdersByStatus[];
}

const STATUS_COLORS: Record<string, string> = {
    pending_payment: '#F59E0B',
    payment_failed: '#EF4444',
    confirmed: '#3B82F6',
    processing: '#8B5CF6',
    shipped: '#A855F7',
    delivered: '#10B981',
    refunded: '#F97316',
};

export default function AdminDashboard() {
    const { auth, stats, recent_orders, low_stock_products, sales_chart_data, orders_by_status } =
        usePage<SharedData & DashboardProps>().props;

    const [timePeriod, setTimePeriod] = useState('Last 7 days');

    const formatStatusLabel = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const [isMounted, setIsMounted] = useState(false);

    // Set mounted state after component mounts
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const isImageUrl = (image: string) => {
        return image && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/'));
    };

    // Calculate completion rate
    const deliveredOrders = orders_by_status.find(o => o.status === 'delivered')?.count || 0;
    const completionRate = stats.total_orders > 0 ? Math.round((deliveredOrders / stats.total_orders) * 100) : 0;

    // Export data as CSV
    const handleExportData = () => {
        // Prepare CSV data
        const csvData = [
            ['Metric', 'Value'],
            ['Total Revenue', formatCurrency(stats.total_revenue)],
            ['Monthly Revenue', formatCurrency(stats.monthly_revenue)],
            ['Revenue Growth', `${stats.revenue_growth}%`],
            ['Total Orders', stats.total_orders],
            ['Monthly Orders', stats.monthly_orders],
            ['Orders Growth', `${stats.orders_growth}%`],
            ['Total Customers', stats.total_customers],
            ['Total Products', stats.total_products],
            ['Total Stores', stats.total_stores],
            ['Total Categories', stats.total_categories],
            ['Completion Rate', `${completionRate}%`],
            [''],
            ['Order Status Breakdown', 'Count'],
            ...orders_by_status.map(item => [formatStatusLabel(item.status), item.count]),
            [''],
            ['Recent Orders', ''],
            ['Order Number', 'Customer', 'Store', 'Amount', 'Status', 'Date'],
            ...recent_orders.map(order => [
                order.order_number,
                order.customer_name,
                order.store_name,
                formatCurrency(order.total_amount),
                formatStatusLabel(order.status),
                order.created_at
            ]),
        ];

        // Convert to CSV string
        const csvContent = csvData.map(row => row.join(',')).join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout>
            <Head title="Dashboard" />

            <div className="space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Welcome back, {auth.user?.name}. Here's what's happening today.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleExportData}
                            className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-sm">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {timePeriod}
                                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={() => setTimePeriod('Last 7 days')}
                                    className="cursor-pointer"
                                >
                                    <span className={timePeriod === 'Last 7 days' ? 'font-semibold' : ''}>
                                        Last 7 days
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setTimePeriod('Last 30 days')}
                                    className="cursor-pointer"
                                >
                                    <span className={timePeriod === 'Last 30 days' ? 'font-semibold' : ''}>
                                        Last 30 days
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setTimePeriod('Last 90 days')}
                                    className="cursor-pointer"
                                >
                                    <span className={timePeriod === 'Last 90 days' ? 'font-semibold' : ''}>
                                        Last 90 days
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setTimePeriod('This Year')}
                                    className="cursor-pointer"
                                >
                                    <span className={timePeriod === 'This Year' ? 'font-semibold' : ''}>
                                        This Year
                                    </span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Primary Revenue Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-8"
                    >
                        <Card className="h-full border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden bg-white dark:bg-gray-900/50">
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-2">
                                            <DollarSign className="h-4 w-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Net Sales</span>
                                        </div>
                                        <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                                            {formatCurrency(stats.total_revenue)}
                                        </h2>
                                        <div className="flex items-center mt-3 gap-2">
                                            <Badge className={`rounded-full px-2.5 py-0.5 font-bold ${stats.revenue_growth >= 0
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-800'
                                                }`}>
                                                {stats.revenue_growth >= 0 ? '+' : ''}{stats.revenue_growth.toFixed(1)}%
                                            </Badge>
                                            <span className="text-xs font-medium text-gray-400 underline decoration-dotted">vs previous period</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Live Updates</span>
                                    </div>
                                </div>

                                <div className="h-48 mt-4">
                                    {isMounted && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={sales_chart_data}>
                                                <defs>
                                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#f1f5f9" className="dark:stroke-gray-800" />
                                                <XAxis
                                                    dataKey="date"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    style={{ fontSize: '10px', fontWeight: 600 }}
                                                    tick={{ fill: '#94a3b8' }}
                                                    dy={10}
                                                />
                                                <Tooltip
                                                    cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-xl shadow-xl">
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{payload[0].payload.date}</p>
                                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                        {formatCurrency(payload[0].value as number)}
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="sales"
                                                    stroke="#10b981"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#revenueGradient)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Side Metrics */}
                    <div className="lg:col-span-4 grid grid-cols-1 gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-gray-200 dark:hover:border-gray-700 transition-colors bg-white dark:bg-gray-900/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                        <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-gray-300" />
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {stats.total_orders.toLocaleString()}
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xs font-bold ${stats.orders_growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {stats.orders_growth >= 0 ? '+' : ''}{stats.orders_growth.toFixed(1)}%
                                        </p>
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Growth</p>
                                    </div>
                                </div>
                                <div className="h-12 mt-4 opacity-50 grayscale">
                                    {isMounted && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={sales_chart_data.map(d => ({ v: d.sales * (0.8 + Math.random() * 0.4) }))}>
                                                <Line type="monotone" dataKey="v" stroke="#64748b" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-gray-200 dark:hover:border-gray-700 transition-colors bg-white dark:bg-gray-900/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <Link href="/admin/users" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Customers</p>
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                            {stats.total_customers.toLocaleString()}
                                        </h3>
                                    </div>
                                    <div className="w-16 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">+12%</span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Products', value: stats.total_products, icon: Package, color: 'blue' },
                        { label: 'Stores', value: stats.total_stores, icon: StoreIcon, color: 'emerald' },
                        { label: 'Categories', value: stats.total_categories, icon: Tag, color: 'rose' },
                        { label: 'Conversion', value: `${completionRate}%`, icon: Zap, color: 'amber' },
                    ].map((item, i) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                        >
                            <Card className="p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center space-x-4 bg-white dark:bg-gray-900/50">
                                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/20 flex items-center justify-center flex-shrink-0`}>
                                    <item.icon className={`h-6 w-6 text-${item.color}-600 dark:text-${item.color}-400`} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{item.value}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Charts Column */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* Status Grid Combined with Chart */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="md:col-span-1"
                            >
                                <Card className="p-6 border border-gray-100 dark:border-gray-800 shadow-sm h-full bg-white dark:bg-gray-900/50">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Distribution</h3>
                                    <div className="space-y-4">
                                        {orders_by_status.slice(0, 5).map((item) => (
                                            <div key={item.status}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter truncate max-w-[100px]">
                                                        {formatStatusLabel(item.status)}
                                                    </span>
                                                    <span className="text-xs font-black text-gray-900 dark:text-white">
                                                        {Math.round((item.count / stats.total_orders) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="h-1 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full transition-all duration-1000"
                                                        style={{
                                                            width: `${(item.count / stats.total_orders) * 100}%`,
                                                            backgroundColor: STATUS_COLORS[item.status] || '#94A3B8'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Pro Tip</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-gray-500 mt-2 leading-relaxed">
                                            Confirmed orders are up <span className="text-blue-600 font-bold">+5.2%</span>. Consider increasing staff for peak hours.
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="md:col-span-2"
                            >
                                <Card className="p-6 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900/50">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Revenue Performance</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Daily Bar Chart</p>
                                        </div>
                                        <div className="flex space-x-1">
                                            {['D', 'W', 'M'].map(p => (
                                                <button key={p} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === 'D' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-64">
                                        {isMounted && (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={sales_chart_data}>
                                                    <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#f1f5f9" className="dark:stroke-gray-800" />
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        style={{ fontSize: '10px', fontWeight: 600 }}
                                                        tick={{ fill: '#94a3b8' }}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        style={{ fontSize: '10px', fontWeight: 600 }}
                                                        tick={{ fill: '#94a3b8' }}
                                                        tickFormatter={(value) => `$${value}`}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: '#f8fafc', opacity: 0.4 }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-gray-900 text-white p-3 rounded-xl shadow-2xl border-0">
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{payload[0].payload.date}</p>
                                                                        <p className="text-sm font-black">{formatCurrency(payload[0].value as number)}</p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                                                        {sales_chart_data.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === sales_chart_data.length - 1 ? '#10b981' : '#e2e8f0'} className="dark:fill-gray-800 hover:fill-emerald-500 transition-colors" />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    </div>

                    {/* Timeline Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="lg:col-span-4"
                    >
                        <Card className="h-full border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900/50">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Activity</h3>
                                <Link href="/admin/orders" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-2 py-1 rounded-lg transition-colors">
                                    History
                                </Link>
                            </div>
                            <div className="p-6 space-y-8 overflow-y-auto max-h-[600px] scrollbar-thin">
                                {recent_orders.slice(0, 8).map((order) => (
                                    <div key={order.id} className="relative pl-6">
                                        <div className="absolute left-0 top-1 w-[1px] h-[calc(100%+32px)] bg-gray-100 dark:bg-gray-800 last:h-0" />
                                        <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${order.status === 'delivered' ? 'bg-emerald-500' :
                                            order.status === 'shipped' ? 'bg-blue-500' :
                                                order.status === 'processing' ? 'bg-indigo-500' :
                                                    'bg-amber-500'
                                            }`} />
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-black text-gray-900 dark:text-white">{order.order_number}</p>
                                                <span className="text-[10px] font-bold text-gray-400">{order.created_at}</span>
                                            </div>
                                            <p className="text-[11px] font-medium text-gray-500 mt-1 uppercase tracking-tight">
                                                {order.customer_name}
                                            </p>
                                            <div className="flex items-center mt-2 space-x-2">
                                                <span className="text-[10px] font-black text-white bg-gray-900 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                    {formatCurrency(order.total_amount)}
                                                </span>
                                                <div
                                                    className="w-1 h-1 rounded-full bg-gray-200"
                                                />
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {formatStatusLabel(order.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Low Stock Alert */}
                {low_stock_products.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                    >
                        <Card className="p-6 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10 border-0 shadow-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Low Stock Alert</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {low_stock_products.length} products need restocking
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {low_stock_products.slice(0, 5).map((product) => (
                                                <Badge key={product.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                                                    {product.name} ({product.stock_quantity})
                                                </Badge>
                                            ))}
                                            {low_stock_products.length > 5 && (
                                                <Badge className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                                                    +{low_stock_products.length - 5} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href="/admin/products"
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center gap-2 flex-shrink-0"
                                >
                                    Manage Stock
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </div>
        </AdminLayout>
    );
}
