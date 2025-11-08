import { Head, Link } from '@inertiajs/react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HowItWorksBanner from '@/components/HowItWorksBanner';
import { motion } from 'framer-motion';
import { ShoppingCart, Truck, Package, Users, Clock, MapPin, Facebook, Instagram, Youtube, Twitter, Linkedin } from 'lucide-react';

export default function About() {
    return (
        <>
            <Head title="About Us - Grocery Bazar" />
            
            <HowItWorksBanner />
            <Navigation />

            <div className="min-h-screen bg-white dark:bg-gray-900">
                {/* Hero Section - About Us */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                        {/* Left - Title and Description */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
                                ABOUT<br />US
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                Leading the Way in Fresh Grocery Delivery
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                Grocery Bazar is revolutionizing the way people shop for groceries. We connect customers with local stores, 
                                offering fresh produce, quality products, and unmatched convenience through our innovative platform.
                            </p>
                        </motion.div>

                        {/* Right - Images and Philosophy */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Main Image */}
                            <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-3xl p-8 h-48 flex items-center justify-center">
                                <ShoppingCart className="w-32 h-32 text-green-600 dark:text-green-500 opacity-40" />
                            </div>

                            {/* Philosophy Card */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-4 flex-shrink-0">
                                        <Package className="w-8 h-8 text-green-600 dark:text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            Our Philosophy
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                            Quality, freshness, and convenience are at the heart of everything we do. 
                                            We believe in supporting local businesses while delivering exceptional service to our customers.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Meet the Team Section */}
                {/* <section className="bg-gray-50 dark:bg-gray-800/50 py-12 md:py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                                MEET THE TEAM
                            </h2>
                            <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl w-32 h-32 mx-auto flex items-center justify-center mb-6">
                                <Users className="w-16 h-16 text-green-600 dark:text-green-500 opacity-40" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                                Our passionate team of innovators and grocery experts work tirelessly to bring you the best shopping experience. 
                                We're committed to making fresh, quality groceries accessible to everyone.
                            </p>
                        </motion.div>

                        
                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-sm"
                            >
                                <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                                    <Users className="w-24 h-24 text-green-600 dark:text-green-500 opacity-40" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Sarah Johnson
                                </h3>
                                <p className="text-green-600 dark:text-green-400 font-medium text-sm tracking-wider">
                                    FOUNDER AND PRINCIPAL
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-sm"
                            >
                                <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                                    <Users className="w-24 h-24 text-green-600 dark:text-green-500 opacity-40" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Michael Chen
                                </h3>
                                <p className="text-green-600 dark:text-green-400 font-medium text-sm tracking-wider">
                                    FOUNDER AND PRINCIPAL
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section> */}

                {/* Our Services Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left - Service Image */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">
                                Our Services
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                                From fresh produce to household essentials, we offer a comprehensive range of services designed to 
                                make your grocery shopping experience seamless and enjoyable.
                            </p>
                            <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-3xl p-12 flex items-center justify-center">
                                <Truck className="w-48 h-48 text-green-600 dark:text-green-500 opacity-40" />
                            </div>
                        </motion.div>

                        {/* Right - Service List */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="space-y-8"
                        >
                            {/* Service 1 */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-wide">
                                    FAST DELIVERY
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Get your groceries delivered to your doorstep within hours. We offer same-day delivery, 
                                    express options, and scheduled deliveries to fit your lifestyle.
                                </p>
                            </div>

                            {/* Service 2 */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-wide">
                                    FRESH PRODUCTS
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    We partner with local stores and suppliers to ensure you receive the freshest produce, 
                                    quality meats, and premium products every time you order.
                                </p>
                            </div>

                            {/* Service 3 */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-wide">
                                    LOCAL PARTNERSHIPS
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Supporting local businesses is our priority. We connect you with neighborhood stores, 
                                    helping communities thrive while giving you access to unique local products.
                                </p>
                            </div>

                            {/* Service 4 */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-wide">
                                    24/7 CUSTOMER SUPPORT
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Our dedicated support team is always ready to help. Whether you have questions about orders, 
                                    products, or delivery, we're here for you around the clock.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Social Media Section */}
                <section className="bg-gray-50 dark:bg-gray-800/50 py-12 md:py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-8"
                        >
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                                We Invite You To Connect Our
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                                Social Media Information
                            </h3>
                        </motion.div>

                        {/* Social Media Badges */}
                        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-800 dark:bg-gray-700 border-4 border-gray-300 dark:border-gray-600 flex items-center justify-center group"
                            >
                                <Facebook className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                <span className="absolute -bottom-8 text-xs font-medium text-gray-600 dark:text-gray-400">
                                    FACEBOOK
                                </span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-800 dark:bg-gray-700 border-4 border-gray-300 dark:border-gray-600 flex items-center justify-center"
                            >
                                <Instagram className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                <span className="absolute -bottom-8 text-xs font-medium text-gray-600 dark:text-gray-400">
                                    INSTAGRAM
                                </span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-800 dark:bg-gray-700 border-4 border-gray-300 dark:border-gray-600 flex items-center justify-center"
                            >
                                <Twitter className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                <span className="absolute -bottom-8 text-xs font-medium text-gray-600 dark:text-gray-400">
                                    TWITTER
                                </span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-800 dark:bg-gray-700 border-4 border-gray-300 dark:border-gray-600 flex items-center justify-center"
                            >
                                <Youtube className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                <span className="absolute -bottom-8 text-xs font-medium text-gray-600 dark:text-gray-400">
                                    YOUTUBE
                                </span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-800 dark:bg-gray-700 border-4 border-gray-300 dark:border-gray-600 flex items-center justify-center"
                            >
                                <Linkedin className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                <span className="absolute -bottom-8 text-xs font-medium text-gray-600 dark:text-gray-400">
                                    LINKEDIN
                                </span>
                            </motion.button>
                        </div>

                        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
                            <p>Let's Stay Connected</p>
                        </div>
                    </div>
                </section>

                {/* Contact CTA Section */}
                <section className="bg-gray-900 dark:bg-black py-16 md:py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                                CONTACT US
                            </h2>
                            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                                Have questions or want to learn more? We'd love to hear from you.
                            </p>
                            <Link
                                href="/contact"
                                className="inline-block px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Get In Touch
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </div>
            
            <Footer />
        </>
    );
}
