import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Package,
    ShoppingCart,
    Users,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';
import { type SharedData } from '@/types';
import { Button } from '@/components/ui/button';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { ChevronsUpDown } from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    color: string;
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid, color: 'bg-green-100 text-green-600' },
    { name: 'Products', href: '/admin/products', icon: Package, color: 'bg-green-100 text-green-600' },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
    { name: 'Customers', href: '/admin/customers', icon: Users, color: 'bg-green-100 text-green-600' },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, color: 'bg-purple-100 text-purple-600' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, color: 'bg-gray-100 text-gray-600' },
];

interface AdminSidebarProps {
    isMobile?: boolean;
    onClose?: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function AdminSidebar({ isMobile = false, onClose, collapsed = false, onToggleCollapse }: AdminSidebarProps) {
    const { auth } = usePage<SharedData>().props;
    const currentPath = window.location.pathname;
    const getInitials = useInitials();

    const isActive = (href: string) => {
        return currentPath === href;
    };

    return (
        <div className={`
            flex flex-col bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden relative transition-all duration-300 ease-in-out
            ${collapsed ? 'w-16' : 'w-55'}
            ${isMobile ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-8rem)]'}
        `}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    {isMobile && (
                        <div className="flex items-center justify-between w-full">
                            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Apps
                            </h2>
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 h-auto" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    {!isMobile && (
                        <>
                            {collapsed ? (
                                <button
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mx-auto"
                                    onClick={onToggleCollapse}
                                >
                                    {/* <ChevronRight className="h-4 w-4" /> */}
                                </button>
                            ) : (
                                <div className="flex items-center justify-between w-full">
                                    <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Apps
                                    </h2>
                                    <button
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        onClick={onToggleCollapse}
                                    >
                                        {/* <ChevronLeft className="h-4 w-4" /> */}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
                {navigation.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`
                            group flex items-center rounded-lg transition-colors duration-200
                            ${collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'}
                            ${isActive(item.href)
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                        title={collapsed ? item.name : undefined}
                    >
                        <div className={`
                            flex-shrink-0 rounded-lg flex items-center justify-center
                            ${collapsed ? 'w-8 h-8' : 'w-6 h-6 mr-3'}
                            ${isActive(item.href)
                                ? item.color + ' dark:bg-opacity-20'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                            }
                        `}>
                            <item.icon className={collapsed ? "h-4 w-4" : "h-3 w-3"} />
                        </div>
                        {!collapsed && (
                            <span className="truncate text-sm">{item.name}</span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* User Info Dropdown */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                            {collapsed ? (
                                <div className="flex items-center justify-center w-full">
                                    <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                                        <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(auth.user?.name || '')}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            ) : (
                                <>
                                    <UserInfo user={auth.user} />
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </>
                            )}
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
    );
}