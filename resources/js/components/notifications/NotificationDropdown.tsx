import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, X, Package, Truck, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { Link } from '@inertiajs/react';
import NotificationModal from '@/components/notifications/NotificationModal';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
    const { state, markAsRead, markAllAsRead } = useNotifications();

    // Get notification icon and color
    const getNotificationIcon = (notification: any) => {
        const { data } = notification;
        const color = data?.color || 'text-gray-600 dark:text-gray-400';
        const bgColor = data?.color
            ? `bg-${data.color}-50 dark:bg-${data.color}-900/20`
            : 'bg-gray-50 dark:bg-gray-900/20';
        // Map basic types to icons; fallback to bell
        switch ((notification.type || '').toLowerCase()) {
            case 'order':
                return { icon: Package, color: color, bgColor };
            case 'message':
                return { icon: CheckCircle, color: color, bgColor };
            case 'delivery':
                return { icon: Truck, color: color, bgColor };
            default:
                return { icon: Bell, color: color, bgColor };
        }
    };

    // Get notification action URL
    const getNotificationUrl = (notification: any) => {
        const { data } = notification;
        if (data?.action_url) return data.action_url;
        if (notification.type === 'order' && data?.order_id) return `/orders/${data.order_id}`;
        return null;
    };

    // Format notification message
    const getNotificationMessage = (notification: any) => {
        const { data } = notification;
        if (typeof data?.message === 'string' && data.message.length) return data.message;
        if (typeof data?.title === 'string' && data.title.length) return data.title;
        switch ((notification.type || '').toLowerCase()) {
            case 'order':
                return `Order update`;
            case 'message':
                return 'New message';
            default:
                return 'New notification';
        }
    };

    // Format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const [openModal, setOpenModal] = React.useState(false);
    const [selected, setSelected] = React.useState<any | null>(null);

    if (!isOpen) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-[100]" 
                onClick={onClose}
            />
            
            {/* Dropdown */}
            <Card className="fixed right-6 top-16 w-96 z-[110] shadow-lg dark:shadow-gray-800/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-gray-900 dark:text-white">Notifications</CardTitle>
                        <div className="flex items-center gap-2">
                            <Link href={location.pathname.startsWith('/admin') ? '/admin/notifications' : '/notifications'} className="text-xs text-green-600 dark:text-green-400 hover:underline">View all</Link>
                            {state.unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    <ScrollArea className="h-96">
                        {state.isLoading ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                Loading notifications...
                            </div>
                        ) : state.notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                No notifications yet
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {state.notifications.map((notification) => {
                                    const { icon: Icon, color, bgColor } = getNotificationIcon(notification);
                                    const url = getNotificationUrl(notification);
                                    const isClickable = url !== null;
                                    
                                    const NotificationContent = () => (
                                        <div className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                                            !notification.read_at ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                        }`}>
                                            <div className="flex items-start space-x-3">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
                                                    <Icon className={`w-4 h-4 ${color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {getNotificationMessage(notification)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {formatTime(notification.created_at)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {isClickable && (
                                                        <ExternalLink className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                                    )}
                                                    {!notification.read_at && (
                                                        <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                    
                                    const openDetail = () => {
                                        setSelected(notification);
                                        setOpenModal(true);
                                    };

                                    return isClickable ? (
                                        <Link
                                            key={notification.id}
                                            href={url}
                                            onClick={() => {
                                                markAsRead(notification.id);
                                                onClose();
                                            }}
                                        >
                                            <NotificationContent />
                                        </Link>
                                    ) : (
                                        <div
                                            key={notification.id}
                                            onClick={() => {
                                                markAsRead(notification.id);
                                                openDetail();
                                            }}
                                        >
                                            <NotificationContent />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
            <NotificationModal isOpen={openModal} onClose={() => setOpenModal(false)} notification={selected} onMarkRead={(id) => markAsRead(id)} />
        </>,
        document.body
    );
};

export default NotificationDropdown;