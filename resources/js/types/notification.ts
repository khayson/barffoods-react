// Notification Types and Interfaces

export type NotificationType = 
    | 'order'
    | 'product'
    | 'system'
    | 'promotion'
    | 'security'
    | 'inventory'
    | 'customer'
    | 'payment'
    | 'delivery'
    | 'review';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification {
    id: number;
    type: string;
    priority: NotificationPriority;
    status: NotificationStatus;
    title: string;
    message: string;
    data?: Record<string, any>;
    user_id: number;
    created_at: string;
    updated_at: string;
    read_at?: string;
    expires_at?: string;
    action_url?: string;
    action_text?: string;
    icon?: string;
    color?: string;
}

export interface NotificationGroup {
    type: NotificationType;
    count: number;
    latest: Notification;
    notifications: Notification[];
}

export interface NotificationSettings {
    email: boolean;
    push: boolean;
    inApp: boolean;
    types: {
        [key in NotificationType]: boolean;
    };
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface NotificationFilters {
    types?: NotificationType[];
    priority?: NotificationPriority[];
    status?: NotificationStatus[];
    dateRange?: {
        from: Date;
        to: Date;
    };
}

// Real-time notification events
export interface NotificationEvent {
    type: 'notification.created' | 'notification.updated' | 'notification.deleted' | 'notification.read';
    notification: Notification;
    userId?: string;
}

// Notification templates for different types
export interface NotificationTemplate {
    type: NotificationType;
    title: string;
    message: string;
    icon: string;
    color: string;
    priority: NotificationPriority;
    actionText?: string;
}

// WebSocket message types
export interface WebSocketMessage {
    type: 'notification' | 'ping' | 'pong' | 'error';
    data?: any;
    timestamp: number;
}
