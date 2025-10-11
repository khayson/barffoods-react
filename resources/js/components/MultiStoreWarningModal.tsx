import React from 'react';
import { AlertTriangle, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface MultiStoreWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onModifyCart: () => void;
    storeNames: string[];
}

export default function MultiStoreWarningModal({
    isOpen,
    onClose,
    onConfirm,
    onModifyCart,
    storeNames
}: MultiStoreWarningModalProps) {
    const storeList = storeNames.join(', ');
    const isMultipleStores = storeNames.length >= 3;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold">
                                Multiple Store Order
                            </DialogTitle>
                            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                                Items from different stores detected
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Warning Message */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Package className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                                    {isMultipleStores ? 'Multiple stores detected' : 'Two stores detected'}
                                </p>
                                <p className="text-orange-700 dark:text-orange-300">
                                    Your order contains items from: <strong>{storeList}</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                                    Delivery Information
                                </p>
                                <p className="text-blue-700 dark:text-blue-300">
                                    Items from different stores will be delivered separately. 
                                    Delivery times may vary between stores.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onModifyCart}
                        className="flex-1"
                    >
                        Modify Cart
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        Continue Shopping
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
