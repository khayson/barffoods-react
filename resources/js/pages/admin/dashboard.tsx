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
import { useState } from 'react';
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
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Overview</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time business insights</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            onClick={handleExportData}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export Data
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {timePeriod}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
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

                {/* Bento Grid Layout - Completely Different */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Hero Revenue Card - Large */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-8"
                    >
                        <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <p className="text-emerald-100 text-sm font-medium mb-2">Total Revenue</p>
                                        <h2 className="text-5xl font-bold text-white mb-2">
                                            {formatCurrency(stats.total_revenue)}
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                                                stats.revenue_growth >= 0 
                                                    ? 'bg-white/20 text-white' 
                                                    : 'bg-red-500/20 text-red-100'
                                            }`}>
                                                {stats.revenue_growth >= 0 ? (
                                                    <TrendingUp className="h-4 w-4" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4" />
                                                )}
                                                {Math.abs(stats.revenue_growth).toFixed(1)}%
                                            </span>
                                            <span className="text-emerald-100 text-sm">vs last month</span>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <DollarSign className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                
                                {/* Interactive Mini Chart */}
                                <div className="h-40 mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={sales_chart_data}>
                                            <defs>
                                                <linearGradient id="miniSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0.05}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid 
                                                strokeDasharray="3 3" 
                                                stroke="rgba(255,255,255,0.1)" 
                                                vertical={false}
                                            />
                                            <XAxis 
                                                dataKey="date" 
                                                stroke="rgba(255,255,255,0.6)"
                                                style={{ fontSize: '11px', fill: '#ffffff' }}
                                                tick={{ fill: '#ffffff' }}
                                            />
                                            <YAxis 
                                                stroke="rgba(255,255,255,0.6)"
                                                style={{ fontSize: '11px' }}
                                                tick={{ fill: '#ffffff' }}
                                                tickFormatter={(value) => `$${value}`}
                                            />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: '#ffffff',
                                                    fontSize: '12px'
                                                }}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                                                labelStyle={{ color: '#ffffff' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="sales" 
                                                stroke="#ffffff" 
                                                strokeWidth={3}
                                                fill="url(#miniSales)" 
                                                dot={false}
                                                activeDot={{ 
                                                    r: 6, 
                                                    fill: '#ffffff',
                                                    stroke: 'rgba(0,0,0,0.2)',
                                                    strokeWidth: 2
                                                }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Quick Metrics - Right Side */}
                    <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                        <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <Badge className={`${
                                        stats.orders_growth >= 0 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                    }`}>
                                        {stats.orders_growth >= 0 ? '+' : ''}{stats.orders_growth.toFixed(1)}%
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_orders.toLocaleString()}
                                </h3>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                                    <Link href="/admin/customers" className="text-purple-600 dark:text-purple-400">
                                        <Eye className="h-5 w-5" />
                                    </Link>
                        </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Customers</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_customers.toLocaleString()}
                                </h3>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Second Row - Different Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Stats Grid - 4 Cards */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="p-5 text-center border-0 shadow-md hover:shadow-lg transition-shadow">
                                <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-3">
                                    <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Products</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_products}</p>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card className="p-5 text-center border-0 shadow-md hover:shadow-lg transition-shadow">
                                <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center mx-auto mb-3">
                                    <StoreIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stores</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_stores}</p>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Card className="p-5 text-center border-0 shadow-md hover:shadow-lg transition-shadow">
                                <div className="w-11 h-11 rounded-xl bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center mx-auto mb-3">
                                    <Tag className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Categories</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_categories}</p>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Card className="p-5 text-center border-0 shadow-md hover:shadow-lg transition-shadow">
                                <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-3">
                                    <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rate</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completionRate}%</p>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Order Status Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="lg:col-span-4"
                    >
                        <Card className="p-6 border-0 shadow-lg h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Status</h3>
                                <PieChartIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="space-y-3">
                                {orders_by_status.slice(0, 5).map((item) => (
                                    <div key={item.status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: STATUS_COLORS[item.status] || '#94A3B8' }}
                                            ></div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                                {formatStatusLabel(item.status)}
                                            </span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Activity Feed & Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sales Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="lg:col-span-8"
                    >
                        <Card className="p-6 border-0 shadow-lg">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Trend</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daily performance overview</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                        <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sales_chart_data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#6B7280"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis 
                                            stroke="#6B7280"
                                            style={{ fontSize: '12px' }}
                                            tickFormatter={(value) => `$${value}`}
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                                        />
                                        <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                                            {sales_chart_data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#10B981" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Activity Timeline */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="lg:col-span-4"
                    >
                        <Card className="p-6 border-0 shadow-lg">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                                <Link href="/admin/orders" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                                    View All
                                </Link>
                            </div>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {recent_orders.slice(0, 6).map((order, index) => (
                                    <div key={order.id} className="flex gap-3">
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                order.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/20' :
                                                order.status === 'shipped' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                                order.status === 'processing' ? 'bg-purple-100 dark:bg-purple-900/20' :
                                                'bg-orange-100 dark:bg-orange-900/20'
                                            }`}>
                                                {order.status === 'delivered' ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                ) : order.status === 'payment_failed' ? (
                                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                                ) : (
                                                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                                )}
                                            </div>
                                            {index !== recent_orders.slice(0, 6).length - 1 && (
                                                <div className="absolute left-5 top-10 w-0.5 h-8 bg-gray-200 dark:bg-gray-700"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {order.order_number}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                {order.customer_name} • {formatCurrency(order.total_amount)}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{order.created_at}</p>
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
