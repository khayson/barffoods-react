import { Head } from '@inertiajs/react';
import CustomerLayout from '@/layouts/customer-layout';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function CustomerDashboard() {
    const { auth } = usePage<SharedData>().props;
    
    return (
        <CustomerLayout>
            <Head title="Customer Dashboard" />
            
            <div className="space-y-6">
                {/* Page Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Welcome back, {auth.user?.name}! Here's what's happening with your account.
                    </p>
                </div>

                {/* Welcome Content */}
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="text-center space-y-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <span className="text-2xl">🛒</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Welcome to BarfFoods!
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Your customer dashboard is ready. Start exploring our grocery catalog and place your first order.
                        </p>
                        <div className="flex justify-center space-x-4 mt-8">
                            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                Browse Products
                            </button>
                            <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                View Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
