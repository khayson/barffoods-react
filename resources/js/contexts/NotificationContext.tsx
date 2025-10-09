import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { 
    Notification, 
    NotificationSettings, 
    NotificationFilters, 
    NotificationEvent,
    WebSocketMessage 
} from '@/types/notification';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { toast } from 'sonner';

// Extend Window interface for Pusher
declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

// Notification State
interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    settings: NotificationSettings;
    filters: NotificationFilters;
    isConnected: boolean;
    lastUpdate: Date | null;
    dropdownOpen: boolean;
}

// Notification Actions
type NotificationAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
    | { type: 'ADD_NOTIFICATION'; payload: Notification }
    | { type: 'UPDATE_NOTIFICATION'; payload: Notification }
    | { type: 'REMOVE_NOTIFICATION'; payload: number }
    | { type: 'MARK_AS_READ'; payload: number }
    | { type: 'MARK_ALL_AS_READ' }
    | { type: 'SET_SETTINGS'; payload: NotificationSettings }
    | { type: 'SET_FILTERS'; payload: NotificationFilters }
    | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
    | { type: 'SET_LAST_UPDATE'; payload: Date }
    | { type: 'SET_DROPDOWN_OPEN'; payload: boolean };

// Initial State
const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    settings: {
        email: true,
        push: true,
        inApp: true,
        types: {
            order: true,
            product: true,
            system: true,
            promotion: true,
            security: true,
            inventory: true,
            customer: true,
            payment: true,
            delivery: true,
            review: true,
        },
        frequency: 'immediate',
    },
    filters: {},
    isConnected: false,
    lastUpdate: null,
    dropdownOpen: false,
};

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        
        case 'SET_NOTIFICATIONS':
            const unreadCount = action.payload.filter(n => n.status === 'unread').length;
            return {
                ...state,
                notifications: action.payload,
                unreadCount,
                lastUpdate: new Date(),
            };
        
                case 'ADD_NOTIFICATION':
                    const newNotifications = [action.payload, ...state.notifications];
                    const newUnreadCount = newNotifications.filter(n => n.status === 'unread').length;
                    return {
                        ...state,
                        notifications: newNotifications,
                        unreadCount: newUnreadCount,
                        lastUpdate: new Date(),
                    };
        
        case 'UPDATE_NOTIFICATION':
            const updatedNotifications = state.notifications.map(n =>
                n.id === action.payload.id ? action.payload : n
            );
            const updatedUnreadCount = updatedNotifications.filter(n => n.status === 'unread').length;
            return {
                ...state,
                notifications: updatedNotifications,
                unreadCount: updatedUnreadCount,
                lastUpdate: new Date(),
            };
        
        case 'REMOVE_NOTIFICATION':
            const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
            const filteredUnreadCount = filteredNotifications.filter(n => n.status === 'unread').length;
            return {
                ...state,
                notifications: filteredNotifications,
                unreadCount: filteredUnreadCount,
                lastUpdate: new Date(),
            };
        
        case 'MARK_AS_READ':
            const markedNotifications = state.notifications.map(n =>
                n.id === action.payload ? { ...n, status: 'read' as const, read_at: new Date().toISOString() } : n
            );
            const markedUnreadCount = markedNotifications.filter(n => n.status === 'unread').length;
            return {
                ...state,
                notifications: markedNotifications,
                unreadCount: markedUnreadCount,
                lastUpdate: new Date(),
            };
        
        case 'MARK_ALL_AS_READ':
            const allReadNotifications = state.notifications.map(n => ({
                ...n,
                status: 'read' as const,
                read_at: n.status === 'unread' ? new Date().toISOString() : n.read_at,
            }));
            return {
                ...state,
                notifications: allReadNotifications,
                unreadCount: 0,
                lastUpdate: new Date(),
            };
        
        case 'SET_SETTINGS':
            return { ...state, settings: action.payload };
        
        case 'SET_FILTERS':
            return { ...state, filters: action.payload };
        
        case 'SET_CONNECTION_STATUS':
            return { ...state, isConnected: action.payload };
        
        case 'SET_LAST_UPDATE':
            return { ...state, lastUpdate: action.payload };
        
        case 'SET_DROPDOWN_OPEN':
            return { ...state, dropdownOpen: action.payload };
        
        default:
            return state;
    }
}

// Context
interface NotificationContextType {
    state: NotificationState;
    dispatch: React.Dispatch<NotificationAction>;
    // Actions
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
    updateSettings: (settings: NotificationSettings) => Promise<void>;
    setFilters: (filters: NotificationFilters) => void;
    setDropdownOpen: (open: boolean) => void;
    // Real-time
    connect: () => void;
    disconnect: () => void;
    // Utility
    getFilteredNotifications: () => Notification[];
    getNotificationsByType: (type: string) => Notification[];
    getUnreadNotifications: () => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider Component
interface NotificationProviderProps {
    children: React.ReactNode;
    userId?: string;
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
    const [state, dispatch] = useReducer(notificationReducer, initialState);
    const [echo, setEcho] = React.useState<Echo<any> | null>(null);

    // Laravel Echo connection management
    const connect = useCallback(() => {
        if (echo || !userId) return;

        try {
            window.Pusher = Pusher;
            
            const echoInstance = new Echo({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY,
                wsHost: import.meta.env.VITE_REVERB_HOST,
                wsPort: import.meta.env.VITE_REVERB_PORT,
                wssPort: import.meta.env.VITE_REVERB_PORT,
                forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
                enabledTransports: ['ws', 'wss'],
                auth: {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                },
            });

            // Listen for notifications on user's private channel
            const channel = echoInstance.private(`notifications.${userId}`);
            
            channel.listen('NotificationCreated', (e: any) => {
                if (e.notification) {
                    dispatch({ type: 'ADD_NOTIFICATION', payload: e.notification });
                    
                    // Show toast notification using Sonner directly
                    const notification = e.notification;
                    const duration = notification.priority === 'urgent' ? 10000 : 5000;
                    
                    // Create action button if action_url is provided
                    const action = notification.action_url ? {
                        label: notification.action_text || 'View',
                        onClick: () => {
                            if (notification.action_url) {
                                window.location.href = notification.action_url;
                            }
                        }
                    } : undefined;

                    // Show toast based on priority/type
                    if (notification.priority === 'urgent' || notification.type === 'security') {
                        toast.error(notification.title, {
                            description: notification.message,
                            duration,
                            action,
                            icon: notification.icon || '🚨',
                        });
                    } else if (notification.priority === 'high' || notification.type === 'inventory') {
                        toast.warning(notification.title, {
                            description: notification.message,
                            duration,
                            action,
                            icon: notification.icon || '⚠️',
                        });
                    } else if (notification.type === 'order' || notification.type === 'payment') {
                        toast.success(notification.title, {
                            description: notification.message,
                            duration,
                            action,
                            icon: notification.icon || '✅',
                        });
                    } else {
                        toast.info(notification.title, {
                            description: notification.message,
                            duration,
                            action,
                            icon: notification.icon || '🔔',
                        });
                    }
                }
            })
            .listen('NotificationUpdated', (e: any) => {
                dispatch({ type: 'UPDATE_NOTIFICATION', payload: e.notification });
            })
            .listen('NotificationDeleted', (e: any) => {
                dispatch({ type: 'REMOVE_NOTIFICATION', payload: e.notification.id });
            });

            // Add connection event listeners
            if ('pusher' in echoInstance.connector) {
                echoInstance.connector.pusher.connection.bind('connected', () => {
                    dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
                });

                echoInstance.connector.pusher.connection.bind('disconnected', () => {
                    dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
                });

                echoInstance.connector.pusher.connection.bind('error', (error: any) => {
                    dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
                });
            }

            dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
            setEcho(echoInstance);
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to connect' });
        }
    }, [echo, userId]);

    const disconnect = useCallback(() => {
        if (echo) {
            echo.disconnect();
            setEcho(null);
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
        }
    }, [echo]);


    // API calls
    const fetchNotifications = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) throw new Error('Failed to fetch notifications');
            
            const notifications: Notification[] = await response.json();
            dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const markAsRead = useCallback(async (id: number) => {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            if (!response.ok) throw new Error('Failed to mark as read');
            
            dispatch({ type: 'MARK_AS_READ', payload: id });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            if (!response.ok) throw new Error('Failed to mark all as read');
            
            dispatch({ type: 'MARK_ALL_AS_READ' });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
        }
    }, []);

    const deleteNotification = useCallback(async (id: number) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            
            // If notification was already deleted (404), just remove it from local state
            if (response.status === 404) {
                dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
                return;
            }
            
            if (!response.ok) throw new Error('Failed to delete notification');
            
            dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
        } catch (error) {
            // Even if there's an error, try to remove from local state to keep UI consistent
            dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
        }
    }, []);

    const updateSettings = useCallback(async (settings: NotificationSettings) => {
        try {
            const response = await fetch('/api/notifications/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(settings),
            });
            if (!response.ok) throw new Error('Failed to update settings');
            
            dispatch({ type: 'SET_SETTINGS', payload: settings });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
        }
    }, []);

    const setFilters = useCallback((filters: NotificationFilters) => {
        dispatch({ type: 'SET_FILTERS', payload: filters });
    }, []);

    const setDropdownOpen = useCallback((open: boolean) => {
        dispatch({ type: 'SET_DROPDOWN_OPEN', payload: open });
    }, []);

    // Utility functions
    const getFilteredNotifications = useCallback(() => {
        let filtered = state.notifications;

        if (state.filters.types?.length) {
            filtered = filtered.filter(n => state.filters.types!.includes(n.type as any));
        }

        if (state.filters.priority?.length) {
            filtered = filtered.filter(n => state.filters.priority!.includes(n.priority));
        }

        if (state.filters.status?.length) {
            filtered = filtered.filter(n => state.filters.status!.includes(n.status));
        }

        if (state.filters.dateRange) {
            filtered = filtered.filter(n => {
                const date = new Date(n.created_at);
                return date >= state.filters.dateRange!.from && date <= state.filters.dateRange!.to;
            });
        }

        return filtered;
    }, [state.notifications, state.filters]);

    const getNotificationsByType = useCallback((type: string) => {
        return state.notifications.filter(n => n.type === type);
    }, [state.notifications]);

    const getUnreadNotifications = useCallback(() => {
        return state.notifications.filter(n => n.status === 'unread');
    }, [state.notifications]);

    // Initialize connection and fetch notifications
    useEffect(() => {
        if (userId && state.settings.inApp) {
            fetchNotifications();
            connect();
        }

        return () => {
            disconnect();
        };
    }, [userId, state.settings.inApp, fetchNotifications, connect, disconnect]);

    const contextValue: NotificationContextType = {
        state,
        dispatch,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updateSettings,
        setFilters,
        setDropdownOpen,
        connect,
        disconnect,
        getFilteredNotifications,
        getNotificationsByType,
        getUnreadNotifications,
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
}

// Hook
export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}