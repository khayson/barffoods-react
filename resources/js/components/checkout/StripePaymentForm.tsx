import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

interface StripePaymentFormProps {
    amount: number;
    onPaymentSuccess: (paymentIntentId: string) => void;
    onPaymentError: (error: string) => void;
    checkoutData: any;
    isLoading?: boolean;
}

interface PaymentFormProps {
    amount: number;
    onPaymentSuccess: (paymentIntentId: string) => void;
    onPaymentError: (error: string) => void;
    checkoutData: any;
    isLoading?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
    amount,
    onPaymentSuccess,
    onPaymentError,
    checkoutData,
    isLoading = false
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Create payment intent when component mounts
    useEffect(() => {
        const createPaymentIntent = async () => {
            try {
                const response = await fetch('/checkout/create-payment-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(checkoutData),
                });

                const data = await response.json();

                if (data.success) {
                    setClientSecret(data.client_secret);
                } else {
                    setError(data.error || 'Failed to create payment intent');
                    onPaymentError(data.error || 'Failed to create payment intent');
                }
            } catch (err) {
                const errorMessage = 'Failed to create payment intent';
                setError(errorMessage);
                onPaymentError(errorMessage);
            }
        };

        createPaymentIntent();
    }, [checkoutData, onPaymentError]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setIsProcessing(true);
        setError('');

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError('Card element not found');
            setIsProcessing(false);
            return;
        }

        try {
            // Confirm payment with Stripe
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        address: {
                            line1: checkoutData.street_address,
                            city: checkoutData.city,
                            state: checkoutData.state,
                            postal_code: checkoutData.zip_code,
                            country: 'US',
                        },
                    },
                }
            });

            if (stripeError) {
                setError(stripeError.message || 'Payment failed');
                onPaymentError(stripeError.message || 'Payment failed');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Payment succeeded, call the success callback
                onPaymentSuccess(paymentIntent.id);
            } else {
                setError('Payment was not completed');
                onPaymentError('Payment was not completed');
            }
        } catch (err) {
            const errorMessage = 'An error occurred during payment';
            setError(errorMessage);
            onPaymentError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
            },
        },
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Information
                    </CardTitle>
                    <CardDescription>
                        Enter your card details to complete your order of ${amount.toFixed(2)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg">
                        <CardElement options={cardElementOptions} />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        disabled={!stripe || !clientSecret || isProcessing || isLoading}
                        className="w-full"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Payment...
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Pay ${amount.toFixed(2)}
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </form>
    );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
    amount,
    onPaymentSuccess,
    onPaymentError,
    checkoutData,
    isLoading = false
}) => {
    const options = {
        appearance: {
            theme: 'stripe' as const,
            variables: {
                colorPrimary: '#0570de',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontFamily: 'Ideal Sans, system-ui, sans-serif',
                spacingUnit: '2px',
                borderRadius: '4px',
            },
        },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <PaymentForm
                amount={amount}
                onPaymentSuccess={onPaymentSuccess}
                onPaymentError={onPaymentError}
                checkoutData={checkoutData}
                isLoading={isLoading}
            />
        </Elements>
    );
};

export default StripePaymentForm;
