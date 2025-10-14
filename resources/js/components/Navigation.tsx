import { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { Search, ShoppingCart, Facebook, Instagram, Youtube, Sun, Moon, Menu, X, Heart } from 'lucide-react';
import { login, register } from '@/routes';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import ProductSearchModal from '@/components/product-search-modal';
import WishlistDropdown from '@/components/WishlistDropdown';
import CartDropdown from '@/components/CartDropdown';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { Kbd } from '@/components/ui/kbd';
import { toast } from 'sonner';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

export default function Navigation() {
    const { auth } = usePage<SharedData>().props;
    const { wishlistCount } = useWishlist();
    const { totalItems } = useCart();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [wishlistOpen, setWishlistOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const wishlistButtonRef = useRef<HTMLButtonElement>(null);
    const cartButtonRef = useRef<HTMLButtonElement>(null);

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
        <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/20 border-b border-gray-200 dark:border-gray-700 transition-colors pt-2 sm:pt-4">
            {/* Top Navigation Section */}
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                <div className="flex items-center justify-between h-10 sm:h-12 border-b border-gray-400 dark:border-gray-700 transition-colors pb-1 sm:pb-2">

                    {/* Middle Section - Search Bar */}
                    <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-8">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                                <Search className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search Products, Brands and More..."
                                className="block w-full pl-7 sm:pl-10 pr-8 sm:pr-12 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                                readOnly
                                onClick={() => setSearchOpen(true)}
                            />
                            <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                                <Kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                                    {navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K'}
                                </Kbd>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Wishlist, Cart, Theme Toggle, and Login */}
                    <div className="flex items-center space-x-1 sm:space-x-4">
                        {/* Wishlist */}
                        <button 
                            ref={wishlistButtonRef}
                            onClick={() => auth.user ? setWishlistOpen(!wishlistOpen) : toast.error('Please log in to view wishlist')}
                            className="p-1.5 sm:p-2 bg-pink-50 dark:bg-pink-900 hover:bg-pink-100 dark:hover:bg-pink-800 rounded-md transition-colors relative"
                        >
                            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 dark:text-pink-400" />
                            {/* Wishlist count badge */}
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            )}
                        </button>

                        {/* Shopping Cart */}
                        <button 
                            ref={cartButtonRef}
                            onClick={() => setCartOpen(!cartOpen)}
                            className="p-1.5 sm:p-2 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 rounded-md transition-colors relative"
                        >
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                            {/* Cart count badge */}
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                        </button>


                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDarkMode ? (
                                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                            ) : (
                                <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                            )}
                        </button>

                        {/* Login Button */}
                        {auth.user ? (
                            <Link
                                href={auth.user.role === 'super_admin' ? '/admin/dashboard' : '/dashboard'}
                                className="px-2 sm:px-4 py-1 sm:py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                            >
                                <span className="hidden sm:inline">Dashboard</span>
                                <span className="sm:hidden">Dash</span>
                            </Link>
                        ) : (
                            <Link
                                href={login.url()}
                                className="px-2 sm:px-4 py-1 sm:py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                            >
                                <span className="hidden sm:inline">Login</span>
                                <span className="sm:hidden">Login</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Section */}
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                <div className="flex items-center justify-between h-12 sm:h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-md flex items-center justify-center">
                            <ShoppingCart className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <span className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white">Grocery Bazar</span>
                    </div>

                    {/* Main Navigation Links */}
                    <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
                        {[
                            'Home',
                            'About',
                            'Products',
                            'Cart',
                            'Wishlist',
                            'Blog',
                            'Career',
                            'Contact'
                        ].map((item, index) => (
                            <a
                                key={index}
                                href="#"
                                className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300 hover:text-green-600 transition-colors"
                            >
                                {item}
                            </a>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            ) : (
                                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            )}
                        </button>
                    </div>

                    {/* Social Media Icons */}
                    <div className="hidden sm:flex items-center space-x-3 xl:space-x-4">
                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
                            <Facebook className="h-4 w-4 xl:h-5 xl:w-5" />
                        </a>
                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
                            <Instagram className="h-4 w-4 xl:h-5 xl:w-5" />
                        </a>
                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
                            <Youtube className="h-4 w-4 xl:h-5 xl:w-5" />
                        </a>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <div className="px-3 py-4 space-y-3">
                            {/* Navigation Links */}
                            <div className="space-y-2">
                                {[
                                    'Home',
                                    'About',
                                    'Products',
                                    'Cart',
                                    'Wishlist',
                                    'Blog',
                                    'Career',
                                    'Contact'
                                ].map((item, index) => (
                                    <a
                                        key={index}
                                        href="#"
                                        className="block px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-300 hover:text-green-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {item}
                                    </a>
                                ))}
                            </div>

                            {/* Social Media Icons */}
                            <div className="flex items-center justify-center space-x-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
                                    <Facebook className="h-5 w-5" />
                                </a>
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
                                    <Instagram className="h-5 w-5" />
                                </a>
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
                                    <Youtube className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Product Search Modal */}
            <ProductSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            
            {/* Wishlist Dropdown */}
            <WishlistDropdown 
                isOpen={wishlistOpen} 
                onClose={() => setWishlistOpen(false)}
                buttonRef={wishlistButtonRef}
            />
            
            {/* Cart Dropdown */}
            <CartDropdown 
                isOpen={cartOpen} 
                onClose={() => setCartOpen(false)}
                buttonRef={cartButtonRef}
            />
            
        </nav>
    );
}
