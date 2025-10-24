import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Send,
    X,
    Clock,
    User,
    AlertCircle,
    CheckCircle,
    XCircle,
    MoreHorizontal,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface Message {
    id: number;
    content: string;
    type: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        role: string;
    };
    is_read: boolean;
}

interface Participant {
    id: number;
    name: string;
    email: string;
    role: string;
    pivot: {
        role: string;
        last_read_at: string | null;
    };
}

interface Conversation {
    id: number;
    subject: string | null;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    notes: string | null;
    last_message_at: string | null;
    assigned_to: number | null;
    participants: Participant[];
    messages: Message[];
    assigned_admin: {
        id: number;
        name: string;
    } | null;
}

interface ConversationPanelProps {
    conversation: Conversation | null;
    isOpen: boolean;
    onClose: () => void;
    isLoading?: boolean;
    adminsData?: Array<{
        id: number;
        name: string;
        email: string;
    }>;
}

export default function ConversationPanel({ conversation, isOpen, onClose, isLoading: externalLoading = false, adminsData = [] }: ConversationPanelProps) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [currentConversation, setCurrentConversation] = useState(conversation);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentConversation(conversation);
    }, [conversation]);

    useEffect(() => {
        if (isOpen && currentConversation) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentConversation?.messages, isOpen]);

    // Show loading state if data is being fetched
    if (!currentConversation && externalLoading) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex items-center justify-center"
                        >
                            <div className="text-gray-500 dark:text-gray-400">
                                <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-sm">Loading conversation...</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        );
    }

    if (!currentConversation) return null;

    const customer = currentConversation.participants.find(p => p.pivot.role === 'customer');

    const sendMessage = async () => {
        if (!message.trim()) return;

        setIsSending(true);
        try {
            const response = await fetch(`/api/admin/messaging/${currentConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ content: message }),
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentConversation(prev => prev ? {
                    ...prev,
                    messages: [...prev.messages, data.message]
                } : prev);
                setMessage('');
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error sending message:', errorData);
                alert('Failed to send message: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const updateStatus = async (status: string) => {
        try {
            const response = await fetch(`/api/admin/messaging/${currentConversation.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                setCurrentConversation(prev => prev ? { ...prev, status: status as any } : prev);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const updatePriority = async (priority: string) => {
        try {
            const response = await fetch(`/api/admin/messaging/${currentConversation.id}/priority`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ priority }),
            });

            if (response.ok) {
                setCurrentConversation(prev => prev ? { ...prev, priority: priority as any } : prev);
            }
        } catch (error) {
            console.error('Error updating priority:', error);
        }
    };

    const assignToAdmin = async (adminId: number) => {
        try {
            const response = await fetch(`/api/admin/messaging/${currentConversation.id}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ admin_id: adminId }),
            });

            if (response.ok) {
                const admin = adminsData.find(a => a.id === adminId);
                setCurrentConversation(prev => prev ? { 
                    ...prev, 
                    assigned_to: adminId,
                    assigned_admin: admin ? { id: admin.id, name: admin.name } : null
                } : prev);
            }
        } catch (error) {
            console.error('Error assigning conversation:', error);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'high':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'low':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'resolved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'closed':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {currentConversation.subject || `Conversation #${currentConversation.id}`}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <User className="h-3 w-3 text-gray-500" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        {customer?.name || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                                <Badge className={`${getPriorityColor(currentConversation.priority)} text-xs`}>
                                    {currentConversation.priority}
                                </Badge>
                                <Badge className={`${getStatusColor(currentConversation.status)} text-xs`}>
                                    {currentConversation.status.replace('_', ' ')}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem onClick={() => updateStatus('open')}>Open</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus('in_progress')}>In Progress</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus('resolved')}>Resolved</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus('closed')}>Closed</DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>Change Priority</DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem onClick={() => updatePriority('urgent')}>🔥 Urgent</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updatePriority('high')}>⚡ High</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updatePriority('medium')}>➡️ Medium</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updatePriority('low')}>✅ Low</DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        {adminsData.length > 0 && (
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Assign to</DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent>
                                                    {adminsData.map((admin) => (
                                                        <DropdownMenuItem 
                                                            key={admin.id}
                                                            onClick={() => assignToAdmin(admin.id)}
                                                        >
                                                            {admin.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {currentConversation.messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
                                    <p className="text-sm">No messages yet</p>
                                </div>
                            ) : (
                                currentConversation.messages.map((msg, index) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className={`flex ${msg.user.role === 'super_admin' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[75%] px-3 py-2 rounded-lg ${
                                                msg.user.role === 'super_admin'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-medium opacity-90">
                                                    {msg.user?.name || 'Unknown'}
                                                </span>
                                                <span className="text-xs opacity-60">
                                                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                            <div className="flex gap-2">
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 min-h-[60px] max-h-[120px] resize-none text-sm"
                                    disabled={isSending}
                                />
                                <Button
                                    onClick={sendMessage}
                                    disabled={!message.trim() || isSending}
                                    size="sm"
                                    className="px-3"
                                >
                                    {isSending ? (
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

