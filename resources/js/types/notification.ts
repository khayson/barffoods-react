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

export interface Notification {
    id: string; // uuid
    type: string; // class or custom string
    notifiable_type: string;
    notifiable_id: number;
    data: {
        title?: string;
        message?: string;
        priority?: NotificationPriority;
        action_url?: string;
        action_text?: string;
        icon?: string;
        color?: string;
        [key: string]: any;
    };
    read_at: string | null;
    created_at: string;
    updated_at: string;
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
