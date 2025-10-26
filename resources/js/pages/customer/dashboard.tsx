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
    Tag,
    TrendingUp,
    Calendar
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered':
                return <CheckCircle className="h-4 w-4" />;
            case 'shipped':
                return <Truck className="h-4 w-4" />;
            case 'processing':
                return <Package className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const formatStatusLabel = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <CustomerLayout>
            <Head title="Dashboard" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                                Welcome back, {auth.user?.name}! 👋
                            </h1>
                            <p className="text-green-100 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                        <Link
                            href="/products"
                            className="inline-flex items-center px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl"
                        >
                            <ShoppingBag className="h-5 w-5 mr-2" />
                            Browse Products
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Orders */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        {stats.total_orders}
                                    </h3>
                                    <Link 
                                        href="/orders"
                                        className="inline-flex items-center text-xs text-green-600 dark:text-green-400 hover:underline mt-2"
                                    >
                                        View all
                                        <ChevronRight className="h-3 w-3 ml-1" />
                                    </Link>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                                    <ShoppingBag className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Pending Orders */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Orders</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        {stats.pending_orders}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        In progress
                                    </p>
                                </div>
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                                    <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Total Spent */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        {formatCurrency(stats.total_spent)}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        All time
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                                    <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Wishlist */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Wishlist Items</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        {stats.wishlist_count}
                                    </h3>
                                    <Link 
                                        href="/wishlist"
                                        className="inline-flex items-center text-xs text-pink-600 dark:text-pink-400 hover:underline mt-2"
                                    >
                                        View wishlist
                                        <ChevronRight className="h-3 w-3 ml-1" />
                                    </Link>
                                </div>
                                <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-xl">
                                    <Heart className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders - Takes 2 columns */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="lg:col-span-2"
                    >
                        <Card className="overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your recent purchases</p>
                                    </div>
                                    <Link
                                        href="/orders"
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                    >
                                        View All
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Link>
                                </div>
                            </div>

                            {recent_orders.length > 0 ? (
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {recent_orders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/orders/${order.id}`}
                                            className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                                        {getStatusIcon(order.status)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                                {order.order_number}
                                                            </h4>
                                                            <Badge className={`text-xs border ${getStatusColor(order.status)}`}>
                                                                {formatStatusLabel(order.status)}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <Package className="h-4 w-4" />
                                                                {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{order.created_at}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(order.total_amount)}
                                                    </p>
                                                    <ChevronRight className="h-5 w-5 text-gray-400 ml-auto mt-1" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                        <ShoppingBag className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        No orders yet
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        Start shopping to see your orders here
                                    </p>
                                    <Link
                                        href="/products"
                                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                    >
                                        <ShoppingBag className="h-5 w-5 mr-2" />
                                        Browse Products
                                    </Link>
                                </div>
                            )}
                        </Card>
                    </motion.div>

                    {/* Quick Actions Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-6"
                    >
                        {/* Quick Actions */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href="/products"
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                                        <ShoppingBag className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">Shop Now</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Browse products</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </Link>

                                <Link
                                    href="/orders"
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">My Orders</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Track orders</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </Link>

                                <Link
                                    href="/wishlist"
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg group-hover:bg-pink-200 dark:group-hover:bg-pink-900/30 transition-colors">
                                        <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">Wishlist</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Saved items</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </Link>

                                <Link
                                    href="/stores"
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                                        <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">Find Stores</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Near you</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </Link>
                            </div>
                        </Card>

                        {/* Support Card */}
                        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Need Help?</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Our support team is here to assist you
                                    </p>
                                </div>
                            </div>
                            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                                Contact Support
                            </button>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </CustomerLayout>
    );
}
