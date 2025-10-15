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
import { ChevronsUpDown, Bell, MessageSquare, Search, LayoutGrid, Sun, Moon, ShoppingCart, Settings } from 'lucide-react';
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
    const isActive = (href: string) => currentPath === href;

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Left Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-800 shadow-lg rounded-xl m-4 flex flex-col border border-gray-400 dark:border-gray-600">
                {/* Sidebar Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Barffoods Admin
                        </h2>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isDarkMode}
                            onClick={() => setIsDarkMode((v) => !v)}
                            className={`relative inline-flex items-center transition-colors duration-200
                                h-6 w-12 rounded-full border
                                ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-400'}`}
                            aria-label="Toggle theme"
                        >
                            {/* Sun icon (left) */}
                            <Sun className={`absolute left-1 h-3.5 w-3.5 transition-opacity duration-200
                                ${isDarkMode ? 'opacity-40 text-yellow-400' : 'opacity-100 text-yellow-500'}`} />
                            {/* Moon icon (right) */}
                            <Moon className={`absolute right-1 h-3.5 w-3.5 transition-opacity duration-200
                                ${isDarkMode ? 'opacity-100 text-gray-200' : 'opacity-40 text-gray-600'}`} />
                            {/* Thumb */}
                            <span
                                className={`inline-block h-5 w-5 bg-white dark:bg-gray-200 rounded-full shadow-sm transform transition-transform duration-200
                                    ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`}
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    {/* Dashboard */}
                    <Link
                        href="/admin/dashboard"
                        className={`
                            group flex items-center rounded-lg transition-colors duration-200 px-4 py-3
                            ${isActive('/admin/dashboard')
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <div className={`
                            flex-shrink-0 rounded-lg flex items-center justify-center w-6 h-6 mr-3
                            ${isActive('/admin/dashboard')
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                            }
                        `}>
                            <LayoutGrid className="h-3 w-3" />
                        </div>
                        <span className="truncate text-sm font-medium">Dashboard</span>
                    </Link>

                    {/* Orders */}
                    <Link
                        href="/admin/orders"
                        className={`
                            group flex items-center rounded-lg transition-colors duration-200 px-4 py-3
                            ${isActive('/admin/orders')
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <div className={`
                            flex-shrink-0 rounded-lg flex items-center justify-center w-6 h-6 mr-3
                            ${isActive('/admin/orders')
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                            }
                        `}>
                            <ShoppingCart className="h-3 w-3" />
                        </div>
                        <span className="truncate text-sm font-medium">Orders</span>
                    </Link>

                    {/* Notifications */}
                    <Link
                        href="/admin/notifications"
                        className={`
                            group flex items-center rounded-lg transition-colors duration-200 px-4 py-3
                            ${isActive('/admin/notifications')
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <div className={`
                            flex-shrink-0 rounded-lg flex items-center justify-center w-6 h-6 mr-3
                            ${isActive('/admin/notifications')
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                            }
                        `}>
                            <Bell className="h-3 w-3" />
                        </div>
                        <span className="truncate text-sm font-medium">Notifications</span>
                    </Link>

                    {/* Messages */}
                    <Link
                        href="/admin/messaging"
                        className={`
                            group flex items-center rounded-lg transition-colors duration-200 px-4 py-3
                            ${isActive('/admin/messaging')
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <div className={`
                            flex-shrink-0 rounded-lg flex items-center justify-center w-6 h-6 mr-3
                            ${isActive('/admin/messaging')
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                            }
                        `}>
                            <MessageSquare className="h-3 w-3" />
                        </div>
                        <span className="truncate text-sm font-medium">Messages</span>
                    </Link>

                    {/* System Settings */}
                    <Link
                        href="/admin/system-settings"
                        className={`
                            group flex items-center rounded-lg transition-colors duration-200 px-4 py-3
                            ${isActive('/admin/system-settings')
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                <div className={`
                            flex-shrink-0 rounded-lg flex items-center justify-center w-6 h-6 mr-3
                            ${isActive('/admin/system-settings')
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                            }
                        `}>
                            <Settings className="h-3 w-3" />
                        </div>
                        <span className="truncate text-sm font-medium">System Settings</span>
                    </Link>
                </nav>

                {/* User Info Dropdown */}
                <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex w-full items-center rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                <UserInfo user={auth.user} />
                                <ChevronsUpDown className="ml-auto size-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56 rounded-lg z-[60]"
                            align="end"
                            side="top"
                            sideOffset={5}
                        >
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Row - icons, messages, search, datetime (no card background) */}
                <div className="m-4 mb-2 h-12 flex items-center justify-between px-6 sticky top-0 z-50 bg-transparent overflow-visible">
                    {/* Left side - Icons */}
                    <div className="flex items-center space-x-6">
                        {/* Bell icon */}
                        <div className="relative z-50 overflow-visible">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="p-0 h-6 w-6 text-gray-700 dark:text-gray-300 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded relative"
                                onClick={() => setNotificationOpen(!notificationOpen)}
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
                                onClose={() => setNotificationOpen(false)} 
                    />
                </div>

                        {/* Message icon */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="p-0 h-6 w-6 text-gray-700 dark:text-gray-300 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded"
                        >
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                        
                        {/* Search bar with icon INSIDE */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 h-9 border border-gray-300 dark:border-gray-600 rounded-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition w-[360px] md:w-[420px] lg:w-[460px] text-sm"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    </div>
            </div>

                    {/* Right side - Date/Time */}
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {formatDateTime(currentDateTime)}
                    </div>
                </div>

                {/* Main Content Canvas */}
                <div className="flex-1 ml-1 mr-6 mb-4 mt-0 rounded-[48px] border border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-900/20 shadow-sm overflow-hidden">
                    {/* Children wrapper keeps content inside frame and style */}
                    <div className="h-full w-full overflow-auto p-6 bg-transparent [&>*]:max-w-full [&>*]:m-0 [&>*]:bg-transparent scrollbar-hide">
                        {children}
                    </div>
                </div>
            </div>
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