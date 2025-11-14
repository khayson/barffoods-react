import { Head } from '@inertiajs/react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs: FAQItem[] = [
        {
            category: 'Orders & Delivery',
            question: 'How do I place an order?',
            answer: 'Browse our products, add items to your cart, and proceed to checkout. You can pay securely online and track your order in real-time.'
        },
        {
            category: 'Orders & Delivery',
            question: 'What are your delivery hours?',
            answer: 'We deliver 7 days a week from 8 AM to 10 PM. Same-day delivery is available for orders placed before 2 PM.'
        },
        {
            category: 'Orders & Delivery',
            question: 'How can I track my order?',
            answer: 'After placing your order, you can track it in real-time from your account dashboard or use the Track Order link in your confirmation email.'
        },
        {
            category: 'Orders & Delivery',
            question: 'What is your delivery fee?',
            answer: 'Delivery fees vary by store and distance. Standard delivery is free for orders over $50. Express and same-day delivery options have additional fees.'
        },
        {
            category: 'Payment & Pricing',
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards, debit cards, and digital payment methods including Apple Pay and Google Pay.'
        },
        {
            category: 'Payment & Pricing',
            question: 'Are prices the same as in-store?',
            answer: 'Yes, our prices match the in-store prices of our partner stores. Some stores may offer exclusive online deals.'
        },
        {
            category: 'Returns & Refunds',
            question: 'What is your return policy?',
            answer: 'If you\'re not satisfied with your order, contact us within 24 hours. We offer full refunds for damaged or incorrect items.'
        },
        {
            category: 'Returns & Refunds',
            question: 'How long do refunds take?',
            answer: 'Refunds are processed within 3-5 business days and will appear in your original payment method.'
        },
        {
            category: 'Account & Support',
            question: 'Do I need an account to order?',
            answer: 'Yes, creating an account allows you to track orders, save favorites, and enjoy a faster checkout experience.'
        },
        {
            category: 'Account & Support',
            question: 'How do I contact customer support?',
            answer: 'You can reach us via the Contact Us page, email at support@barffoods.com, or call us at +1 (555) 123-4567.'
        },
        {
            category: 'Products',
            question: 'Do you offer organic products?',
            answer: 'Yes! We have a wide selection of organic, grass-fed, and locally sourced products. Look for the green badges on product listings.'
        },
        {
            category: 'Products',
            question: 'How do I know if a product is in stock?',
            answer: 'Product availability is shown in real-time on each product page. Out of stock items will be clearly marked.'
        }
    ];

    const categories = Array.from(new Set(faqs.map(faq => faq.category)));

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <>
            <Head title="FAQ - BarfFoods" />
            
            <Navigation />

            <div className="min-h-screen bg-white dark:bg-gray-900">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-900 py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
                        >
                            Frequently Asked Questions
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-lg text-gray-600 dark:text-gray-400"
                        >
                            Find answers to common questions about our service
                        </motion.p>
                    </div>
                </section>

                {/* FAQ Content */}
                <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    {categories.map((category, categoryIndex) => (
                        <div key={category} className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {category}
                            </h2>
                            <div className="space-y-4">
                                {faqs
                                    .filter(faq => faq.category === category)
                                    .map((faq, index) => {
                                        const globalIndex = faqs.indexOf(faq);
                                        const isOpen = openIndex === globalIndex;
                                        
                                        return (
                                            <motion.div
                                                key={globalIndex}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: categoryIndex * 0.1 + index * 0.05 }}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => toggleFAQ(globalIndex)}
                                                    className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                                                >
                                                    <span className="font-semibold text-gray-900 dark:text-white pr-4">
                                                        {faq.question}
                                                    </span>
                                                    <ChevronDown
                                                        className={`h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
                                                            isOpen ? 'transform rotate-180' : ''
                                                        }`}
                                                    />
                                                </button>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700"
                                                    >
                                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                            {faq.answer}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </section>

                {/* Contact Section */}
                <section className="bg-gray-50 dark:bg-gray-800 py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Still have questions?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Can't find the answer you're looking for? Our customer support team is here to help.
                        </p>
                        <a
                            href="/contact"
                            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Contact Support
                        </a>
                    </div>
                </section>
            </div>

            <Footer />
        </>
    );
}
