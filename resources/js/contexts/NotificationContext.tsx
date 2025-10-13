import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Simple Laravel Notification Interface
interface LaravelNotification {
    id: string;
    type: string;
    data: any;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

// Notification State
interface NotificationState {
    notifications: LaravelNotification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    lastUpdate: Date | null;
}

// Action Types
type NotificationAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_NOTIFICATIONS'; payload: LaravelNotification[] }
    | { type: 'ADD_NOTIFICATION'; payload: LaravelNotification }
    | { type: 'MARK_AS_READ'; payload: string }
    | { type: 'MARK_ALL_AS_READ' };

// Initial State
const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    lastUpdate: null,
};

// Reducer
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        
        case 'SET_NOTIFICATIONS':
            const notifications = Array.isArray(action.payload) ? action.payload : [];
            const unreadCount = notifications.filter(n => !n.read_at).length;
            return {
                ...state,
                notifications: notifications,
                unreadCount,
                lastUpdate: new Date(),
            };
        
        case 'ADD_NOTIFICATION':
            const newNotifications = [action.payload, ...state.notifications];
            const newUnreadCount = newNotifications.filter(n => !n.read_at).length;
            return {
                ...state,
                notifications: newNotifications,
                unreadCount: newUnreadCount,
                lastUpdate: new Date(),
            };
        
        case 'MARK_AS_READ':
            const updatedNotifications = state.notifications.map(n =>
                n.id === action.payload ? { ...n, read_at: new Date().toISOString() } : n
            );
            const updatedUnreadCount = updatedNotifications.filter(n => !n.read_at).length;
            return {
                ...state,
                notifications: updatedNotifications,
                unreadCount: updatedUnreadCount,
            };
        
        case 'MARK_ALL_AS_READ':
            const allReadNotifications = state.notifications.map(n => ({
                ...n,
                read_at: new Date().toISOString()
            }));
            return {
                ...state,
                notifications: allReadNotifications,
                unreadCount: 0,
            };
        
        default:
            return state;
    }
};

// Context
interface NotificationContextType {
    state: NotificationState;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: LaravelNotification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider Props
interface NotificationProviderProps {
    children: React.ReactNode;
    userId?: string;
}

// Provider Component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, userId }) => {
    const [state, dispatch] = useReducer(notificationReducer, initialState);

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        try {
            const response = await fetch('/api/notifications', {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            
            if (!response.ok) throw new Error('Failed to fetch notifications');
            
            const notifications: LaravelNotification[] = await response.json();
            dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [userId]);

    // Mark notification as read
    const markAsRead = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                dispatch({ type: 'MARK_AS_READ', payload: id });
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                dispatch({ type: 'MARK_ALL_AS_READ' });
                toast.success('All notifications marked as read');
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, []);

    // Add notification (for real-time updates)
    const addNotification = useCallback((notification: LaravelNotification) => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
        
        // Show toast notification for all users
        const message = getNotificationMessage(notification);
        toast.success(message, {
            duration: 5000,
        });
    }, []);

    // Get notification message for display
    const getNotificationMessage = (notification: LaravelNotification): string => {
        const { data } = notification;
        
        switch (notification.type) {
            case 'App\\Notifications\\NewOrderAdminNotification':
                return `New order ${data.order_number} from ${data.customer_name} - $${data.total_amount}`;
            case 'App\\Notifications\\OrderConfirmationNotification':
                return `Order ${data.order_number} confirmed - $${data.total_amount}`;
            case 'App\\Notifications\\OrderStatusUpdateNotification':
                return `Order ${data.order_number} status updated`;
            case 'App\\Notifications\\OrderShippedNotification':
                return `Order ${data.order_number} has been shipped`;
            default:
                return 'New notification';
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        fetchNotifications();
        
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const value: NotificationContextType = {
        state,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Hook to use notification context
export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default NotificationContext;