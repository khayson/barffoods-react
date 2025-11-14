import { Head } from '@inertiajs/react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Package, Search, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function TrackOrder() {
    const [orderNumber, setOrderNumber] = useState('');
    const [email, setEmail] = useState('');
    const [tracking, setTracking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            if (orderNumber && email) {
                // Mock tracking data
                setTracking({
                    orderNumber: orderNumber,
                    status: 'in_transit',
                    estimatedDelivery: 'Today, 3:00 PM - 5:00 PM',
                    items: 3,
                    total: 45.99,
                    timeline: [
                        {
                            status: 'placed',
                            label: 'Order Placed',
                            time: 'Today, 10:30 AM',
                            completed: true
                        },
                        {
                            status: 'confirmed',
                            label: 'Order Confirmed',
                            time: 'Today, 10:35 AM',
                            completed: true
                        },
                        {
                            status: 'preparing',
                            label: 'Preparing Order',
                            time: 'Today, 11:00 AM',
                            completed: true
                        },
                        {
                            status: 'in_transit',
                            label: 'Out for Delivery',
                            time: 'Today, 2:15 PM',
                            completed: true,
                            current: true
                        },
                        {
                            status: 'delivered',
                            label: 'Delivered',
                            time: 'Estimated: 3:00 PM - 5:00 PM',
                            completed: false
                        }
                    ]
                });
            } else {
                setError('Please enter both order number and email address');
            }
            setIsLoading(false);
        }, 1000);
    };

    const getStatusIcon = (status: string, completed: boolean) => {
        if (completed) {
            return <CheckCircle className="h-6 w-6 text-green-600" />;
        }
        
        switch (status) {
            case 'placed':
                return <Package className="h-6 w-6 text-gray-400" />;
            case 'confirmed':
                return <CheckCircle className="h-6 w-6 text-gray-400" />;
            case 'preparing':
                return <Clock className="h-6 w-6 text-gray-400" />;
            case 'in_transit':
                return <Truck className="h-6 w-6 text-gray-400" />;
            case 'delivered':
                return <MapPin className="h-6 w-6 text-gray-400" />;
            default:
                return <Package className="h-6 w-6 text-gray-400" />;
        }
    };

    return (
        <>
            <Head title="Track Order - BarfFoods" />
            
            <Navigation />

            <div className="min-h-screen bg-white dark:bg-gray-900">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-900 py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Package className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                                Track Your Order
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                Enter your order details to see real-time tracking information
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Tracking Form */}
                <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
                    >
                        <form onSubmit={handleTrack} className="space-y-6">
                            <div>
                                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Order Number
                                </label>
                                <input
                                    type="text"
                                    id="orderNumber"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    placeholder="e.g., ORD-12345"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <Search className="h-5 w-5" />
                                {isLoading ? 'Tracking...' : 'Track Order'}
                            </button>
                        </form>
                    </motion.div>
                </section>

                {/* Tracking Results */}
                {tracking && (
                    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
                        >
                            {/* Order Summary */}
                            <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Order #{tracking.orderNumber}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                                            {tracking.items} items • ${tracking.total}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                                            <Truck className="h-4 w-4" />
                                            <span className="font-semibold">Out for Delivery</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            {tracking.estimatedDelivery}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                    Order Timeline
                                </h3>
                                {tracking.timeline.map((step: any, index: number) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                                                step.current 
                                                    ? 'bg-green-100 dark:bg-green-900/30 ring-4 ring-green-200 dark:ring-green-800' 
                                                    : step.completed 
                                                    ? 'bg-green-100 dark:bg-green-900/30' 
                                                    : 'bg-gray-100 dark:bg-gray-700'
                                            }`}>
                                                {getStatusIcon(step.status, step.completed)}
                                            </div>
                                            {index < tracking.timeline.length - 1 && (
                                                <div className={`w-0.5 h-16 ${
                                                    step.completed ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                                }`} />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-8">
                                            <h4 className={`font-semibold ${
                                                step.current 
                                                    ? 'text-green-600 dark:text-green-400' 
                                                    : 'text-gray-900 dark:text-white'
                                            }`}>
                                                {step.label}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {step.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </section>
                )}

                {/* Help Section */}
                <section className="bg-gray-50 dark:bg-gray-800 py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Need Help?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            If you have questions about your order, our support team is here to help.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/contact"
                                className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Contact Support
                            </a>
                            <a
                                href="/faq"
                                className="inline-block px-6 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
                            >
                                View FAQ
                            </a>
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </>
    );
}
