import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    ArrowLeft,
    Send,
    Clock,
    User,
    AlertCircle,
    CheckCircle,
    XCircle,
    MoreHorizontal,
    UserCheck,
    Flag
} from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

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

interface AdminConversationProps {
    conversation: Conversation;
}

export default function AdminConversation({ conversation }: AdminConversationProps) {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentConversation, setCurrentConversation] = useState(conversation);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const echoRef = useRef<any>(null);
    
    const customer = currentConversation.participants.find(p => p.pivot.role === 'customer');
    const admin = currentConversation.participants.find(p => p.pivot.role === 'admin');

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentConversation.messages]);

    // Setup real-time messaging
    useEffect(() => {
        if (!window.Echo) {
            window.Pusher = Pusher;
            window.Echo = new Echo({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY,
                wsHost: import.meta.env.VITE_REVERB_HOST,
                wsPort: import.meta.env.VITE_REVERB_PORT,
                wssPort: import.meta.env.VITE_REVERB_PORT,
                forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
                enabledTransports: ['ws', 'wss'],
            });
        }

        echoRef.current = window.Echo;

        return () => {
            // Cleanup will be handled when component unmounts
        };
    }, []);

    // Listen for real-time messages
    useEffect(() => {
        if (!echoRef.current || !currentConversation) return;

        const channel = echoRef.current.private(`conversation.${currentConversation.id}`);

        channel.listen('.message.sent', (data: any) => {
            const newMessage = data.message;
            
            // Add the new message to the current conversation
            setCurrentConversation(prev => ({
                ...prev,
                messages: [...prev.messages, newMessage],
                last_message_at: newMessage.created_at
            }));
        });

        return () => {
            channel.stopListening('.message.sent');
        };
    }, [currentConversation]);

    const sendMessage = async () => {
        if (!message.trim() || isLoading) return;

        setIsLoading(true);
        
        try {
            router.post(`/api/admin/messaging/${currentConversation.id}/messages`, {
                content: message.trim(),
                type: 'text'
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setMessage('');
                    toast.success('Message sent!');
                },
                onError: (errors) => {
                    console.error('Failed to send message:', errors);
                    toast.error('Failed to send message');
                },
                onFinish: () => {
                    setIsLoading(false);
                }
            });
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
            setIsLoading(false);
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
                window.location.reload();
            }
        } catch (error) {
            console.error('Error updating status:', error);
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
                window.location.reload();
            } else {
                console.error('Failed to assign conversation');
            }
        } catch (error) {
            console.error('Error assigning conversation:', error);
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
                window.location.reload();
            } else {
                console.error('Failed to update priority');
            }
        } catch (error) {
            console.error('Error updating priority:', error);
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
            <Head title={`Conversation #${currentConversation.id}`} />
            
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/messaging"
                            className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {/* Back to Conversations */}
                        </Link>
                        
                        <div className="flex items-center space-x-3">
                            {getStatusIcon(currentConversation.status)}
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {currentConversation.subject || `Conversation #${currentConversation.id}`}
                                </h1>
                                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                    <User className="h-4 w-4" />
                                    <span>{customer?.name || 'Unknown Customer'}</span>
                                    <span>•</span>
                                    <span>{customer?.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(currentConversation.priority)}>
                            {currentConversation.priority}
                        </Badge>
                        
                        <Badge className={getStatusColor(currentConversation.status)}>
                            {currentConversation.status.replace('_', ' ')}
                        </Badge>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateStatus('open')}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Mark as Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus('in_progress')}>
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Mark as In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus('resolved')}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Resolved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus('closed')}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Close Conversation
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => assignToAdmin(1)}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Assign to Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updatePriority('high')}>
                                    <Flag className="h-4 w-4 mr-2" />
                                    Change Priority
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentConversation.messages.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                                No messages yet. Start the conversation!
                            </p>
                        </div>
                    ) : (
                        currentConversation.messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.user.role === 'super_admin' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        msg.user.role === 'super_admin'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-xs font-medium">
                                            {msg.user?.name || 'Unknown User'}
                                        </span>
                                        <span className="text-xs opacity-75">
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex space-x-2">
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={sendMessage}
                            disabled={!message.trim() || isLoading}
                            className="px-4"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
