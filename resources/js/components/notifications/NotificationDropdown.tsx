import React, { useState, useEffect, useRef } from 'react';
import { Bell, Filter, Settings, Check, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
            className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[9999]"
            style={{ maxHeight: 'calc(100vh - 6rem)' }}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        {state.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
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
                            className="h-6 px-2 text-xs"
                        >
                            <Filter className="h-3 w-3 mr-1" />
                            {filter === 'all' ? 'All' : 'Unread'}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            <Settings className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {state.notifications.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{filteredNotifications.length} notifications</span>
                        {state.unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="h-5 px-2 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            >
                                <Check className="h-3 w-3 mr-1" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-hidden">
                {filteredNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-96">
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                        notification.status === 'unread' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                                >
                                    <div className="flex items-start space-x-3">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                notification.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900' :
                                                notification.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900' :
                                                notification.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900' :
                                                'bg-gray-100 dark:bg-gray-700'
                                            }`}>
                                                <span className="text-xs">
                                                    {notification.icon || '🔔'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
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
                                                                className="h-5 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
                                                            className="h-6 w-6 p-0 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(notification.id)}
                                                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
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
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        View All Notifications
                        <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}