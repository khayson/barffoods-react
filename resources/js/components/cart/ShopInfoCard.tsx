import React from 'react';
import { Store, Package, Truck } from 'lucide-react';

interface ShopInfoCardProps {
    storeCount: number;
    storeNames: string[];
    isMultiStore: boolean;
}

export default function ShopInfoCard({ storeCount, storeNames, isMultiStore }: ShopInfoCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Store Information
            </h3>
            
            <div className="space-y-3">
                {/* Store Count */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Stores</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {storeCount} {storeCount === 1 ? 'store' : 'stores'}
                    </span>
                </div>

                {/* Store Names */}
                <div className="space-y-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Store Names:</span>
                    <div className="space-y-1">
                        {storeNames.map((storeName, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <Package className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">{storeName}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Truck className="w-4 h-4" />
                        <span>
                            {isMultiStore 
                                ? 'Items will be delivered separately from each store'
                                : 'All items will be delivered together'
                            }
                        </span>
                    </div>
                </div>

                {/* Multi-store warning */}
                {isMultiStore && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div>
                                <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                                    Multiple Stores
                                </p>
                                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                    Delivery times may vary between stores
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
