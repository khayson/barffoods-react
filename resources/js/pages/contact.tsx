import { Head, useForm, router } from '@inertiajs/react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ContactInfo {
    email: string;
    phone: string;
    address: string;
    business_hours: string;
}

interface ContactProps {
    contactInfo: ContactInfo;
}

export default function Contact({ contactInfo }: ContactProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post('/contact', {
            onSuccess: () => {
                toast.success('Message sent successfully!', {
                    description: 'We\'ll get back to you as soon as possible.',
                });
                reset();
            },
            onError: () => {
                toast.error('Failed to send message', {
                    description: 'Please try again later.',
                });
            }
        });
    };

    return (
        <>
            <Head title="Contact Us - Grocery Bazar" />
            
            <Navigation />

            <div className="min-h-screen bg-white dark:bg-gray-900">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
                            CONTACT US
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Have questions or need assistance? We're here to help. Reach out to us and we'll get back to you as soon as possible.
                        </p>
                    </motion.div>

                    {/* Contact Grid */}
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Left - Contact Information */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                    Get In Touch
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                                    Whether you have a question about our services, need help with an order, or just want to say hello, 
                                    our team is ready to answer all your questions.
                                </p>
                            </div>

                            {/* Contact Cards */}
                            <div className="space-y-6">
                                {/* Email */}
                                <motion.a
                                    href={`mailto:${contactInfo.email}`}
                                    whileHover={{ scale: 1.02 }}
                                    className="flex items-start gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:shadow-md transition-all"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Mail className="w-7 h-7 text-green-600 dark:text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">
                                            Email Us
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                                            Send us an email anytime
                                        </p>
                                        <p className="text-green-600 dark:text-green-400 font-medium">
                                            {contactInfo.email}
                                        </p>
                                    </div>
                                </motion.a>

                                {/* Phone */}
                                <motion.a
                                    href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                                    whileHover={{ scale: 1.02 }}
                                    className="flex items-start gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:shadow-md transition-all"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Phone className="w-7 h-7 text-green-600 dark:text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">
                                            Call Us
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                                            Mon-Fri from 9am to 6pm
                                        </p>
                                        <p className="text-green-600 dark:text-green-400 font-medium">
                                            {contactInfo.phone}
                                        </p>
                                    </div>
                                </motion.a>

                                {/* Location */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="flex items-start gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:shadow-md transition-all"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin className="w-7 h-7 text-green-600 dark:text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">
                                            Visit Us
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                                            Come say hello at our office
                                        </p>
                                        <p className="text-green-600 dark:text-green-400 font-medium">
                                            {contactInfo.address}
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Business Hours */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="flex items-start gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:shadow-md transition-all"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Clock className="w-7 h-7 text-green-600 dark:text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">
                                            Business Hours
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
                                            {contactInfo.business_hours}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Right - Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-8 md:p-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-xl flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Send a Message
                                    </h2>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                                                Full Name
                                            </Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="John Doe"
                                                required
                                                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-12"
                                            />
                                            {errors.name && (
                                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                                                Email Address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="john@example.com"
                                                required
                                                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-12"
                                            />
                                            {errors.email && (
                                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="subject" className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                                            Subject
                                        </Label>
                                        <Input
                                            id="subject"
                                            type="text"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            placeholder="How can we help you?"
                                            required
                                            className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-12"
                                        />
                                        {errors.subject && (
                                            <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="message" className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                                            Your Message
                                        </Label>
                                        <Textarea
                                            id="message"
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            placeholder="Tell us more about your inquiry..."
                                            rows={6}
                                            required
                                            className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none"
                                        />
                                        {errors.message && (
                                            <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl"
                                    >
                                        <Send className="w-5 h-5 mr-2" />
                                        {processing ? 'Sending...' : 'Send Message'}
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Map Section (Optional) */}
                <section className="bg-gray-50 dark:bg-gray-800/50 py-12 md:py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-3xl p-12 md:p-20 text-center"
                        >
                            <MapPin className="w-20 h-20 text-green-600 dark:text-green-500 mx-auto mb-6 opacity-40" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Find Us on the Map
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Visit our location or use our store locator to find the nearest Grocery Bazar partner store in your area.
                            </p>
                        </motion.div>
                    </div>
                </section>
            </div>
            
            <Footer />
        </>
    );
}
