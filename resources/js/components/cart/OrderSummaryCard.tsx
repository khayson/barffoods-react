import React from 'react';
import { ShoppingBag, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderSummaryCardProps {
    totalItems: number;
    totalPrice: number;
    calculations?: {
        subtotal: number;
        discount: number;
        delivery_fee: number;
        tax: number;
        total: number;
        discount_breakdown: any[];
        applied_discounts: any[];
        available_discounts: any[];
    };
    isAuthenticated: boolean;
    onCheckout: () => void;
}

export default function OrderSummaryCard({ 
    totalItems, 
    totalPrice, 
    calculations,
    isAuthenticated,
    onCheckout
}: OrderSummaryCardProps) {
    // Use calculations if available, otherwise fallback to basic calculations
    const subtotal = calculations?.subtotal ?? totalPrice;
    const discount = calculations?.discount ?? 0;
    const deliveryFee = calculations?.delivery_fee ?? 4.99;
    const tax = calculations?.tax ?? 0;
    const finalTotal = calculations?.total ?? (subtotal - discount + deliveryFee + tax);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-green-600 dark:text-green-400" />
                Order Summary
            </h3>
            
            <div className="space-y-3">
                {/* Items Count */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Items ({totalItems})</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${subtotal.toFixed(2)}
                    </span>
                </div>

                {/* Discount */}
                {discount > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Discount</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            -${discount.toFixed(2)}
                        </span>
                    </div>
                )}

                {/* Delivery */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Delivery</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${deliveryFee.toFixed(2)}
                    </span>
                </div>

                {/* Tax */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${tax.toFixed(2)}
                    </span>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            ${finalTotal.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Note */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Shipping and final tax calculated at checkout
                </p>

                {/* Checkout Button */}
                <Button
                    onClick={onCheckout}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 mt-4"
                >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isAuthenticated ? 'Check Out' : 'Login to Checkout'}
                </Button>

                {/* Login Required Note */}
                {!isAuthenticated && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-3">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            You need to log in to proceed with checkout
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
