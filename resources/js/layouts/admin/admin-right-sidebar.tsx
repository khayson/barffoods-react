import { useState } from 'react';
import { 
    Bell, 
    Activity, 
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    X,
    ShoppingCart,
    User,
    Package,
    AlertCircle,
    CheckCircle,
    ExternalLink,
    MessageSquare,
    Clock,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

interface AdminRightSidebarProps {
    isMobile?: boolean;
    onClose?: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    screenSize?: 'mobile' | 'tablet' | 'desktop' | 'large';
}

interface NotificationItem {
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
    time: string;
    unread: boolean;
}

interface ActivityItem {
    id: string;
    type: 'order' | 'customer' | 'product' | 'system';
    title: string;
    description: string;
    time: string;
    icon: any;
}


const mockNotifications: NotificationItem[] = [
    {
        id: '1',
        type: 'success',
        title: 'New Order Received',
        message: 'Order #12345 has been placed successfully',
        time: '2 min ago',
        unread: true
    },
    {
        id: '2',
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Product "Organic Apples" is running low',
        time: '15 min ago',
        unread: true
    },
    {
        id: '3',
        type: 'info',
        title: 'System Update',
        message: 'Dashboard has been updated to v2.1.0',
        time: '1 hour ago',
        unread: false
    }
];

const mockActivities: ActivityItem[] = [
    {
        id: '1',
        type: 'order',
        title: 'New Order',
        description: 'Order #12345 - $89.99',
        time: '2 min ago',
        icon: ShoppingCart
    },
    {
        id: '2',
        type: 'customer',
        title: 'New Customer',
        description: 'John Doe registered',
        time: '5 min ago',
        icon: User
    },
    {
        id: '3',
        type: 'product',
        title: 'Product Updated',
        description: 'Organic Apples price changed',
        time: '10 min ago',
        icon: Package
    }
];


export default function AdminRightSidebar({ isMobile = false, onClose, collapsed = false, onToggleCollapse, screenSize = 'desktop' }: AdminRightSidebarProps) {
    const { state: notificationState } = useNotifications();
    const [activities] = useState<ActivityItem[]>(mockActivities);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
            default: return <Bell className="h-4 w-4 text-blue-500" />;
        }
    };


    return (
        <div className={`
            flex flex-col bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden relative transition-all duration-300 ease-in-out scrollbar-hide
            ${collapsed ? 'w-16' : 'w-80'}
            ${isMobile ? 'h-full' : 'h-[calc(100vh-8rem)]'}
        `}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    {isMobile && (
                        <div className="flex items-center justify-between w-full">
                            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Activity
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
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            ) : (
                                <div className="flex items-center justify-between w-full">
                                    <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Activity
                                    </h2>
                                    <button
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        onClick={onToggleCollapse}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">

                {/* Notifications */}
                <div>
                    {!collapsed ? (
                        <>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                Notifications ({notificationState.unreadCount})
                            </h3>
                            <div className="space-y-2">
                                {notificationState.notifications.slice(0, 5).map((notification) => (
                                    <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${notification.status === 'unread' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700'} ${notification.priority === 'urgent' ? 'border-red-500' : notification.priority === 'high' ? 'border-orange-500' : notification.priority === 'medium' ? 'border-yellow-500' : 'border-green-500'}`}>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-lg">{notification.icon || '🔔'}</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{notification.message}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {notificationState.notifications.length === 0 && (
                                    <div className="text-center py-4">
                                        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center">
                            <div className="relative">
                                <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                {notificationState.unreadCount > 0 && (
                                    <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center ${
                                        notificationState.unreadCount >= 9 
                                            ? 'px-1.5 py-0.5 min-w-[1.5rem] h-4' 
                                            : 'h-4 w-4'
                                    }`}>
                                        {notificationState.unreadCount >= 9 ? '9+' : notificationState.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Messaging Stats */}
                <div>
                    {!collapsed ? (
                        <>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Messaging</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <MessageSquare className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">Open</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-600">3</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">In Progress</span>
                                    </div>
                                    <span className="text-sm font-bold text-yellow-600">2</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">Urgent</span>
                                    </div>
                                    <span className="text-sm font-bold text-red-600">1</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Users className="h-4 w-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">Total</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">12</span>
                                </div>
                            </div>
                            
                            <div className="mt-3">
                                <a 
                                    href="/admin/messaging" 
                                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    <span>View All</span>
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center">
                            <MessageSquare className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div>
                    {!collapsed ? (
                        <>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
                            <div className="space-y-3">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                            <activity.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{activity.description}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center">
                            <Activity className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Help & Support */}
                <div>
                    {!collapsed ? (
                        <>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Help & Support</h3>
                            <div className="space-y-2">
                                <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-left">
                                    <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm text-gray-900 dark:text-white">Documentation</span>
                                    <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                                </button>
                                <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-left">
                                    <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm text-gray-900 dark:text-white">Contact Support</span>
                                    <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-center">
                            <HelpCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
