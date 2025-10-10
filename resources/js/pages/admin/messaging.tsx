import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    MessageSquare, 
    Search, 
    Filter, 
    Clock, 
    User, 
    AlertCircle, 
    CheckCircle, 
    XCircle,
    MoreHorizontal,
    Plus
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
    id: number;
    subject: string | null;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    last_message_at: string | null;
    assigned_to: number | null;
    participants: Array<{
        id: number;
        name: string;
        email: string;
        role: string;
        pivot: {
            role: string;
            last_read_at: string | null;
        };
    }>;
    latest_message: {
        id: number;
        content: string;
        created_at: string;
        user: {
            id: number;
            name: string;
        };
    } | null;
    assigned_admin: {
        id: number;
        name: string;
    } | null;
}

interface AdminMessagingProps {
    conversations?: {
        data: Conversation[];
        links: any[];
        meta: any;
    };
    admins?: Array<{
        id: number;
        name: string;
        email: string;
    }>;
}

export default function AdminMessaging({ conversations, admins }: AdminMessagingProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    
    // Add default values to prevent undefined errors
    const conversationsData = conversations?.data || [];
    const conversationsMeta = conversations?.meta || { total: 0 };
    const adminsData = admins || [];
    const [filteredConversations, setFilteredConversations] = useState(conversationsData);

    // Filter conversations based on search and filters
    useEffect(() => {
        let filtered = conversationsData;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(conv => 
                conv.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conv.participants.some(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.email.toLowerCase().includes(searchTerm.toLowerCase())
                ) ||
                conv.latest_message?.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(conv => conv.status === statusFilter);
        }

        // Priority filter
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(conv => conv.priority === priorityFilter);
        }

        setFilteredConversations(filtered);
    }, [searchTerm, statusFilter, priorityFilter, conversationsData]);

    const handleNewConversation = () => {
        setShowNewConversationModal(true);
    };

    const handleAssignToAdmin = async (conversationId: number, adminId: number) => {
        try {
            const response = await fetch(`/api/admin/messaging/${conversationId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ admin_id: adminId }),
            });

            if (response.ok) {
                window.location.reload();
            } else {
                console.error('Failed to assign conversation');
            }
        } catch (error) {
            console.error('Error assigning conversation:', error);
        }
    };

    const handleChangePriority = async (conversationId: number, priority: string) => {
        try {
            const response = await fetch(`/api/admin/messaging/${conversationId}/priority`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ priority }),
            });

            if (response.ok) {
                window.location.reload();
            } else {
                console.error('Failed to update priority');
            }
        } catch (error) {
            console.error('Error updating priority:', error);
        }
    };

    const handleChangeStatus = async (conversationId: number, status: string) => {
        try {
            const response = await fetch(`/api/admin/messaging/${conversationId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                window.location.reload();
            } else {
                console.error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open':
                return <Clock className="h-4 w-4 text-blue-500" />;
            case 'in_progress':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            case 'resolved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'closed':
                return <XCircle className="h-4 w-4 text-gray-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'resolved':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'closed':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <AdminLayout>
            <Head title="Admin Messaging" />
            
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Customer Support
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage customer conversations and provide 24/7 support
                        </p>
                    </div>
                    <Button className="flex items-center space-x-2" onClick={handleNewConversation}>
                        <Plus className="h-4 w-4" />
                        <span>New Conversation</span>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <MessageSquare className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {conversationsMeta.total}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {conversationsData.filter(c => c.status === 'open').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {conversationsData.filter(c => c.status === 'in_progress').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Urgent</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {conversationsData.filter(c => c.priority === 'urgent').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search conversations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="w-full sm:w-48">
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
                    </CardContent>
                </Card>

                {/* Conversations List */}
                <div className="space-y-4">
                    {filteredConversations.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No conversations found
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                                        ? 'Try adjusting your filters to see more conversations.'
                                        : 'No customer conversations yet. They will appear here when customers contact support.'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredConversations.map((conversation) => {
                            const customer = conversation.participants.find(p => p.pivot.role === 'customer');
                            
                            return (
                                <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusIcon(conversation.status)}
                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                                                            {conversation.subject || `Conversation #${conversation.id}`}
                                                        </h3>
                                                    </div>
                                                    
                                                    <Badge className={getPriorityColor(conversation.priority)}>
                                                        {conversation.priority}
                                                    </Badge>
                                                    
                                                    <Badge className={getStatusColor(conversation.status)}>
                                                        {conversation.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center space-x-1">
                                                        <User className="h-4 w-4" />
                                                        <span>{customer?.name || 'Unknown Customer'}</span>
                                                    </div>
                                                    
                                                    {conversation.assigned_admin && (
                                                        <div className="flex items-center space-x-1">
                                                            <span>Assigned to:</span>
                                                            <span className="font-medium">{conversation.assigned_admin?.name || 'Unknown Admin'}</span>
                                                        </div>
                                                    )}
                                                    
                                                    {conversation.last_message_at && (
                                                        <div className="flex items-center space-x-1">
                                                            <Clock className="h-4 w-4" />
                                                            <span>
                                                                {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {conversation.latest_message && (
                                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 truncate">
                                                        <span className="font-medium">{conversation.latest_message.user?.name || 'Unknown User'}:</span>{' '}
                                                        {conversation.latest_message.content}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center space-x-2 ml-4">
                                                <Link
                                                    href={`/admin/messaging/${conversation.id}`}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                >
                                                    View
                                                </Link>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleAssignToAdmin(conversation.id, adminsData[0]?.id || 1)}>
                                                            Assign to Admin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleChangePriority(conversation.id, 'high')}>
                                                            Change Priority
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleChangeStatus(conversation.id, 'in_progress')}>
                                                            Change Status
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleChangeStatus(conversation.id, 'closed')}>
                                                            Close Conversation
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            {/* New Conversation Modal */}
            {showNewConversationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Create New Conversation</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            New conversations are typically created when customers contact support. 
                            You can view existing conversations or wait for new customer inquiries.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setShowNewConversationModal(false)}>
                                Close
                            </Button>
                            <Button onClick={() => {
                                // For now, just redirect to the first conversation or show a message
                                if (filteredConversations.length > 0) {
                                    window.location.href = `/admin/messaging/${filteredConversations[0].id}`;
                                } else {
                                    alert('No conversations available. New conversations will appear when customers contact support.');
                                    setShowNewConversationModal(false);
                                }
                            }}>
                                View Conversations
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
