import { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { Search, ShoppingCart, Facebook, Instagram, Youtube, Sun, Moon, Menu, X, Heart } from 'lucide-react';
import { login, register } from '@/routes';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import ProductSearchModal from '@/components/product-search-modal';
import CartDropdown from '@/components/CartDropdown';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { Kbd } from '@/components/ui/kbd';
import { toast } from 'sonner';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

export default function Navigation() {
    const { auth } = usePage<SharedData>().props;
    const { url } = usePage();
    const { wishlistCount } = useWishlist();
    const { totalItems } = useCart();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const cartButtonRef = useRef<HTMLButtonElement>(null);
    
    // Helper function to check if a path is active
    const isActive = (path: string) => {
        // Get current pathname
        const currentPath = window.location.pathname;
        
        if (path === '/') {
            return currentPath === '/';
        }
        return currentPath.startsWith(path);
    };

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Toggle theme function
    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        
        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };


    // Handle search keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Ctrl+K (Windows/Linux) or ⌘K (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/20 border-b border-gray-200 dark:border-gray-700 transition-colors">
            {/* Top Navigation Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 border-b border-gray-200 dark:border-gray-700">
                    {/* Search Bar - Centered on mobile, flexible on desktop */}
                    <div className="flex-1 max-w-2xl mx-auto lg:mx-8">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search Products, Brands and More..."
                                className="block w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm cursor-pointer"
                                readOnly
                                onClick={() => setSearchOpen(true)}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:block">
                                <Kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                                    {navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K'}
                                </Kbd>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-2 ml-4">
                        {/* Wishlist */}
                        {auth.user ? (
                            <Link
                                href="/wishlist"
                                className="p-2 bg-pink-50 dark:bg-pink-900 hover:bg-pink-100 dark:hover:bg-pink-800 rounded-lg transition-colors relative"
                            >
                                <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {wishlistCount > 9 ? '9+' : wishlistCount}
                                    </span>
                                )}
                            </Link>
                        ) : (
                            <button
                                onClick={() => toast.error('Please log in to view wishlist')}
                                className="p-2 bg-pink-50 dark:bg-pink-900 hover:bg-pink-100 dark:hover:bg-pink-800 rounded-lg transition-colors relative"
                            >
                                <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                            </button>
                        )}

                        {/* Shopping Cart */}
                        <button 
                            ref={cartButtonRef}
                            onClick={() => setCartOpen(!cartOpen)}
                            className="p-2 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors relative"
                        >
                            <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {totalItems > 9 ? '9+' : totalItems}
                                </span>
                            )}
                        </button>

                        {/* Theme Toggle - Hide on smallest screens */}
                        <button
                            onClick={toggleTheme}
                            className="hidden sm:flex p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDarkMode ? (
                                <Sun className="h-5 w-5 text-yellow-500" />
                            ) : (
                                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            )}
                        </button>

                        {/* Login/Dashboard Button */}
                        {auth.user ? (
                            <Link
                                href={auth.user.role === 'super_admin' ? '/admin/dashboard' : '/dashboard'}
                                className="px-3 sm:px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Dashboard</span>
                                <span className="sm:hidden">Dash</span>
                            </Link>
                        ) : (
                            <Link
                                href={login.url()}
                                className="px-3 sm:px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Grocery Bazar</span>
                    </Link>

                    {/* Main Navigation Links - Desktop Only */}
                    <nav className="hidden lg:flex items-center gap-6">
                        <Link
                            href="/"
                            className={`text-sm font-medium transition-colors pb-1 inline-block ${
                                isActive('/')
                                    ? 'text-green-600 dark:text-green-500 font-bold border-b-2 border-green-600 dark:border-green-500'
                                    : 'text-gray-900 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500'
                            }`}
                        >
                            Home
                        </Link>
                        {[
                            'About',
                            'Products',
                            'Blog',
                            'Career',
                            'Contact'
                        ].map((item, index) => (
                            <button
                                key={index}
                                onClick={() => toast.info(`${item} page coming soon! 🚀`, {
                                    description: 'This feature is under development',
                                    duration: 3000,
                                })}
                                className="text-sm font-medium text-gray-900 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 transition-colors"
                            >
                                {item}
                            </button>
                        ))}
                    </nav>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        {/* Social Media Icons - Hidden on mobile */}
                        <div className="hidden md:flex items-center gap-3">
                            <button 
                                onClick={() => toast.info('Facebook page coming soon! 📘', {
                                    description: 'Follow us for updates',
                                    duration: 3000,
                                })}
                                className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
                            >
                                <Facebook className="h-5 w-5" />
                            </button>
                            <button 
                                onClick={() => toast.info('Instagram page coming soon! 📸', {
                                    description: 'Follow us for updates',
                                    duration: 3000,
                                })}
                                className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
                            >
                                <Instagram className="h-5 w-5" />
                            </button>
                            <button 
                                onClick={() => toast.info('YouTube channel coming soon! 📺', {
                                    description: 'Subscribe for updates',
                                    duration: 3000,
                                })}
                                className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
                            >
                                <Youtube className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            ) : (
                                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <div className="py-4 space-y-1">
                            {/* Navigation Links */}
                            <Link
                                href="/"
                                className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                                    isActive('/')
                                        ? 'text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 dark:border-green-500'
                                        : 'text-gray-900 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Home
                            </Link>
                            {[
                                'About',
                                'Products',
                                'Blog',
                                'Career',
                                'Contact'
                            ].map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        toast.info(`${item} page coming soon! 🚀`, {
                                            description: 'This feature is under development',
                                            duration: 3000,
                                        });
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    {item}
                                </button>
                            ))}

                            {/* Social Media Icons in Mobile Menu */}
                            <div className="flex items-center justify-center gap-6 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <button 
                                    onClick={() => toast.info('Facebook page coming soon! 📘', {
                                        description: 'Follow us for updates',
                                        duration: 3000,
                                    })}
                                    className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
                                >
                                    <Facebook className="h-5 w-5" />
                                </button>
                                <button 
                                    onClick={() => toast.info('Instagram page coming soon! 📸', {
                                        description: 'Follow us for updates',
                                        duration: 3000,
                                    })}
                                    className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
                                >
                                    <Instagram className="h-5 w-5" />
                                </button>
                                <button 
                                    onClick={() => toast.info('YouTube channel coming soon! 📺', {
                                        description: 'Subscribe for updates',
                                        duration: 3000,
                                    })}
                                    className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
                                >
                                    <Youtube className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Product Search Modal */}
            <ProductSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            
            
            {/* Cart Dropdown */}
            <CartDropdown 
                isOpen={cartOpen} 
                onClose={() => setCartOpen(false)}
                buttonRef={cartButtonRef}
            />
            
        </nav>
    );
}
