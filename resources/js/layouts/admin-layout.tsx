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
import { ChevronsUpDown, Bell, MessageSquare, Search, LayoutGrid, Sun, Moon, ShoppingCart, Settings, Package, Store as StoreIcon, Tag, ChevronRight, Home } from 'lucide-react';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

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

    const pathSegments = currentPath.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        return {
            label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
            href,
            active: index === pathSegments.length - 1
        };
    });

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
                <div className="h-16 px-6 flex items-center border-b border-gray-100 dark:border-gray-800">
                    <Link href="/admin/dashboard" className="flex items-center space-x-3 group">
                        <div className="w-9 h-9 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                            <StoreIcon className="h-5 w-5 text-white dark:text-gray-900" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">BARFFOODS</h1>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Professional Admin</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
                    {/* Dashboard */}
                    <Link
                        href="/admin/dashboard"
                        className={`
                            group flex items-center px-3 py-2 rounded-lg transition-all duration-200
                            ${isActive('/admin/dashboard')
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <LayoutGrid className="h-4.5 w-4.5 mr-3" />
                        <span className="text-sm font-medium">Dashboard</span>
                    </Link>

                    <div className="pt-4 pb-2 px-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Management</span>
                    </div>

                    {/* Orders */}
                    <Link
                        href="/admin/orders"
                        className={`
                            group flex items-center px-3 py-2 rounded-lg transition-all duration-200
                            ${isActive('/admin/orders')
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <ShoppingCart className="h-4.5 w-4.5 mr-3" />
                        <span className="text-sm font-medium">Orders</span>
                    </Link>

                    {/* Products */}
                    <Link
                        href="/admin/products"
                        className={`
                            group flex items-center px-3 py-2 rounded-lg transition-all duration-200
                            ${isActive('/admin/products')
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <Package className="h-4.5 w-4.5 mr-3" />
                        <span className="text-sm font-medium">Products</span>
                    </Link>

                    {/* Stores */}
                    <Link
                        href="/admin/stores"
                        className={`
                            group flex items-center px-3 py-2 rounded-lg transition-all duration-200
                            ${isActive('/admin/stores')
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <StoreIcon className="h-4.5 w-4.5 mr-3" />
                        <span className="text-sm font-medium">Stores</span>
                    </Link>

                    {/* Categories */}
                    <Link
                        href="/admin/categories"
                        className={`
                            group flex items-center px-3 py-2 rounded-lg transition-all duration-200
                            ${isActive('/admin/categories')
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <Tag className="h-4.5 w-4.5 mr-3" />
                        <span className="text-sm font-medium">Categories</span>
                    </Link>

                    <div className="pt-4 pb-2 px-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">System</span>
                    </div>

                    {/* Notifications */}
                    <Link
                        href="/admin/notifications"
                        className={`
                            group flex items-center px-3 py-2 rounded-lg transition-all duration-200
                            ${isActive('/admin/notifications')
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <Bell className="h-4.5 w-4.5 mr-3" />
                        <span className="text-sm font-medium">Notifications</span>
                    </Link>

                    {/* Messages */}
                    <Link
                        href="/admin/messaging"
                        className={`
                            group flex items-center px-3 py-2 rounded-lg transition-all duration-200
                            ${isActive('/admin/messaging')
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <MessageSquare className="h-4.5 w-4.5 mr-3" />
                        <span className="text-sm font-medium">Messages</span>
                    </Link>

                    {/* System Settings */}
                    <Link
                        href="/admin/system-settings"
                        className={`
                            group flex items-center px-3 py-2 rounded-lg transition-all duration-200
                            ${isActive('/admin/system-settings')
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <Settings className="h-4.5 w-4.5 mr-3" />
                        <span className="text-sm font-medium">Settings</span>
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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex w-full items-center space-x-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                                <Avatar className="h-9 w-9 border-2 border-white dark:border-gray-900 shadow-sm">
                                    <AvatarImage src={auth.user?.avatar} />
                                    <AvatarFallback className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold">
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
                <header className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center space-x-6 flex-1">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Breadcrumbs - Desktop Only */}
                        <div className="hidden md:block">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href="/admin/dashboard" className="flex items-center">
                                            <Home className="h-3.5 w-3.5" />
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    {breadcrumbs.map((crumb, idx) => (
                                        <span key={crumb.href} className="flex items-center">
                                            <BreadcrumbSeparator>
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </BreadcrumbSeparator>
                                            <BreadcrumbItem>
                                                {crumb.active ? (
                                                    <BreadcrumbPage className="font-semibold text-gray-900 dark:text-white">
                                                        {crumb.label}
                                                    </BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink href={crumb.href}>
                                                        {crumb.label}
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                        </span>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-2">
                        {/* Search Trigger */}
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <Search className="h-4.5 w-4.5" />
                        </Button>
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
                <div className="flex-1 overflow-auto p-6 scrollbar-thin">
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
