import { useState, useEffect } from 'react';
import { X, Search, ShoppingCart, CreditCard, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Player } from '@lottiefiles/react-lottie-player';

interface HowItWorksModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Step durations in milliseconds (delivery gets more time)
    const stepDurations = [
        3000,  // Step 1: Browse - 5 seconds
        3000,  // Step 2: Cart - 5 seconds
        3000,  // Step 3: Checkout - 5 seconds
        10000  // Step 4: Delivery - 10 seconds (longer for animation)
    ];

    // Auto-play animation with custom timing per step
    useEffect(() => {
        if (isOpen && !isAnimating) {
            const currentDuration = stepDurations[activeStep];
            const timer = setTimeout(() => {
                setActiveStep((prev) => (prev + 1) % 4);
            }, currentDuration);

            return () => clearTimeout(timer);
        }
    }, [isOpen, isAnimating, activeStep]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const steps = [
        {
            icon: Search,
            title: 'Browse Products',
            description: 'Explore our wide selection of fresh groceries from local stores in your area.',
            details: [
                'Search by category, store, or product name',
                'View detailed product information and prices',
                'Check real-time availability and stock levels',
                'Compare products from different stores'
            ],
            color: 'from-blue-500 to-blue-600'
        },
        {
            icon: ShoppingCart,
            title: 'Add to Cart',
            description: 'Select your favorite items and add them to your cart with just a click.',
            details: [
                'Add multiple items from different stores',
                'Adjust quantities easily',
                'Save items to your wishlist',
                'View cart total and delivery estimates'
            ],
            color: 'from-green-500 to-green-600'
        },
        {
            icon: CreditCard,
            title: 'Secure Checkout',
            description: 'Complete your order with our safe and secure payment options.',
            details: [
                'Multiple payment methods accepted',
                'Secure encryption for all transactions',
                'Save payment info for faster checkout',
                'Apply promo codes and discounts'
            ],
            color: 'from-purple-500 to-purple-600'
        },
        {
            icon: Truck,
            title: 'Fast Delivery',
            description: 'Get your groceries delivered fresh to your doorstep.',
            details: [
                'Same-day and scheduled delivery options',
                'Real-time order tracking',
                'Contactless delivery available',
                'Satisfaction guaranteed'
            ],
            color: 'from-orange-500 to-orange-600'
        }
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[90vh] p-6 sm:p-8">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                                    How BarfFoods Works
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Fresh groceries delivered in 4 simple steps
                                </p>
                            </div>

                            {/* Animated Visual Demo */}
                            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 mb-8 relative overflow-hidden min-h-[350px] flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    {/* Step 1: Browse Products */}
                                    {activeStep === 0 && (
                                        <motion.div
                                            key="browse"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.5 }}
                                            className="flex flex-col items-center w-full max-w-lg"
                                        >
                                            <DotLottieReact
                                                src="https://lottie.host/30172b78-705b-48fb-915b-6d466e2b6aff/IQU5gBQCFx.lottie"
                                                loop
                                                autoplay
                                                style={{ height: '300px', width: '100%' }}
                                            />
                                            <p className="text-blue-600 dark:text-blue-400 font-semibold mt-4">
                                                Browsing Products...
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Step 2: Add to Cart */}
                                    {activeStep === 1 && (
                                        <motion.div
                                            key="cart"
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 50 }}
                                            transition={{ duration: 0.5 }}
                                            className="flex flex-col items-center w-full max-w-lg"
                                        >
                                            <DotLottieReact
                                                src="https://lottie.host/8fcd7fef-7086-407f-8b4d-70adf52c211e/Rm95mWRdKu.lottie"
                                                loop
                                                autoplay
                                                style={{ height: '300px', width: '100%' }}
                                            />
                                            <p className="text-green-600 dark:text-green-400 font-semibold mt-4">
                                                Adding to Cart...
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Step 3: Checkout */}
                                    {activeStep === 2 && (
                                        <motion.div
                                            key="checkout"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.5 }}
                                            className="flex flex-col items-center w-full max-w-lg"
                                        >
                                            <DotLottieReact
                                                src="https://lottie.host/54bca496-a573-4d63-9caa-e64141084fae/3q6nFPHlJh.lottie"
                                                loop
                                                autoplay
                                                style={{ height: '300px', width: '100%' }}
                                            />
                                            <p className="text-purple-600 dark:text-purple-400 font-semibold mt-4">
                                                Processing Payment...
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Step 4: Delivery */}
                                    {activeStep === 3 && (
                                        <motion.div
                                            key="delivery"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="flex flex-col items-center w-full max-w-lg"
                                        >
                                            <DotLottieReact
                                                src="https://lottie.host/8b4c50ac-da6d-468b-b2ed-590a258e0717/oUmy2zWS0n.json"
                                                loop
                                                autoplay
                                                style={{ height: '300px', width: '100%' }}
                                            />
                                            <p className="text-orange-600 dark:text-orange-400 font-semibold mt-4">
                                                Delivering to Your Door...
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Step Progress Indicator */}
                            <div className="flex justify-center items-center mb-8 gap-2">
                                {steps.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setActiveStep(index);
                                            setIsAnimating(true);
                                            setTimeout(() => setIsAnimating(false), 8000);
                                        }}
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            index === activeStep
                                                ? 'w-12 bg-green-600'
                                                : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Step Labels */}
                            <div className="grid grid-cols-4 gap-4 mb-8">
                                {steps.map((step, index) => {
                                    const IconComponent = step.icon;
                                    const isActive = index === activeStep;

                                    return (
                                        <motion.button
                                            key={index}
                                            onClick={() => {
                                                setActiveStep(index);
                                                setIsAnimating(true);
                                                setTimeout(() => setIsAnimating(false), 8000);
                                            }}
                                            animate={{
                                                scale: isActive ? 1.05 : 1,
                                                opacity: isActive ? 1 : 0.7
                                            }}
                                            className={`p-4 rounded-xl transition-all ${
                                                isActive
                                                    ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                                                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-2`}>
                                                <IconComponent className="h-6 w-6 text-white" />
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                                {step.title}
                                            </h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {step.description}
                                            </p>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* CTA Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                                <a
                                    href="/"
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-center"
                                >
                                    Start Shopping Now
                                </a>
                                <a
                                    href="/contact"
                                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors text-center"
                                >
                                    Contact Support
                                </a>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-6 text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    🔒 Safe, secure, and convenient grocery shopping
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
