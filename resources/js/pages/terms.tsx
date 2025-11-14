import { Head } from '@inertiajs/react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function Terms() {
    return (
        <>
            <Head title="Terms of Service - BarfFoods" />
            
            <Navigation />

            <div className="min-h-screen bg-white dark:bg-gray-900">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-900 py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
                        >
                            Terms of Service
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-lg text-gray-600 dark:text-gray-400"
                        >
                            Last updated: November 14, 2025
                        </motion.p>
                    </div>
                </section>

                {/* Content */}
                <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Agreement to Terms</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    By accessing and using BarfFoods ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Use of Service</h2>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Eligibility</h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    You must be at least 18 years old to use our Service. By using the Service, you represent that you meet this age requirement.
                                </p>
                                
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Account Registration</h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    To use certain features, you must create an account. You agree to:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>Provide accurate and complete information</li>
                                    <li>Maintain the security of your account credentials</li>
                                    <li>Notify us immediately of any unauthorized access</li>
                                    <li>Accept responsibility for all activities under your account</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Orders and Payments</h2>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Placing Orders</h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    When you place an order through our Service:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>You make an offer to purchase products at the listed prices</li>
                                    <li>We reserve the right to accept or decline your order</li>
                                    <li>Order confirmation does not guarantee product availability</li>
                                    <li>Prices are subject to change without notice</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">Payment</h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    You agree to:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>Provide valid payment information</li>
                                    <li>Pay all charges at the prices in effect when incurred</li>
                                    <li>Pay applicable taxes and delivery fees</li>
                                    <li>Authorize us to charge your payment method</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Delivery</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    Delivery terms:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>Delivery times are estimates and not guaranteed</li>
                                    <li>You must be available to receive deliveries</li>
                                    <li>We are not responsible for delays beyond our control</li>
                                    <li>Risk of loss passes to you upon delivery</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Returns and Refunds</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    Our return and refund policy:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>Contact us within 24 hours for damaged or incorrect items</li>
                                    <li>Perishable items may have limited return eligibility</li>
                                    <li>Refunds are processed to the original payment method</li>
                                    <li>We reserve the right to refuse returns that don't meet our policy</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Prohibited Activities</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    You may not:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>Use the Service for any illegal purpose</li>
                                    <li>Violate any applicable laws or regulations</li>
                                    <li>Infringe on intellectual property rights</li>
                                    <li>Transmit harmful code or malware</li>
                                    <li>Attempt to gain unauthorized access to our systems</li>
                                    <li>Interfere with the proper functioning of the Service</li>
                                    <li>Impersonate any person or entity</li>
                                    <li>Collect user information without consent</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Intellectual Property</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    All content on the Service, including text, graphics, logos, and software, is the property of BarfFoods or its licensors and is protected by copyright and other intellectual property laws. You may not use, reproduce, or distribute any content without our written permission.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Disclaimers</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>Warranties of merchantability or fitness for a particular purpose</li>
                                    <li>Warranties that the Service will be uninterrupted or error-free</li>
                                    <li>Warranties regarding the accuracy or reliability of content</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Limitation of Liability</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, BARFFOODS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, OR GOODWILL.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Indemnification</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    You agree to indemnify and hold harmless BarfFoods and its affiliates from any claims, damages, losses, liabilities, and expenses arising from your use of the Service or violation of these Terms.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Termination</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    We may terminate or suspend your account and access to the Service at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Changes to Terms</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    We reserve the right to modify these Terms at any time. We will notify you of significant changes by posting the new Terms on this page. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Governing Law</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which BarfFoods operates, without regard to its conflict of law provisions.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    If you have questions about these Terms, please contact us at:
                                </p>
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <strong>Email:</strong> legal@barffoods.com<br />
                                        <strong>Phone:</strong> +1 (555) 123-4567<br />
                                        <strong>Address:</strong> 123 Grocery Street, Food City, FC 12345
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>

            <Footer />
        </>
    );
}
