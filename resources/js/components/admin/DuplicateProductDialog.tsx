import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Copy, X, Loader2, Store as StoreIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Store {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    store: {
        id: number;
        name: string;
    };
}

interface DuplicateProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
    stores: Store[];
}

export default function DuplicateProductDialog({
    open,
    onOpenChange,
    product,
    stores,
}: DuplicateProductDialogProps) {
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter out the current store from the list
    const availableStores = stores.filter(store => store.id !== product?.store.id);

    const handleDuplicate = async () => {
        if (!product || !selectedStoreId) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`/admin/products/${product.id}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    store_id: selectedStoreId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message, {
                    description: data.note || `Product "${data.product.name}" created in ${data.product.store.name}. Review and activate when ready.`,
                    duration: 6000,
                });
                router.reload({ only: ['products'] });
                onOpenChange(false);
                setSelectedStoreId('');
            } else {
                // Enhanced error message with store and product details
                const errorMessage = data.message || 'Failed to duplicate product';
                const errorDescription = data.store_name && data.product_name
                    ? `Please select a different store or remove "${data.product_name}" from ${data.store_name} first.`
                    : 'Please try selecting a different store.';
                
                toast.error(errorMessage, {
                    description: errorDescription,
                    duration: 5000,
                });
            }
        } catch (error) {
            console.error('Error duplicating product:', error);
            toast.error('Failed to duplicate product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onOpenChange(false);
            setSelectedStoreId('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Copy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Duplicate Product to Another Store
                    </DialogTitle>
                    <DialogDescription>
                        Select a store to duplicate "{product?.name}" to. The product data will be copied, and you can adjust the price and stock afterwards.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Current Store */}
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700">
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                            Current Store
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                            <StoreIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                                {product?.store.name}
                            </span>
                        </div>
                    </div>

                    {/* Store Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="target-store">
                            Duplicate to Store <span className="text-red-500">*</span>
                        </Label>
                        {availableStores.length > 0 ? (
                            <Select
                                value={selectedStoreId}
                                onValueChange={setSelectedStoreId}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id="target-store">
                                    <SelectValue placeholder="Select a store..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableStores.map((store) => (
                                        <SelectItem key={store.id} value={store.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <StoreIcon className="h-4 w-4 text-gray-400" />
                                                {store.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                                No other stores available. This product is already in all stores.
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex gap-3">
                            <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium mb-1">What will be duplicated:</p>
                                <ul className="space-y-1 text-xs mb-2">
                                    <li>✓ Product name & description</li>
                                    <li>✓ Images & category</li>
                                    <li>✓ Dimensions & weight</li>
                                    <li>✓ Price & original price</li>
                                    <li>✓ Stock quantity</li>
                                </ul>
                                <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                                    <p className="font-medium text-orange-700 dark:text-orange-300">⚠️ Note:</p>
                                    <ul className="space-y-1 text-xs mt-1">
                                        <li>• Name will have "(Copy)" appended</li>
                                        <li>• Status will be set to <strong>INACTIVE</strong></li>
                                        <li>• Review price/stock before activating</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleDuplicate}
                        disabled={!selectedStoreId || isSubmitting || availableStores.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Duplicating...
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate Product
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

