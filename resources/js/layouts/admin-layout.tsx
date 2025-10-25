import { type ReactNode, useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Toaster } from '@/components/ui/sonner';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { ChevronsUpDown, Bell, MessageSquare, Search, LayoutGrid, Sun, Moon, ShoppingCart, Settings, Package } from 'lucide-react';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface AdminLayoutProps {
    children: ReactNode;
    hideRightSidebar?: boolean;
}

function AdminLayoutContent({ children, hideRightSidebar = false }: AdminLayoutProps) {
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const { state: notificationState } = useNotifications();
    const getInitials = useInitials();
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Update date/time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDateTime = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        return date.toLocaleDateString('en-US', options).replace(' at ', ' | ');
    };

    const currentPath = window.location.pathname;

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setShowSidebar(false);
    }, [currentPath]);
    
    const isActive = (href: string) => currentPath === href;

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-950 flex overflow-hidden">
            {/* Mobile Overlay */}
            {showSidebar && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Left Sidebar */}
            <aside className={`
                ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
                fixed lg:static inset-y-0 left-0 z-50
                w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
                flex flex-col
                transition-transform duration-300 ease-in-out
            `}>
                {/* Sidebar Header - Brand */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">BF</span>
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">BarfFoods</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {/* Dashboard */}
                    <Link
                        href="/admin/dashboard"
                        className={`
                            group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                            ${isActive('/admin/dashboard')
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <LayoutGrid className={`h-5 w-5 mr-3 ${isActive('/admin/dashboard') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                        <span className="text-sm font-medium">Dashboard</span>
                        {isActive('/admin/dashboard') && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        )}
                    </Link>

                    {/* Orders */}
                    <Link
                        href="/admin/orders"
                        className={`
                            group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                            ${isActive('/admin/orders')
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <ShoppingCart className={`h-5 w-5 mr-3 ${isActive('/admin/orders') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                        <span className="text-sm font-medium">Orders</span>
                        {isActive('/admin/orders') && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        )}
                    </Link>

                    {/* Products */}
                    <Link
                        href="/admin/products"
                        className={`
                            group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                            ${isActive('/admin/products')
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <Package className={`h-5 w-5 mr-3 ${isActive('/admin/products') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                        <span className="text-sm font-medium">Products</span>
                        {isActive('/admin/products') && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        )}
                    </Link>

                    {/* Notifications */}
                    <Link
                        href="/admin/notifications"
                        className={`
                            group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                            ${isActive('/admin/notifications')
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <Bell className={`h-5 w-5 mr-3 ${isActive('/admin/notifications') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                        <span className="text-sm font-medium">Notifications</span>
                        {isActive('/admin/notifications') && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        )}
                    </Link>

                    {/* Messages */}
                    <Link
                        href="/admin/messaging"
                        className={`
                            group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                            ${isActive('/admin/messaging')
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <MessageSquare className={`h-5 w-5 mr-3 ${isActive('/admin/messaging') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                        <span className="text-sm font-medium">Messages</span>
                        {isActive('/admin/messaging') && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        )}
                    </Link>

                    {/* System Settings */}
                    <Link
                        href="/admin/system-settings"
                        className={`
                            group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                            ${isActive('/admin/system-settings')
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <Settings className={`h-5 w-5 mr-3 ${isActive('/admin/system-settings') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                        <span className="text-sm font-medium">Settings</span>
                        {isActive('/admin/system-settings') && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                        )}
                    </Link>
                </nav>

                {/* Theme Toggle & User */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                        <div className="flex items-center space-x-2">
                            {isDarkMode ? (
                                <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            ) : (
                                <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            )}
                        </div>
                    </button>

                    {/* User Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex w-full items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={auth.user?.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                                        {getInitials(auth.user?.name || '')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{auth.user?.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{auth.user?.email}</p>
                                </div>
                                <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64" align="end" side="top" sideOffset={8}>
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950">
                {/* Top Header Bar */}
                <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    {/* Left Side - Mobile Menu + Search */}
                    <div className="flex items-center space-x-3 flex-1 max-w-2xl">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-4 ml-6">
                        {/* Date/Time */}
                        <div className="hidden lg:flex items-center text-sm text-gray-600 dark:text-gray-400">
                            {formatDateTime(currentDateTime)}
                        </div>

                        {/* Notifications */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => setNotificationOpen(!notificationOpen)}
                            >
                                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                {notificationState.unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-medium">
                                        {notificationState.unreadCount > 9 ? '9+' : notificationState.unreadCount}
                                    </span>
                                )}
                            </Button>
                            <NotificationDropdown 
                                isOpen={notificationOpen} 
                                onClose={() => setNotificationOpen(false)} 
                            />
                        </div>

                        {/* Messages */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </Button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-auto p-6 scrollbar-hide">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    
    // Check localStorage for user's global preference
    const [globalHideRightSidebar, setGlobalHideRightSidebar] = useState(false);
    
    useEffect(() => {
        const savedPreference = localStorage.getItem('admin-hide-right-sidebar');
        if (savedPreference !== null) {
            setGlobalHideRightSidebar(JSON.parse(savedPreference));
        }
    }, []);
    
    // Use global preference for all pages
    const hideRightSidebar = globalHideRightSidebar;
    
    return (
        <NotificationProvider userId={auth.user?.id?.toString()}>
            <AdminLayoutContent hideRightSidebar={hideRightSidebar}>
                {children}
            </AdminLayoutContent>
        </NotificationProvider>
    );
}