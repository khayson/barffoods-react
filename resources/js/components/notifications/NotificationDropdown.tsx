import React, { useState, useEffect, useRef } from 'react';
import { Bell, Filter, Settings, Check, X, ChevronDown, MessageCircle, User, Shield, Package, CreditCard, Truck, Star, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/types/notification';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
    const { state, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const deletingIds = useRef(new Set<number>());

    // Helper function to get user initials
    const getInitials = (name: string): string => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Helper function to get notification icon
    const getNotificationIcon = (notification: Notification) => {
        switch (notification.type) {
            case 'customer':
            case 'order':
                return <MessageCircle className="h-4 w-4" />;
            case 'system':
                return <Bell className="h-4 w-4" />;
            case 'security':
                return <Shield className="h-4 w-4" />;
            case 'inventory':
                return <Package className="h-4 w-4" />;
            case 'payment':
                return <CreditCard className="h-4 w-4" />;
            case 'delivery':
                return <Truck className="h-4 w-4" />;
            case 'review':
                return <Star className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    // Helper function to get notification color
    const getNotificationColor = (notification: Notification) => {
        switch (notification.priority) {
            case 'urgent':
                return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
            case 'high':
                return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
            case 'medium':
                return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
            default:
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            // Don't close if clicking on the dropdown itself or notification button
            if (isOpen && 
                !target.closest('[data-notification-dropdown]') && 
                !target.closest('[data-notification-button]')) {
                onClose();
            }
        };

        if (isOpen) {
            // Add a small delay to prevent immediate closing
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 100);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Filter notifications
    const filteredNotifications = state.notifications.filter(notification => {
        if (filter === 'unread') {
            return notification.status === 'unread';
        }
        return true;
    });

    const handleMarkAsRead = async (id: number) => {
        try {
            await markAsRead(id);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleDelete = async (id: number) => {
        // Prevent duplicate deletions
        if (deletingIds.current.has(id)) {
            return;
        }
        
        deletingIds.current.add(id);
        try {
            await deleteNotification(id);
        } catch (error) {
            // Error is already handled in the context
        } finally {
            deletingIds.current.delete(id);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            data-notification-dropdown
            className="absolute top-full right-0 mt-2 w-96 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-[9999]"
            style={{ maxHeight: 'calc(100vh - 6rem)' }}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700 bg-gray-800 rounded-t-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-white" />
                        <h3 className="text-sm font-bold text-white">
                            Notifications
                        </h3>
                        {state.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                                {/* {state.unreadCount >= 9 ? '9+' : state.unreadCount} */}
                                {state.unreadCount}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center space-x-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                            className="h-6 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
                        >
                            <Filter className="h-3 w-3 mr-1" />
                            {filter === 'all' ? 'All' : 'Unread'}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700">
                            <Settings className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {state.notifications.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-700 bg-gray-800">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{filteredNotifications.length} notifications</span>
                        {state.unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="h-5 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-gray-700"
                            >
                                <Check className="h-3 w-3 mr-1" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-hidden bg-gray-900">
                {filteredNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <Bell className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-96">
                        <div className="divide-y divide-gray-700">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-3 hover:bg-gray-800 transition-colors ${
                                        notification.status === 'unread' ? 'bg-gray-800/50' : ''
                                    }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        {/* Avatar/Icon */}
                                        <div className="flex-shrink-0 mt-1">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={notification.data?.user?.avatar} />
                                                <AvatarFallback className={`${getNotificationColor(notification)} font-semibold text-sm`}>
                                                    {notification.data?.user?.name ? getInitials(notification.data.user.name) : 'M'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-white truncate">
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(notification.created_at).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                        {notification.action_text && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                                                            >
                                                                {notification.action_text}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center space-x-1 ml-2">
                                                    {notification.status === 'unread' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="h-6 w-6 p-0 text-gray-400 hover:text-green-400 hover:bg-gray-700"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(notification.id)}
                                                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Footer */}
            {state.notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-700 bg-gray-800 rounded-b-xl">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-gray-400 hover:text-white hover:bg-gray-700"
                    >
                        View All Notifications
                        <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}