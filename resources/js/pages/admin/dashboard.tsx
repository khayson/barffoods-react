import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    ArrowDownRight,
    MoreVertical,
    Calendar,
    Activity
} from 'lucide-react';
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
    PieChart,
    Pie,
    Cell,
    Legend
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

// Status colors for pie chart
const STATUS_COLORS: Record<string, string> = {
    pending_payment: '#FCD34D',
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

    const formatStatusLabel = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
            payment_failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
            confirmed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
            processing: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
            shipped: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
            delivered: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
            refunded: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    };

    const isImageUrl = (image: string) => {
        return image && (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/'));
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Prepare pie chart data
    const pieChartData = orders_by_status.map(item => ({
        name: formatStatusLabel(item.status),
        value: item.count,
        color: STATUS_COLORS[item.status] || '#94A3B8'
    }));

    return (
        <AdminLayout>
            <Head title="Dashboard" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                            <option>Last 90 days</option>
                            <option>This year</option>
                        </select>
                    </div>
                </div>

                {/* Key Metrics - 4 Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Revenue Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="p-6 border-l-4 border-l-green-500">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                        {formatCurrency(stats.total_revenue)}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        {stats.revenue_growth >= 0 ? (
                                            <span className="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                                                <TrendingUp className="h-4 w-4 mr-1" />
                                                {stats.revenue_growth.toFixed(1)}%
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-sm font-medium text-red-600 dark:text-red-400">
                                                <TrendingDown className="h-4 w-4 mr-1" />
                                                {Math.abs(stats.revenue_growth).toFixed(1)}%
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Orders Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="p-6 border-l-4 border-l-blue-500">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                        {stats.total_orders.toLocaleString()}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        {stats.orders_growth >= 0 ? (
                                            <span className="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                                                <TrendingUp className="h-4 w-4 mr-1" />
                                                {stats.orders_growth.toFixed(1)}%
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-sm font-medium text-red-600 dark:text-red-400">
                                                <TrendingDown className="h-4 w-4 mr-1" />
                                                {Math.abs(stats.orders_growth).toFixed(1)}%
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Customers Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="p-6 border-l-4 border-l-purple-500">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                        {stats.total_customers.toLocaleString()}
                                    </h3>
                                    <Link 
                                        href="/admin/customers" 
                                        className="inline-flex items-center text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2"
                                    >
                                        View all customers
                                        <ArrowUpRight className="h-3 w-3 ml-1" />
                                    </Link>
                                </div>
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Products Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="p-6 border-l-4 border-l-orange-500">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                        {stats.total_products.toLocaleString()}
                                    </h3>
                                    <Link 
                                        href="/admin/products" 
                                        className="inline-flex items-center text-xs text-orange-600 dark:text-orange-400 hover:underline mt-2"
                                    >
                                        Manage products
                                        <ArrowUpRight className="h-3 w-3 ml-1" />
                                    </Link>
                                </div>
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                    <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Sales Chart - Takes 2 columns */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="xl:col-span-2"
                    >
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Overview</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last 7 days performance</p>
                                </div>
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                    <MoreVertical className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sales_chart_data}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
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
                                                backgroundColor: '#1F2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Sales']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="sales" 
                                            stroke="#10B981" 
                                            strokeWidth={2}
                                            fill="url(#colorSales)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Orders by Status - Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Orders Status</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Distribution</p>
                                </div>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Bottom Row - Tables */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Recent Orders Table - Takes 2 columns */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="xl:col-span-2"
                    >
                        <Card className="overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest transactions</p>
                                    </div>
                                    <Link 
                                        href="/admin/orders"
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    >
                                        View All
                                        <ArrowUpRight className="h-4 w-4 ml-1" />
                                    </Link>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Order
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Store
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {recent_orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {order.order_number}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {order.created_at}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        {order.customer_name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        {order.store_name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {formatCurrency(order.total_amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge className={`text-xs border ${getStatusColor(order.status)}`}>
                                                        {formatStatusLabel(order.status)}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Low Stock Alerts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Card className="overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                            Low Stock
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {low_stock_products.length} products
                                        </p>
                                    </div>
                                    <Link 
                                        href="/admin/products"
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        View All
                                    </Link>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {low_stock_products.map((product) => (
                                    <div key={product.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                                {isImageUrl(product.image) ? (
                                                    <img 
                                                        src={product.image} 
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl">{product.image || '📦'}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {product.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className="text-xs bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                                        {product.stock_quantity} left
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Quick Stats Footer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <Card className="p-4 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-2">
                            <StoreIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_stores}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Stores</p>
                    </Card>

                    <Card className="p-4 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-2">
                            <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_categories}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Categories</p>
                    </Card>

                    <Card className="p-4 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 mb-2">
                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.monthly_revenue)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monthly Revenue</p>
                    </Card>

                    <Card className="p-4 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-2">
                            <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.monthly_orders}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monthly Orders</p>
                    </Card>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
