import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Send, Trash2, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { Notification } from '@/types/notification';
import CreateNotificationModal from '@/components/admin/CreateNotificationModal';
import NotificationModal from '@/components/notifications/NotificationModal';

interface AdminNotificationsProps {
    notifications: Notification[];
    users: Array<{ id: number; name: string; email: string; role: string }>;
}

export default function AdminNotifications({ notifications: initialNotifications, users }: AdminNotificationsProps) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [selected, setSelected] = useState<any | null>(null);

    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
        const title = (notification as any).data?.title || '';
        const message = (notification as any).data?.message || '';
        const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'unread' ? !notification.read_at : !!notification.read_at);
        const matchesType = typeFilter === 'all' || notification.type === typeFilter;
        const matchesPriority = priorityFilter === 'all' || (notification as any).data?.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });

    const handleSelectNotification = (id: string) => {
        setSelectedNotifications(prev => 
            prev.includes(id) 
                ? prev.filter(nId => nId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedNotifications.length === filteredNotifications.length) {
            setSelectedNotifications([]);
        } else {
            setSelectedNotifications(filteredNotifications.map(n => n.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedNotifications.length === 0) return;
        
        try {
            const response = await fetch('/api/admin/notifications/bulk-delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ ids: selectedNotifications }),
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
                setSelectedNotifications([]);
            }
        } catch (error) {
            console.error('Failed to delete notifications:', error);
        }
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleNotificationCreated = () => {
        // Refresh notifications list
        window.location.reload();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'unread': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'read': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            case 'archived': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notification Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage and dispatch notifications to users</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Create Notification</span>
                    </Button>
                </div>

                {/* Filters and Search */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search notifications..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="unread">Unread</SelectItem>
                                        <SelectItem value="read">Read</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="order">Order</SelectItem>
                                        <SelectItem value="product">Product</SelectItem>
                                        <SelectItem value="promotion">Promotion</SelectItem>
                                        <SelectItem value="security">Security</SelectItem>
                                        <SelectItem value="inventory">Inventory</SelectItem>
                                        <SelectItem value="system">System</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priority</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selectedNotifications.length > 0 && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedNotifications.length} notification(s) selected
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Selected
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Notifications List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
                            <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                {selectedNotifications.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredNotifications.map((notification) => (
                                <div key={notification.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => { setSelected(notification); setViewOpen(true); }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedNotifications.includes(notification.id)}
                                        onChange={() => handleSelectNotification(notification.id)}
                                        className="rounded"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {(notification as any).data?.title || 'Notification'}
                                            </h3>
                                            <Badge className={getPriorityColor((notification as any).data?.priority || 'low')}>
                                                {(notification as any).data?.priority || 'low'}
                                            </Badge>
                                            <Badge className={getStatusColor(notification.read_at ? 'read' : 'unread')}>
                                                {notification.read_at ? 'read' : 'unread'}
                                            </Badge>
                                            <Badge variant="outline">
                                                {notification.type}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {(notification as any).data?.message}
                                        </p>
                                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>Created: {new Date(notification.created_at).toLocaleDateString()}</span>
                                            {notification.read_at && (
                                                <span>Read: {new Date(notification.read_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenu onOpenChange={(open) => { /* prevent card click firing */ }}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => { setSelected(notification); setViewOpen(true); }}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Send className="h-4 w-4 mr-2" />
                                                Resend
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-red-600 dark:text-red-400"
                                                onClick={() => handleDeleteNotification(notification.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                            {filteredNotifications.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">No notifications found</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Create Notification Modal */}
            <CreateNotificationModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                users={users}
                onSuccess={handleNotificationCreated}
            />
            <NotificationModal isOpen={viewOpen} onClose={() => setViewOpen(false)} notification={selected} />
        </AdminLayout>
    );
}
