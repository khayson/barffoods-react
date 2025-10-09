import { Link } from '@inertiajs/react';
import { 
    Home, 
    ShoppingCart, 
    Package, 
    Heart, 
    User, 
    Settings, 
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { ChevronsUpDown } from 'lucide-react';

interface CustomerMobileMenuProps {
    onClose: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: any;
    color: string;
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'bg-green-100 text-green-600' },
    { name: 'Products', href: '/products', icon: Package, color: 'bg-green-100 text-green-600' },
    { name: 'My Orders', href: '/orders', icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
    { name: 'Wishlist', href: '/wishlist', icon: Heart, color: 'bg-pink-100 text-pink-600' },
    { name: 'Profile', href: '/profile', icon: User, color: 'bg-blue-100 text-blue-600' },
    { name: 'Settings', href: '/settings', icon: Settings, color: 'bg-gray-100 text-gray-600' },
];

export default function CustomerMobileMenu({ onClose }: CustomerMobileMenuProps) {
    const { auth } = usePage<SharedData>().props;
    const currentPath = window.location.pathname;
    const getInitials = useInitials();

    const isActive = (href: string) => {
        return currentPath === href;
    };

    return (
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between w-full">
                        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Apps
                        </h2>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 h-auto" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                                group flex items-center rounded-lg transition-colors duration-200 px-3 py-2
                                ${isActive(item.href)
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                }
                            `}
                            onClick={onClose}
                        >
                            <div className={`
                                flex-shrink-0 rounded-lg flex items-center justify-center w-6 h-6 mr-3
                                ${isActive(item.href) 
                                    ? item.color + ' dark:bg-opacity-20' 
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                                }
                            `}>
                                <item.icon className="h-3 w-3" />
                            </div>
                            <span className="truncate text-sm">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                {/* User Info Dropdown */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex w-full items-center rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
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
        </div>
    );
}
