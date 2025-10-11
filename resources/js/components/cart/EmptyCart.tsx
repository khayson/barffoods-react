import React from 'react';
import { Link } from '@inertiajs/react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyCart() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="max-w-md mx-auto text-center">
                {/* Empty Cart Icon */}
                <div className="mb-4">
                    <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    </div>
                </div>

                {/* Empty State Message */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Your cart is empty
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-base">
                    Looks like you haven't added any products to your cart yet. 
                    Start shopping to fill it up!
                </p>

                {/* Action Buttons */}
                <div className="mb-6">
                    <Link
                        href="/"
                        className="group relative inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition-all duration-300 overflow-hidden"
                    >
                        <ShoppingCart className="w-6 h-6 mr-2 transition-transform duration-300 group-hover:translate-x-[250%]" />
                        <span className="transition-opacity duration-300 group-hover:opacity-0">
                            Start Shopping
                        </span>
                    </Link>
                </div>

                {/* Additional Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                        Why shop with us?
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="text-center">
                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-1">
                                <span className="text-green-600 dark:text-green-400 text-xs">🚚</span>
                            </div>
                            <p className="text-xs">Fast Delivery</p>
                        </div>
                        <div className="text-center">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-1">
                                <span className="text-blue-600 dark:text-blue-400 text-xs">🔒</span>
                            </div>
                            <p className="text-xs">Secure Payment</p>
                        </div>
                        <div className="text-center">
                            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-1">
                                <span className="text-purple-600 dark:text-purple-400 text-xs">⭐</span>
                            </div>
                            <p className="text-xs">Quality Products</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
