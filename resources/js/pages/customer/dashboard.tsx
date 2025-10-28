import { Head, Link, usePage } from '@inertiajs/react';
import CustomerLayout from '@/layouts/customer-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
    ShoppingBag, 
    Heart, 
    Package, 
    DollarSign,
    Clock,
    CheckCircle,
    Truck,
    MapPin,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Activity,
    Calendar,
    Eye,
    ShoppingCart
} from 'lucide-react';
import { type SharedData } from '@/types';

interface Stats {
    total_orders: number;
    total_spent: number;
    wishlist_count: number;
    pending_orders: number;
    orders_by_status: Record<string, number>;
}

interface RecentOrder {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    items_count: number;
}

interface DashboardProps {
    stats: Stats;
    recent_orders: RecentOrder[];
}

export default function CustomerDashboard() {
    const { auth, stats, recent_orders } = usePage<SharedData & DashboardProps>().props;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending_payment: 'bg-amber-500',
            payment_failed: 'bg-rose-500',
            confirmed: 'bg-sky-500',
            processing: 'bg-violet-500',
            shipped: 'bg-purple-500',
            delivered: 'bg-emerald-500',
            refunded: 'bg-orange-500',
        };
        return colors[status] || 'bg-gray-500';
    };

    const formatStatusLabel = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <CustomerLayout>
            <Head title="Dashboard" />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Hero Section - Horizontal Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                        {/* Left - Welcome Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-8"
                        >
                            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 border-0 shadow-2xl">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
                                <div className="relative p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <p className="text-emerald-100 text-sm font-medium mb-2">Dashboard Overview</p>
                                            <h1 className="text-4xl font-bold text-white mb-2">
                                                Hello, {auth.user?.name?.split(' ')[0]} 👋
                                            </h1>
                                            <p className="text-emerald-50 text-lg">Welcome back to your shopping hub</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Link
                                            href="/products"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all shadow-xl"
                                        >
                                            <ShoppingCart className="h-5 w-5" />
                                            Start Shopping
                                        </Link>
                                        <Link
                                            href="/stores"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
                                        >
                                            <MapPin className="h-5 w-5" />
                                            Explore Stores
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Right - Quick Stats Vertical */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4 space-y-4"
                        >
                            <Card className="p-6 border-0 shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                        <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Orders</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_orders}</p>
                                    </div>
                                    <Link href="/orders" className="text-blue-600 dark:text-blue-400">
                                        <Eye className="h-5 w-5" />
                                    </Link>
                                </div>
                            </Card>

                            <Card className="p-6 border-0 shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                                        <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Saved</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.wishlist_count}</p>
                                    </div>
                                    <Link href="/wishlist" className="text-pink-600 dark:text-pink-400">
                                        <Eye className="h-5 w-5" />
                                    </Link>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Metrics Row - Horizontal Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        +12.5%
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Spent</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                    {formatCurrency(stats.total_spent)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Lifetime purchases</p>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-xs">
                                        Active
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Orders</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                    {stats.pending_orders}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">In processing</p>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                        <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 text-xs">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        +8.2%
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Order Value</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                    {stats.total_orders > 0 ? formatCurrency(stats.total_spent / stats.total_orders) : '$0.00'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Per transaction</p>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Main Content - Bento Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Recent Orders - Larger Section */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="border-0 shadow-lg">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {recent_orders.length} orders in the last 30 days
                                            </p>
                                        </div>
                                        <Link
                                            href="/orders"
                                            className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-2 transition-all"
                                        >
                                            View All
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>

                                {recent_orders.length > 0 ? (
                                    <div className="p-6 space-y-4">
                                        {recent_orders.map((order, index) => (
                                            <Link
                                                key={order.id}
                                                href={`/orders/${order.id}`}
                                                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                            >
                                                <div className={`w-1 h-14 rounded-full ${getStatusColor(order.status)}`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {order.order_number}
                                                        </p>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            • {order.items_count} items
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)} text-white`}>
                                                            {formatStatusLabel(order.status)}
                                                        </span>
                                                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                                                            {order.created_at}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(order.total_amount)}
                                                    </p>
                                                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                            <Package className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            No orders yet
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                            Start your shopping journey today
                                        </p>
                                        <Link
                                            href="/products"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                                        >
                                            <ShoppingBag className="h-5 w-5" />
                                            Browse Products
                                        </Link>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Right Sidebar - Stacked Cards */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Quick Links */}
                            <Card className="p-6 border-0 shadow-lg">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                                <div className="space-y-2">
                                    <Link
                                        href="/products"
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">All Products</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                    </Link>

                                    <Link
                                        href="/orders"
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">My Orders</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                    </Link>

                                    <Link
                                        href="/wishlist"
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">Wishlist</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                    </Link>

                                    <Link
                                        href="/stores"
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">Find Stores</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </Card>

                            {/* Order Status Breakdown */}
                            {stats.total_orders > 0 && (
                                <Card className="p-6 border-0 shadow-lg">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Status</h3>
                                    <div className="space-y-3">
                                        {Object.entries(stats.orders_by_status || {}).map(([status, count]) => (
                                            <div key={status} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                                        {formatStatusLabel(status)}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Support */}
                            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
                                <h3 className="text-lg font-bold mb-2">Need Help?</h3>
                                <p className="text-blue-100 text-sm mb-4">
                                    Our support team is ready to assist you 24/7
                                </p>
                                <button className="w-full px-4 py-2.5 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm">
                                    Contact Support
                                </button>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
