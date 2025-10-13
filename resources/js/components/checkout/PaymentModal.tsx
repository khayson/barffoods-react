import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import StripePaymentForm from './StripePaymentForm';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    orderSummary: {
        subtotal: number;
        discount: number;
        deliveryFee: number;
        tax: number;
        total: number;
        itemCount: number;
    };
    checkoutData: any;
    onPaymentSuccess: (paymentIntentId: string) => void;
    onPaymentError: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    amount,
    orderSummary,
    checkoutData,
    onPaymentSuccess,
    onPaymentError
}) => {
    const [paymentStep, setPaymentStep] = useState<'summary' | 'payment' | 'processing'>('summary');

    const handlePaymentSuccess = (paymentIntentId: string) => {
        setPaymentStep('processing');
        onPaymentSuccess(paymentIntentId);
    };

    const handlePaymentError = (error: string) => {
        setPaymentStep('summary');
        onPaymentError(error);
    };

    const handleBackToSummary = () => {
        setPaymentStep('summary');
    };

    const handleClose = () => {
        if (paymentStep === 'processing') {
            toast.error('Please wait for payment processing to complete');
            return;
        }
        setPaymentStep('summary');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {paymentStep === 'summary' ? 'Order Summary & Payment' : 
                         paymentStep === 'payment' ? 'Payment Details' : 
                         'Processing Payment'}
                    </DialogTitle>
                    <DialogDescription>
                        {paymentStep === 'summary' ? 'Review your order and proceed to payment' :
                         paymentStep === 'payment' ? 'Enter your payment information to complete your order' :
                         'Please wait while we process your payment'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Order Summary */}
                    {paymentStep === 'summary' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Order Summary</CardTitle>
                                <CardDescription>
                                    {orderSummary.itemCount} item{orderSummary.itemCount !== 1 ? 's' : ''} in your order
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>${orderSummary.subtotal.toFixed(2)}</span>
                                    </div>
                                    {orderSummary.discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-${orderSummary.discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Delivery Fee</span>
                                        <span>${orderSummary.deliveryFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax</span>
                                        <span>${orderSummary.tax.toFixed(2)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Total</span>
                                        <span>${orderSummary.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button 
                                        onClick={() => setPaymentStep('payment')}
                                        className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 text-base rounded-lg"
                                    >
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Proceed to Payment
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment Form */}
                    {paymentStep === 'payment' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBackToSummary}
                                    className="p-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-gray-600">Back to Summary</span>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Payment Information</CardTitle>
                                    <CardDescription>
                                        Secure payment powered by Stripe
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">Total Amount</span>
                                            <Badge variant="outline" className="text-lg font-semibold">
                                                ${amount.toFixed(2)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <StripePaymentForm
                                        amount={amount}
                                        onPaymentSuccess={handlePaymentSuccess}
                                        onPaymentError={handlePaymentError}
                                        checkoutData={checkoutData}
                                        isLoading={false}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Processing State */}
                    {paymentStep === 'processing' && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <div className="flex justify-center">
                                        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Processing Payment</h3>
                                        <p className="text-gray-600">
                                            Please wait while we process your payment. Do not close this window.
                                        </p>
                                    </div>
                                    <div className="flex justify-center">
                                        <Badge variant="outline" className="text-lg font-semibold">
                                            ${amount.toFixed(2)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;
