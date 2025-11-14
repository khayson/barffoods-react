import { Head } from '@inertiajs/react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy - BarfFoods" />
            
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
                            Privacy Policy
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
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Introduction</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    BarfFoods ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our grocery delivery service.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Information We Collect</h2>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    We collect information that you provide directly to us, including:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>Name, email address, and phone number</li>
                                    <li>Delivery address and location information</li>
                                    <li>Payment information (processed securely through third-party payment processors)</li>
                                    <li>Order history and preferences</li>
                                    <li>Account credentials</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Automatically Collected Information</h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    When you use our service, we automatically collect:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>Device information (IP address, browser type, operating system)</li>
                                    <li>Usage data (pages visited, time spent, features used)</li>
                                    <li>Location data (with your permission)</li>
                                    <li>Cookies and similar tracking technologies</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How We Use Your Information</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    We use the information we collect to:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>Process and deliver your orders</li>
                                    <li>Communicate with you about your orders and account</li>
                                    <li>Provide customer support</li>
                                    <li>Improve our services and user experience</li>
                                    <li>Send promotional communications (with your consent)</li>
                                    <li>Detect and prevent fraud</li>
                                    <li>Comply with legal obligations</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Information Sharing</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    We may share your information with:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li><strong>Partner Stores:</strong> To fulfill your orders</li>
                                    <li><strong>Delivery Partners:</strong> To deliver your orders</li>
                                    <li><strong>Payment Processors:</strong> To process payments securely</li>
                                    <li><strong>Service Providers:</strong> Who assist in operating our platform</li>
                                    <li><strong>Legal Authorities:</strong> When required by law</li>
                                </ul>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                                    We do not sell your personal information to third parties.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cookies and Tracking</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    We use cookies and similar technologies to enhance your experience, analyze usage, and deliver personalized content. You can control cookies through your browser settings, but disabling them may affect functionality.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Security</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    We implement appropriate technical and organizational measures to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Rights</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    You have the right to:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                                    <li>Access and review your personal information</li>
                                    <li>Correct inaccurate information</li>
                                    <li>Request deletion of your information</li>
                                    <li>Opt-out of marketing communications</li>
                                    <li>Withdraw consent for data processing</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Children's Privacy</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    Our service is not intended for children under 13. We do not knowingly collect information from children under 13. If you believe we have collected such information, please contact us immediately.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Changes to This Policy</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    If you have questions about this Privacy Policy, please contact us at:
                                </p>
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <strong>Email:</strong> privacy@barffoods.com<br />
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
