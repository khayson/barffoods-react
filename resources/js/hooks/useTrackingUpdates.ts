import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TrackingEvent {
    id: number;
    status: string;
    message: string;
    location: string | null;
    carrier: string | null;
    occurred_at: string;
}

interface TrackingUpdateData {
    order_id: number;
    order_number: string;
    tracking_event: TrackingEvent;
    delivery_status: string | null;
    estimated_delivery_date: string | null;
    last_tracking_update: string | null;
}

export function useTrackingUpdates(userId?: number) {
    const [trackingUpdates, setTrackingUpdates] = useState<TrackingUpdateData[]>([]);

    useEffect(() => {
        if (!userId) return;

        let channel: any = null;

        try {
            // Real-time subscription using Echo if available
            if ((window as any).Echo && userId) {
                channel = (window as any).Echo.private(`user.${userId}`)
                    .listen('tracking.updated', (data: TrackingUpdateData) => {
                        console.log('Tracking update received:', data);
                        
                        // Add to tracking updates state
                        setTrackingUpdates(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 updates
                        
                        // Show toast notification
                        const status = data.tracking_event.status.replace('_', ' ').toUpperCase();
                        toast.success(`Order #${data.order_number} Updated`, {
                            description: `${status}: ${data.tracking_event.message}`,
                            duration: 5000,
                            action: {
                                label: 'View Order',
                                onClick: () => window.location.href = `/orders/${data.order_id}`
                            }
                        });
                    })
                    .error((error: any) => {
                        console.warn('Echo channel error for user tracking updates:', error);
                        // Don't show error toasts for authentication issues
                        if (error.status !== 403) {
                            toast.error('Connection error', {
                                description: 'Unable to receive real-time updates'
                            });
                        }
                    });
            }
        } catch (err) {
            console.warn('Echo subscription failed for tracking updates', err);
        }

        return () => {
            try {
                if (channel && (window as any).Echo && userId) {
                    (window as any).Echo.leave(`private-user.${userId}`);
                }
            } catch (err) {
                console.warn('Failed to leave Echo channel', err);
            }
        };
    }, [userId]);

    return { trackingUpdates };
}

export function useAdminTrackingUpdates() {
    const [adminTrackingUpdates, setAdminTrackingUpdates] = useState<TrackingUpdateData[]>([]);

    useEffect(() => {
        let channel: any = null;

        try {
            // Real-time subscription using Echo if available
            if ((window as any).Echo) {
                channel = (window as any).Echo.private('admin.orders')
                    .listen('tracking.updated', (data: TrackingUpdateData) => {
                        console.log('Admin tracking update received:', data);
                        
                        // Add to admin tracking updates state
                        setAdminTrackingUpdates(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 updates
                        
                        // Show toast notification for admins
                        const status = data.tracking_event.status.replace('_', ' ').toUpperCase();
                        toast.info(`Order #${data.order_number} Tracking Update`, {
                            description: `${status}: ${data.tracking_event.message}`,
                            duration: 5000,
                            action: {
                                label: 'View Order',
                                onClick: () => window.location.href = `/admin/orders/${data.order_id}`
                            }
                        });
                    })
                    .error((error: any) => {
                        console.warn('Echo channel error for admin tracking updates:', error);
                        // Don't show error toasts for authentication issues
                        if (error.status !== 403) {
                            toast.error('Connection error', {
                                description: 'Unable to receive real-time updates'
                            });
                        }
                    });
            }
        } catch (err) {
            console.warn('Echo subscription failed for admin tracking updates', err);
        }

        return () => {
            try {
                if (channel && (window as any).Echo) {
                    (window as any).Echo.leave('private-admin.orders');
                }
            } catch (err) {
                console.warn('Failed to leave Echo channel', err);
            }
        };
    }, []);

    return { adminTrackingUpdates };
}
