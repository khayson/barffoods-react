import axios from 'axios';

export interface Notification {
    id: number;
    type: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'unread' | 'read' | 'archived';
    title: string;
    message: string;
    data?: Record<string, any>;
    user_id: number;
    read_at?: string;
    expires_at?: string;
    action_url?: string;
    action_text?: string;
    icon?: string;
    color?: string;
    created_at: string;
    updated_at: string;
}

export interface NotificationFilters {
    type?: string;
    priority?: string;
    status?: string;
}

export interface NotificationSettings {
    email: boolean;
    push: boolean;
    inApp: boolean;
    types: string[];
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

class NotificationService {
    private baseUrl = '/api/notifications';

    async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
        const params = new URLSearchParams();
        
        if (filters?.type) params.append('type', filters.type);
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.status) params.append('status', filters.status);

        const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
        return response.data;
    }

    async getNotification(id: number): Promise<Notification> {
        const response = await axios.get(`${this.baseUrl}/${id}`);
        return response.data;
    }

    async markAsRead(id: number): Promise<void> {
        await axios.patch(`${this.baseUrl}/${id}/read`);
    }

    async markAllAsRead(): Promise<void> {
        await axios.patch(`${this.baseUrl}/read-all`);
    }

    async deleteNotification(id: number): Promise<void> {
        await axios.delete(`${this.baseUrl}/${id}`);
    }

    async getUnreadCount(): Promise<number> {
        const response = await axios.get(`${this.baseUrl}/unread/count`);
        return response.data.count;
    }

    async updateSettings(settings: NotificationSettings): Promise<void> {
        await axios.put(`${this.baseUrl}/settings`, settings);
    }

    // Test methods (remove in production)
    async createTestOrderNotification(): Promise<Notification> {
        const response = await axios.post('/test/notifications/order');
        return response.data.notification;
    }

    async createTestProductNotification(): Promise<Notification> {
        const response = await axios.post('/test/notifications/product');
        return response.data.notification;
    }

    async createTestPromotionNotification(): Promise<Notification> {
        const response = await axios.post('/test/notifications/promotion');
        return response.data.notification;
    }

    async createTestSecurityNotification(): Promise<Notification> {
        const response = await axios.post('/test/notifications/security');
        return response.data.notification;
    }

    async createTestInventoryNotification(): Promise<Notification> {
        const response = await axios.post('/test/notifications/inventory');
        return response.data.notification;
    }

    async createTestSystemNotification(): Promise<Notification> {
        const response = await axios.post('/test/notifications/system');
        return response.data.notification;
    }
}

export default new NotificationService();