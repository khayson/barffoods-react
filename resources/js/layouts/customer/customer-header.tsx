import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { 
    Menu, 
    Search, 
    ShoppingCart, 
    Heart, 
    Sun, 
    Moon,
    Bell,
    ChevronsUpDown,
    Home,
    Package,
    User,
    Settings,
    LayoutGrid,
    MessageCircle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import ProductSearchModal from '@/components/product-search-modal';
import { Link } from '@inertiajs/react';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import WishlistDropdown from '@/components/WishlistDropdown';
import CartDropdown from '@/components/CartDropdown';
import { toast } from 'sonner';

interface CustomerHeaderProps {
    onToggleMobileMenu: () => void;
    isMobile: boolean;
}

interface NavItem {
    name: string;
    href: string;
    icon: any;
}

const navigation: NavItem[] = [
    { name: 'Home', href: '/dashboard', icon: LayoutGrid },
    { name: 'Orders', href: '/orders', icon: Package },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    // Messages opens support modal; href kept for accessibility but prevented
    { name: 'Messages', href: '/customer/messaging', icon: MessageCircle },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function CustomerHeader({ onToggleMobileMenu, isMobile }: CustomerHeaderProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [wishlistOpen, setWishlistOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const currentPath = window.location.pathname;
    const { state: notificationState } = useNotifications();
    const { wishlistCount } = useWishlist();
    const { totalItems } = useCart();
    const wishlistButtonRef = useRef<HTMLButtonElement>(null);
    const cartButtonRef = useRef<HTMLButtonElement>(null);

    // Check for saved theme preference or default to light mode
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

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

    const isActive = (href: string) => {
        return currentPath === href || currentPath.startsWith(href + '/');
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    {/* Left Section - Logo and Mobile Menu */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button - Only show on mobile (< 1024px) */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            onClick={onToggleMobileMenu}
                        >
                            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        </Button>
                        
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                <AppLogoIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hidden sm:inline">
                                BarfFoods
                            </span>
                        </Link>
                    </div>

                    {/* Center Section - Navigation Links (Desktop Only) */}
                    <nav className="hidden lg:flex flex-1 justify-center">
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                            {navigation.slice(0, 4).map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={(e) => {
                                        if (item.name === 'Messages') {
                                            e.preventDefault();
                                            window.dispatchEvent(new Event('open-support-modal'));
                                        }
                                    }}
                                    className={`
                                        flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-200
                                        ${isActive(item.href)
                                            ? 'bg-white dark:bg-gray-900 text-green-600 dark:text-green-500 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }
                                    `}
                                    aria-current={isActive(item.href) ? 'page' : undefined}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Search - Show full on lg+, icon only on sm-md, icon on mobile */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="hidden lg:flex items-center gap-2 px-3 xl:px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                        >
                            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                            <span className="text-sm text-gray-500 dark:text-gray-400 hidden xl:inline">Search...</span>
                            <kbd className="hidden xl:inline-block px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
                                {navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K'}
                            </kbd>
                        </button>

                        {/* Mobile Search Icon */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </Button>

                        {/* Notifications */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                data-notification-button
                                onClick={() => setNotificationOpen(!notificationOpen)}
                            >
                                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                {notificationState.unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                                        {notificationState.unreadCount > 9 ? '9+' : notificationState.unreadCount}
                                    </span>
                                )}
                            </Button>
                            <NotificationDropdown 
                                isOpen={notificationOpen} 
                                onClose={() => setNotificationOpen(false)} 
                            />
                        </div>

                        {/* Wishlist - Hide on smallest screens */}
                        <Button
                            ref={wishlistButtonRef}
                            variant="ghost"
                            size="sm"
                            className="hidden xs:flex relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            onClick={() => auth.user ? setWishlistOpen(!wishlistOpen) : toast.error('Please log in to view wishlist')}
                        >
                            <Heart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            {wishlistCount > 0 && (
                                <span className="absolute top-1 right-1 h-4 w-4 bg-pink-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                                    {wishlistCount > 9 ? '9+' : wishlistCount}
                                </span>
                            )}
                        </Button>

                        {/* Cart */}
                        <Button
                            ref={cartButtonRef}
                            variant="ghost"
                            size="sm"
                            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            onClick={() => setCartOpen(!cartOpen)}
                        >
                            <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            {totalItems > 0 && (
                                <span className="absolute top-1 right-1 h-4 w-4 bg-green-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                                    {totalItems > 9 ? '9+' : totalItems}
                                </span>
                            )}
                        </Button>

                        {/* Theme Toggle - Hide on smallest screens */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            onClick={toggleTheme}
                        >
                            {isDarkMode ? (
                                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            ) : (
                                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            )}
                        </Button>

                        {/* User Menu - Desktop Only (lg+) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="hidden lg:flex items-center gap-2 px-2 xl:px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm">
                                            {getInitials(auth.user?.name || '')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left hidden xl:block">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                                            {auth.user?.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Customer
                                        </p>
                                    </div>
                                    <ChevronsUpDown className="h-4 w-4 text-gray-400 hidden xl:block" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="end" side="bottom" sideOffset={8}>
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
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
        </header>
    );
}
