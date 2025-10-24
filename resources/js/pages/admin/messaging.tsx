import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Clock, 
    User, 
    AlertCircle, 
    CheckCircle, 
    XCircle,
    MoreHorizontal,
    Plus,
    TrendingUp,
    Calendar,
    Link
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import ConversationPanel from '@/components/admin/ConversationPanel';

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
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isLoadingConversation, setIsLoadingConversation] = useState(false);
    
    const conversationsData = conversations?.data || [];
    const conversationsMeta = conversations?.meta || { total: 0 };
    const adminsData = admins || [];
    const [filteredConversations, setFilteredConversations] = useState(conversationsData);

    // Auto-open conversation from URL parameter (e.g., from notifications)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const conversationId = urlParams.get('open');
        
        if (conversationId) {
            openConversation(parseInt(conversationId));
            // Clean up URL without reloading
            window.history.replaceState({}, '', '/admin/messaging');
        }
    }, []);

    // Filter conversations
    useEffect(() => {
        let filtered = conversationsData;

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

        if (priorityFilter !== 'all') {
            filtered = filtered.filter(conv => conv.priority === priorityFilter);
        }

        setFilteredConversations(filtered);
    }, [searchTerm, priorityFilter, conversationsData]);

    // Group conversations by status
    const groupedConversations = {
        open: filteredConversations.filter(c => c.status === 'open'),
        in_progress: filteredConversations.filter(c => c.status === 'in_progress'),
        resolved: filteredConversations.filter(c => c.status === 'resolved'),
        closed: filteredConversations.filter(c => c.status === 'closed'),
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
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const openConversation = async (conversationId: number) => {
        // Open panel immediately with loading state
        setIsPanelOpen(true);
        setIsLoadingConversation(true);
        
        try {
            const response = await fetch(`/api/admin/messaging/${conversationId}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedConversation(data.conversation);
            }
        } catch (error) {
            console.error('Error fetching conversation:', error);
            setIsPanelOpen(false);
        } finally {
            setIsLoadingConversation(false);
        }
    };

    const closeConversation = () => {
        setIsPanelOpen(false);
        setTimeout(() => setSelectedConversation(null), 300);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
        }
    };

    // Kanban columns configuration
    const columns = [
        { 
            id: 'open', 
            title: 'Open', 
            count: groupedConversations.open.length,
            icon: Clock,
        },
        { 
            id: 'in_progress', 
            title: 'In Progress', 
            count: groupedConversations.in_progress.length,
            icon: TrendingUp,
        },
        { 
            id: 'resolved', 
            title: 'Resolved', 
            count: groupedConversations.resolved.length,
            icon: CheckCircle,
        },
        { 
            id: 'closed', 
            title: 'Closed', 
            count: groupedConversations.closed.length,
            icon: XCircle,
        },
    ];

    const renderTicketCard = (conversation: Conversation, index: number) => {
        const customer = conversation.participants.find(p => p.pivot.role === 'customer');
        
        // Priority badge styling with icons
        const getPriorityBadge = (priority: string) => {
            switch (priority) {
                case 'urgent':
                    return { icon: '🔥', label: 'Urgent', class: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900' };
                case 'high':
                    return { icon: '⚡', label: 'High', class: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900' };
                case 'medium':
                    return { icon: '➡️', label: 'Medium', class: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900' };
                case 'low':
                    return { icon: '✅', label: 'Low', class: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900' };
                default:
                    return { icon: '📌', label: priority, class: 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' };
            }
        };

        const priorityBadge = getPriorityBadge(conversation.priority);
        
        return (
            <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.02, duration: 0.15 }}
            >
                <div 
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 group cursor-pointer"
                    onClick={() => openConversation(conversation.id)}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                                {conversation.subject || `Conversation #${conversation.id}`}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge.class}`}>
                                    <span>{priorityBadge.icon}</span>
                                    <span>{priorityBadge.label}</span>
                                </span>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Assign to</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {adminsData.map((admin) => (
                                            <DropdownMenuItem 
                                                key={admin.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAssignToAdmin(conversation.id, admin.id);
                                                }}
                                            >
                                                {admin.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Change Priority</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangePriority(conversation.id, 'urgent');
                                        }}>
                                            🔥 Urgent
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangePriority(conversation.id, 'high');
                                        }}>
                                            ⚡ High
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangePriority(conversation.id, 'medium');
                                        }}>
                                            ➡️ Medium
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangePriority(conversation.id, 'low');
                                        }}>
                                            ✅ Low
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeStatus(conversation.id, 'open');
                                        }}>
                                            Open
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeStatus(conversation.id, 'in_progress');
                                        }}>
                                            In Progress
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeStatus(conversation.id, 'resolved');
                                        }}>
                                            Resolved
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeStatus(conversation.id, 'closed');
                                        }}>
                                            Closed
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Message Preview */}
                    {conversation.latest_message && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                {conversation.latest_message.content}
                            </p>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold">
                                {customer?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {customer?.name || 'Unknown'}
                                </span>
                                {conversation.last_message_at && (
                                    <span className="text-xs text-gray-500 dark:text-gray-500">
                                        {format(new Date(conversation.last_message_at), 'MMM dd, h:mm a')}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {conversation.assigned_admin && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <User className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {conversation.assigned_admin.name.split(' ')[0]}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <AdminLayout>
            <Head title="Customer Support - BarfFoods Admin" />
            
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Customer Support</h1>
                    {/* <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-1" />
                        New
                    </Button> */}
                </div>

                {/* Filters */}
                <div className="flex gap-2 pb-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-9 text-sm"
                        />
                    </div>
                    
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-32 h-9 text-sm">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
                    {columns.map((column) => {
                        const Icon = column.icon;
                        const conversations = groupedConversations[column.id as keyof typeof groupedConversations];
                        
                        return (
                            <div key={column.id} className="flex flex-col">
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{column.title}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">({column.count})</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>

                                {/* Column Content */}
                                <div className="p-3 space-y-3 bg-gray-50/50 dark:bg-gray-900/50 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg min-h-[400px] max-h-[600px] overflow-y-auto">
                                    <AnimatePresence>
                                        {conversations.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600">
                                                <Icon className="h-8 w-8 mb-2" />
                                                <p className="text-xs">No items</p>
                                            </div>
                                        ) : (
                                            conversations.map((conversation, index) => renderTicketCard(conversation, index))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Off-Canvas Conversation Panel */}
            <ConversationPanel 
                conversation={selectedConversation}
                isOpen={isPanelOpen}
                isLoading={isLoadingConversation}
                onClose={closeConversation}
                adminsData={adminsData}
            />
        </AdminLayout>
    );
}
