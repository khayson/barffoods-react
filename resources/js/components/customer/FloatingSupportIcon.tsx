import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// Removed Dialog import - using custom modal
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

interface Message {
    id: number;
    content: string;
    user: {
        id: number;
        name: string;
        role: string;
    };
    created_at: string;
    is_read: boolean;
}

interface Conversation {
    id: number;
    subject: string;
    status: string;
    priority: string;
    last_message_at: string;
    messages: Message[];
    participants: Array<{
        id: number;
        name: string;
        role: string;
    }>;
    assigned_admin?: {
        id: number;
        name: string;
    };
}

interface FloatingSupportIconProps {
    className?: string;
}

export default function FloatingSupportIcon({ className = '' }: FloatingSupportIconProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [newConversation, setNewConversation] = useState({
        subject: '',
        message: ''
    });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const echoRef = useRef<any>(null);

    const handleOpenModal = async () => {
        setIsOpen(true);
        await loadConversations();
    };

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

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
                    auth: {
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                    },
                });
            }

            echoRef.current = window.Echo;

            return () => {
                // Cleanup will be handled when component unmounts
            };
        }, []);

    // Listen for real-time messages
    useEffect(() => {
        if (!echoRef.current || !selectedConversation) return;

        const channel = echoRef.current.private(`conversation.${selectedConversation.id}`);

        channel.listen('.message.sent', (data: any) => {
            const newMessage = data.message;
            
            // Add the new message to the current conversation
            setSelectedConversation(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: [...prev.messages, newMessage]
                };
            });

            // Update conversations list with latest message
            setConversations(prev => 
                prev.map(conv => 
                    conv.id === selectedConversation.id 
                        ? { ...conv, last_message_at: newMessage.created_at }
                        : conv
                )
            );
        });

        return () => {
            channel.stopListening('.message.sent');
        };
    }, [selectedConversation]);

    // Auto-resize textarea
    const autoResizeTextarea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    // Handle textarea input change
    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        autoResizeTextarea();
    };

    const loadConversations = async () => {
        try {
            const response = await fetch('/api/customer/messaging', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setConversations(data.conversations?.data || []);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const loadMessages = async (conversationId: number) => {
        try {
            const response = await fetch(`/api/customer/messaging/${conversationId}/messages`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data.messages || [];
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
        return [];
    };

    const handleSelectConversation = async (conversation: Conversation) => {
        setSelectedConversation(conversation);
        
        // Load messages for this conversation
        const messages = await loadMessages(conversation.id);
        
        // Update the conversation with loaded messages
        setSelectedConversation({
            ...conversation,
            messages: messages
        });
    };

    const handleCreateConversation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConversation.subject.trim() || !newConversation.message.trim()) {
            toast.error('Please fill in both subject and message');
            return;
        }

        setIsLoading(true);
        
        router.post('/api/customer/messaging', {
            subject: newConversation.subject.trim(),
            message: newConversation.message.trim(),
        }, {
            preserveScroll: true,
            onSuccess: async (data: any) => {
                toast.success('Conversation created successfully!');
                setNewConversation({ subject: '', message: '' });
                await loadConversations();
                if (data.conversation) {
                    setSelectedConversation(data.conversation);
                }
            },
            onError: (errors) => {
                console.error('Failed to create conversation:', errors);
                toast.error('Failed to create conversation');
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConversation || !newMessage.trim()) return;

        setIsLoading(true);
        
        router.post(`/api/customer/messaging/${selectedConversation.id}/messages`, {
            content: newMessage.trim(),
            type: 'text'
        }, {
            preserveScroll: true,
            onSuccess: async () => {
                toast.success('Message sent!');
                setNewMessage('');
                // Reset textarea height
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                }
                await loadConversations();
                
                // Reload messages for the current conversation
                if (selectedConversation) {
                    const messages = await loadMessages(selectedConversation.id);
                    setSelectedConversation({
                        ...selectedConversation,
                        messages: messages
                    });
                }
            },
            onError: (errors) => {
                console.error('Failed to send message:', errors);
                toast.error('Failed to send message');
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'resolved': return 'bg-gray-100 text-gray-800';
            case 'closed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            {/* Floating Support Icon */}
            <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
                <Button
                    onClick={handleOpenModal}
                    className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                    size="lg"
                >
                    <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                </Button>
            </div>

            {/* Support Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative w-[98vw] max-w-[1400px] h-[90vh] max-h-[800px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 dark:text-white">
                                        <MessageCircle className="h-5 w-5 text-blue-600" />
                                        <span>Customer Support</span>
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Get help with your orders, account, or any questions you may have.
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-1 min-h-0 px-6 pb-6 gap-4">
                            {/* Conversations List */}
                            <div className="w-full sm:w-1/3 lg:w-1/4 border-r-0 sm:border-r border-gray-200 dark:border-gray-700 flex flex-col sm:mr-4">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <Button
                                        onClick={() => setSelectedConversation(null)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        New Message
                                    </Button>
                                </div>
                                
                                <ScrollArea className="flex-1 overflow-hidden">
                                    <div className="p-2 space-y-2">
                                        {conversations.map((conversation) => (
                                            <div
                                                key={conversation.id}
                                                onClick={() => handleSelectConversation(conversation)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                                    selectedConversation?.id === conversation.id
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                                            {conversation.subject}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {conversation.messages?.[0]?.content?.substring(0, 50)}...
                                                        </p>
                                                    </div>
                                                    <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>
                                                        {conversation.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-gray-400">
                                                        {formatTime(conversation.last_message_at)}
                                                    </span>
                                                    {conversation.assigned_admin && (
                                                        <span className="text-xs text-blue-600 dark:text-blue-400">
                                                            {conversation.assigned_admin.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {conversations.length === 0 && (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No conversations yet</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Conversation View */}
                            <div className="flex-1 flex flex-col min-w-0 h-full sm:h-auto">
                                {selectedConversation ? (
                                    <>
                                        {/* Conversation Header */}
                                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {selectedConversation.subject}
                                                    </h3>
                                                    <div className="flex items-center space-x-2 mt-1 flex-wrap">
                                                        <Badge className={`text-xs ${getStatusColor(selectedConversation.status)}`}>
                                                            {selectedConversation.status}
                                                        </Badge>
                                                        {selectedConversation.assigned_admin && (
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                                Assigned to: {selectedConversation.assigned_admin.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Messages */}
                                        <ScrollArea className="flex-1 overflow-hidden">
                                            <div className="p-4 space-y-4">
                                                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                                                    selectedConversation.messages.map((message) => (
                                                        <div
                                                            key={message.id}
                                                            className={`flex ${message.user.role === 'customer' ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div
                                                                className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-lg break-words ${
                                                                    message.user.role === 'customer'
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                                                }`}
                                                            >
                                                                <div className="flex items-center space-x-2 mb-1 flex-wrap">
                                                                    <span className="text-xs font-medium">
                                                                        {message.user.name}
                                                                    </span>
                                                                    <span className="text-xs opacity-70">
                                                                        {formatTime(message.created_at)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm break-words">{message.content}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">No messages yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>

                                        {/* Message Input */}
                                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                                            <form onSubmit={handleSendMessage} className="flex space-x-2">
                                                <Textarea
                                                    ref={textareaRef}
                                                    value={newMessage}
                                                    onChange={handleMessageChange}
                                                    placeholder="Type your message..."
                                                    // className="flex-1 min-w-0 min-h-[40px] max-h-[120px] resize-none"
                                                    disabled={isLoading}
                                                    rows={1}
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={isLoading || !newMessage.trim()}
                                                    className="bg-blue-600 hover:bg-blue-700 flex-shrink-0 self-end"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </>
                                ) : (
                                    /* New Conversation Form */
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <ScrollArea className="flex-1">
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                                    Start a New Conversation
                                                </h3>
                                                <form onSubmit={handleCreateConversation} className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="subject">Subject</Label>
                                                        <Input
                                                            id="subject"
                                                            value={newConversation.subject}
                                                            onChange={(e) => setNewConversation(prev => ({ ...prev, subject: e.target.value }))}
                                                            placeholder="What can we help you with?"
                                                            className="mt-1"
                                                            disabled={isLoading}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="message">Message</Label>
                                                        <Textarea
                                                            id="message"
                                                            value={newConversation.message}
                                                            onChange={(e) => setNewConversation(prev => ({ ...prev, message: e.target.value }))}
                                                            placeholder="Describe your issue or question..."
                                                            className="mt-1 min-h-[120px]"
                                                            disabled={isLoading}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        disabled={isLoading || !newConversation.subject.trim() || !newConversation.message.trim()}
                                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send className="h-4 w-4 mr-2" />
                                                                Send Message
                                                            </>
                                                        )}
                                                    </Button>
                                                </form>
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}