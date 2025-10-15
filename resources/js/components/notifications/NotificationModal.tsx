import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: any | null;
    onMarkRead?: (id: string) => void;
}

export default function NotificationModal({ isOpen, onClose, notification, onMarkRead }: NotificationModalProps) {
    if (!isOpen || !notification) return null;

    const data = notification.data || {};
    const title = data.title || 'Notification';
    const message = data.message || '';
    const actionUrl = data.action_url || null;
    const actionText = data.action_text || 'Open';

    return createPortal(
        <>
            <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed z-[210] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-5 py-4 space-y-3">
                    {message && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{message}</p>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                    </div>
                </div>
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                    {!notification.read_at && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                onMarkRead && onMarkRead(notification.id);
                                onClose();
                            }}
                        >
                            Mark as read
                        </Button>
                    )}
                    {actionUrl && (
                        <a href={actionUrl} className="inline-flex items-center px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm">
                            {actionText}
                        </a>
                    )}
                </div>
            </div>
        </>,
        document.body
    );
}


