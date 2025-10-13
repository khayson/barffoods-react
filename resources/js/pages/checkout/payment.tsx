import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, CreditCard, ShoppingBag, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import CustomerLayout from '@/layouts/customer-layout';
import StripePaymentForm from '@/components/checkout/StripePaymentForm';

interface PaymentPageProps {
    orderSummary: {
        subtotal: number;
        discount: number;
        deliveryFee: number;
        tax: number;
        total: number;
        itemCount: number;
    };
    checkoutData: any;
}

export default function PaymentPage({ orderSummary, checkoutData }: PaymentPageProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'summary' | 'payment' | 'processing'>('summary');

    const { data, setData, post, processing, errors } = useForm({
        payment_intent_id: '',
    });

    const handlePaymentSuccess = async (paymentIntentId: string) => {
        setPaymentStep('processing');
        setIsProcessing(true);
        
        try {
            setData('payment_intent_id', paymentIntentId);
            
            await post('/checkout', {
                onSuccess: (page) => {
                    toast.success('Order placed successfully!');
                    // Redirect to order confirmation page
                    window.location.href = `/orders/${page.props.order_id}`;
                },
                onError: (errors) => {
                    toast.error('Failed to place order. Please try again.');
                    setPaymentStep('summary');
                    setIsProcessing(false);
                }
            });
        } catch (error) {
            toast.error('An error occurred. Please try again.');
            setPaymentStep('summary');
            setIsProcessing(false);
        }
    };

    const handlePaymentError = (error: string) => {
        toast.error(error);
        setPaymentStep('summary');
    };

    return (
        <CustomerLayout>
            <Head title="Payment - BarfFoods" />

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <Link 
                            href="/checkout" 
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Checkout
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
                        <p className="text-gray-600 mt-2">Secure payment powered by Stripe</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Order Summary */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingBag className="h-5 w-5" />
                                        Order Summary
                                    </CardTitle>
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
                                </CardContent>
                            </Card>

                            {/* Security Notice */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-sm">Secure Payment</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Your payment information is encrypted and secure. We never store your card details.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Form */}
                        <div className="space-y-6">
                            {paymentStep === 'summary' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Payment Information
                                        </CardTitle>
                                        <CardDescription>
                                            Enter your payment details to complete your order
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Total Amount</span>
                                                <Badge variant="outline" className="text-lg font-semibold">
                                                    ${orderSummary.total.toFixed(2)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => setPaymentStep('payment')}
                                            className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 text-base rounded-lg"
                                        >
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Enter Payment Details
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {paymentStep === 'payment' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Payment Details
                                        </CardTitle>
                                        <CardDescription>
                                            Complete your payment to place your order
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <StripePaymentForm
                                            amount={orderSummary.total}
                                            onPaymentSuccess={handlePaymentSuccess}
                                            onPaymentError={handlePaymentError}
                                            checkoutData={checkoutData}
                                            isLoading={isProcessing}
                                        />
                                    </CardContent>
                                </Card>
                            )}

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
                                                    ${orderSummary.total.toFixed(2)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
