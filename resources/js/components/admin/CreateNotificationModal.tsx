import React, { useState } from 'react';
import { X, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface CreateNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    onSuccess: () => void;
}

export default function CreateNotificationModal({ isOpen, onClose, users, onSuccess }: CreateNotificationModalProps) {
    const [formData, setFormData] = useState({
        user_ids: [] as number[],
        type: 'system',
        priority: 'medium',
        title: '',
        message: '',
        action_url: '',
        action_text: '',
        icon: '',
        color: '',
        expires_at: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [selectAll, setSelectAll] = useState(false);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleUserSelect = (userId: number, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            user_ids: checked 
                ? [...prev.user_ids, userId]
                : prev.user_ids.filter(id => id !== userId)
        }));
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked);
        setFormData(prev => ({
            ...prev,
            user_ids: checked ? users.map(u => u.id) : []
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (formData.user_ids.length === 0) {
            alert('Please select at least one recipient');
            return;
        }
        
        if (!formData.title.trim()) {
            alert('Please enter a title');
            return;
        }
        
        if (!formData.message.trim()) {
            alert('Please enter a message');
            return;
        }
        
        setIsLoading(true);

        try {
            // Clean up form data - remove empty strings for optional fields
            const cleanedData = {
                ...formData,
                action_url: formData.action_url.trim() || null,
                action_text: formData.action_text.trim() || null,
                icon: formData.icon.trim() || null,
                color: formData.color.trim() || null,
                expires_at: formData.expires_at.trim() || null,
            };
            
            console.log('Sending notification data:', cleanedData);
            
            const response = await fetch('/api/admin/notifications/dispatch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(cleanedData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Notification created successfully:', result);
                onSuccess();
                onClose();
                // Reset form
                setFormData({
                    user_ids: [],
                    type: 'system',
                    priority: 'medium',
                    title: '',
                    message: '',
                    action_url: '',
                    action_text: '',
                    icon: '',
                    color: '',
                    expires_at: '',
                });
                setSelectAll(false);
            } else {
                const errorData = await response.json();
                console.error('Failed to create notification:', response.status, errorData);
                alert(`Failed to create notification: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating notification:', error);
            alert(`Error creating notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const notificationTypes = [
        { value: 'order', label: 'Order' },
        { value: 'product', label: 'Product' },
        { value: 'promotion', label: 'Promotion' },
        { value: 'security', label: 'Security' },
        { value: 'inventory', label: 'Inventory' },
        { value: 'system', label: 'System' },
    ];

    const priorities = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
    ];

    const icons = [
        { value: '🔔', label: 'Bell' },
        { value: '📦', label: 'Package' },
        { value: '💰', label: 'Money' },
        { value: '⚠️', label: 'Warning' },
        { value: '✅', label: 'Check' },
        { value: '❌', label: 'Error' },
        { value: 'ℹ️', label: 'Info' },
    ];

    const colors = [
        { value: 'blue', label: 'Blue' },
        { value: 'green', label: 'Green' },
        { value: 'yellow', label: 'Yellow' },
        { value: 'red', label: 'Red' },
        { value: 'purple', label: 'Purple' },
        { value: 'gray', label: 'Gray' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" aria-describedby="create-notification-description">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center space-x-2">
                        <Send className="h-5 w-5" />
                        <span>Create Notification</span>
                    </DialogTitle>
                    <p id="create-notification-description" className="text-sm text-gray-600 dark:text-gray-400">
                        Create and send notifications to selected users with custom priority, expiration, and action settings.
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                    {/* Recipients */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Recipients</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="select-all"
                                    checked={selectAll}
                                    onCheckedChange={handleSelectAll}
                                />
                                <Label htmlFor="select-all" className="text-sm">Select All</Label>
                            </div>
                        </div>
                        <ScrollArea className="h-32 border rounded-md p-3">
                            <div className="space-y-2">
                                {users.map((user) => (
                                    <div key={user.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`user-${user.id}`}
                                            checked={formData.user_ids.includes(user.id)}
                                            onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                                        />
                                        <Label htmlFor={`user-${user.id}`} className="text-sm">
                                            {user.name} ({user.email}) - {user.role}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <p className="text-xs text-gray-500">
                            {formData.user_ids.length} user(s) selected
                        </p>
                    </div>

                    {/* Type and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {notificationTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorities.map((priority) => (
                                        <SelectItem key={priority.value} value={priority.value}>
                                            {priority.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Title and Message */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Notification title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => handleInputChange('message', e.target.value)}
                            placeholder="Notification message"
                            rows={3}
                            required
                        />
                    </div>

                    {/* Action URL and Text */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="action_url">Action URL</Label>
                            <Input
                                id="action_url"
                                value={formData.action_url}
                                onChange={(e) => handleInputChange('action_url', e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="action_text">Action Text</Label>
                            <Input
                                id="action_text"
                                value={formData.action_text}
                                onChange={(e) => handleInputChange('action_text', e.target.value)}
                                placeholder="View Details"
                            />
                        </div>
                    </div>

                    {/* Icon and Color */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon</Label>
                            <Select value={formData.icon} onValueChange={(value) => handleInputChange('icon', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select icon" />
                                </SelectTrigger>
                                <SelectContent>
                                    {icons.map((icon) => (
                                        <SelectItem key={icon.value} value={icon.value}>
                                            {icon.value} {icon.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color">Color</Label>
                            <Select value={formData.color} onValueChange={(value) => handleInputChange('color', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                                <SelectContent>
                                    {colors.map((color) => (
                                        <SelectItem key={color.value} value={color.value}>
                                            {color.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Expires At */}
                    <div className="space-y-2">
                        <Label htmlFor="expires_at">Expires At (Optional)</Label>
                        <Input
                            id="expires_at"
                            type="datetime-local"
                            value={formData.expires_at}
                            onChange={(e) => handleInputChange('expires_at', e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Leave empty for no expiration. Past dates will be ignored.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t flex-shrink-0">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || formData.user_ids.length === 0}>
                            {isLoading ? 'Sending...' : 'Send Notification'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
