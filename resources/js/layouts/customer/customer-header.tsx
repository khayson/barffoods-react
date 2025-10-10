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
import { useState, useEffect } from 'react';
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
    // { name: 'Support', href: '/customer/messaging', icon: MessageCircle },
    // { name: 'Products', href: '/products', icon: Package },
    // { name: 'Profile', href: '/profile', icon: User },
    // { name: 'Settings', href: '/settings', icon: Settings },
];

export default function CustomerHeader({ onToggleMobileMenu, isMobile }: CustomerHeaderProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const currentPath = window.location.pathname;
    const { state: notificationState, setDropdownOpen } = useNotifications();

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
        return currentPath === href;
    };

    return (
        <header className="sticky top-4 z-50 w-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg rounded-full">
                    <div className="flex h-16 items-center justify-between px-6">
                    {/* Left Section - Logo and Mobile Menu */}
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={onToggleMobileMenu}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        
                        <div className="flex items-center space-x-2">
                            <AppLogoIcon className="w-7 h-7" />
                            {!isMobile && (
                                <span className="text-lg font-bold text-gray-900 dark:text-white">BarfFoods</span>
                            )}
                        </div>
                    </div>

                        {/* Center Section - Navigation Links (Desktop Only) */}
                        {!isMobile && (
                            <div className="flex-1 flex justify-center">
                                <nav className="flex items-center space-x-6">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`
                                                flex items-center space-x-2 px-3 py-2 rounded-full transition-colors duration-200
                                                ${isActive(item.href)
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }
                                            `}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            <span className="text-sm font-medium">{item.name}</span>
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        )}

                    {/* Right Section - Search and Actions */}
                    <div className="flex items-center space-x-2">
                        {/* Search - Desktop Only */}
                        {!isMobile && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-48 pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    readOnly
                                    onClick={() => setSearchOpen(true)}
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full">
                                        {navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K'}
                                    </kbd>
                                </div>
                            </div>
                        )}

                        {/* Mobile Search */}
                        {isMobile && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                onClick={() => setSearchOpen(true)}
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        )}

                        {/* Notifications */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative"
                                data-notification-button
                                onClick={() => {
                                    const newState = !notificationOpen;
                                    setNotificationOpen(newState);
                                    setDropdownOpen(newState);
                                }}
                            >
                                <Bell className="h-5 w-5" />
                                {notificationState.unreadCount > 0 && (
                                    <span className={`absolute -top-1 -right-1 bg-red-500 rounded-full text-xs text-white flex items-center justify-center ${
                                        notificationState.unreadCount >= 9 
                                            ? 'px-1.5 py-0.5 min-w-[1.5rem] h-4' 
                                            : 'h-3 w-3'
                                    }`}>
                                        {notificationState.unreadCount >= 9 ? '9+' : notificationState.unreadCount}
                                    </span>
                                )}
                            </Button>
                            <NotificationDropdown 
                                isOpen={notificationOpen} 
                                onClose={() => {
                                    setNotificationOpen(false);
                                    setDropdownOpen(false);
                                }} 
                            />
                        </div>

                        {/* Wishlist */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative"
                        >
                            <Heart className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-pink-500 rounded-full text-xs text-white flex items-center justify-center">
                                5
                            </span>
                        </Button>

                        {/* Cart */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full text-xs text-white flex items-center justify-center">
                                2
                            </span>
                        </Button>

                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={toggleTheme}
                        >
                            {isDarkMode ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </Button>

                        {/* User Menu - Desktop Only */}
                        {!isMobile && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center space-x-1 ml-1 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <Avatar className="h-7 w-7 overflow-hidden rounded-full">
                                            <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                            <AvatarFallback className="rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                                {getInitials(auth.user?.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {auth.user?.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Customer
                                            </p>
                                        </div>
                                        <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-56 rounded-lg"
                                    align="end"
                                    side="bottom"
                                >
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    </div>
                </div>
            </div>
            
            {/* Product Search Modal */}
            <ProductSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </header>
    );
}
