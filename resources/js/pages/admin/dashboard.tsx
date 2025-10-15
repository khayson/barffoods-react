import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function AdminDashboard() {
    const { auth } = usePage<SharedData>().props;
    
    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            
            <div className="space-y-6">
                {/* Page Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Welcome back, {auth.user?.name}! Here's what's happening with your store today.
                    </p>
                </div>

                {/* Welcome Content */}
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="text-center space-y-4 max-w-4xl mx-auto px-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                            Welcome to BarfFoods Admin!
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Your admin dashboard is ready. Start managing products, customers, and orders from here.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto">
                                Add Products
                            </button>
                            <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto">
                                View Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}