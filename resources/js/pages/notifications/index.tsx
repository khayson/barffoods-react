import React from 'react';
import { Head, Link } from '@inertiajs/react';
import CustomerLayout from '@/layouts/customer-layout';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell } from 'lucide-react';
import NotificationModal from '@/components/notifications/NotificationModal';

function NotificationsContent() {
    const { state, markAsRead, markAllAsRead } = useNotifications();
    const formatTime = (dateString: string) => new Date(dateString).toLocaleString();
    const getMessage = (n: any) => n?.data?.message || n?.data?.title || 'Notification';
    const getUrl = (n: any) => n?.data?.action_url || null;

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
                {state.unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-sm text-green-600 dark:text-green-400 hover:underline">
                        Mark all as read
                    </button>
                )}
            </div>
            <div className="mt-6 space-y-3">
                {state.notifications.map((n) => (
                    <div key={n.id} data-notification data-payload={JSON.stringify(n)} className={`rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 ${!n.read_at ? 'ring-1 ring-blue-200 dark:ring-blue-900/30' : ''} cursor-pointer`}>
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <Bell className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{getMessage(n)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">{formatTime(n.created_at)}</div>
                                </div>
                                {getUrl(n) && (
                                    <div className="mt-2">
                                        <Link href={getUrl(n)!} className="text-sm text-green-600 dark:text-green-400 hover:underline">View details</Link>
                                    </div>
                                )}
                            </div>
                            {!n.read_at && (
                                <button onClick={() => markAsRead(n.id)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Mark read</button>
                            )}
                        </div>
                    </div>
                ))}
                {state.notifications.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">No notifications yet</div>
                )}
            </div>
        </div>
    );
}

export default function CustomerNotificationsPage() {
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<any | null>(null);

    return (
        <CustomerLayout>
            <Head title="Notifications" />
            <div onClickCapture={(e) => {
                const target = e.target as HTMLElement;
                const card = target.closest('[data-notification]') as HTMLElement | null;
                if (card) {
                    try {
                        const payload = JSON.parse(card.dataset.payload || 'null');
                        if (payload) { setSelected(payload); setOpen(true); }
                    } catch {}
                }
            }}>
                <NotificationsContent />
            </div>
            <NotificationModal isOpen={open} onClose={() => setOpen(false)} notification={selected} />
        </CustomerLayout>
    );
}


