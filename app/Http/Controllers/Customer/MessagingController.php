<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\NotificationService;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class MessagingController extends Controller
{
    /**
     * Show the form for creating a new conversation.
     */
    public function create(): Response
    {
        return Inertia::render('customer/messaging-create');
    }

    /**
     * Display the customer messaging interface.
     */
    public function index(): Response
    {
        $user = auth()->user();
        
        $conversations = Conversation::with([
            'participants',
            'latestMessage.user',
            'assignedAdmin'
        ])
        ->whereHas('participants', function ($query) use ($user) {
            $query->where('conversation_participants.user_id', $user->id)
                  ->where('conversation_participants.role', 'customer');
        })
        ->orderBy('last_message_at', 'desc')
        ->paginate(10);

        // Transform conversations to include snake_case latest_message
        $conversations->getCollection()->transform(function ($conversation) {
            $conversation->latest_message = $conversation->latestMessage;
            return $conversation;
        });

        return Inertia::render('customer/messaging', [
            'conversations' => $conversations,
        ]);
    }

    /**
     * API endpoint to get conversations for AJAX requests.
     */
    public function apiIndex(): JsonResponse
    {
        $user = auth()->user();
        
        $conversations = Conversation::with([
            'participants',
            'latestMessage.user',
            'assignedAdmin',
            'messages.user'
        ])
        ->whereHas('participants', function ($query) use ($user) {
            $query->where('conversation_participants.user_id', $user->id)
                  ->where('conversation_participants.role', 'customer');
        })
        ->orderBy('last_message_at', 'desc')
        ->paginate(10);

        // Transform conversations to include snake_case latest_message
        $conversations->getCollection()->transform(function ($conversation) {
            $conversation->latest_message = $conversation->latestMessage;
            return $conversation;
        });

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    /**
     * API endpoint to get messages for a specific conversation.
     */
    public function apiMessages(Conversation $conversation): JsonResponse
    {
        $user = auth()->user();
        
        // Verify the customer is a participant in this conversation
        $isParticipant = $conversation->participants()
            ->where('conversation_participants.user_id', $user->id)
            ->where('conversation_participants.role', 'customer')
            ->exists();

        if (!$isParticipant) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = $conversation->messages()
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'messages' => $messages,
        ]);
    }

    /**
     * Show a specific conversation.
     */
    public function show(Conversation $conversation): Response
    {
        $user = auth()->user();
        
        // Verify the customer is a participant in this conversation
        $isParticipant = $conversation->participants()
            ->where('conversation_participants.user_id', $user->id)
            ->where('conversation_participants.role', 'customer')
            ->exists();

        if (!$isParticipant) {
            abort(403, 'You are not authorized to view this conversation.');
        }

        $conversation->load([
            'participants',
            'messages.user',
            'assignedAdmin'
        ]);

        // Add snake_case latest_message for consistency
        $conversation->latest_message = $conversation->latestMessage;

        // Mark messages as read for the current customer
        $this->markMessagesAsRead($conversation, $user->id);

        return Inertia::render('customer/conversation', [
            'conversation' => $conversation,
        ]);
    }

    /**
     * Create a new conversation.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        DB::beginTransaction();
        
        try {
            // Create conversation
            $conversation = Conversation::create([
                'subject' => $request->subject,
                'status' => 'open',
                'priority' => 'medium',
                'last_message_at' => now(),
            ]);

            // Add customer as participant
            $conversation->participants()->attach($user->id, [
                'role' => 'customer',
                'joined_at' => now(),
                'is_active' => true,
            ]);

            // Find an available admin to assign
            $admin = User::where('role', 'super_admin')
                ->where('is_active', true)
                ->first();

            if ($admin) {
                $conversation->update(['assigned_to' => $admin->id]);
                
                // Add admin as participant
                $conversation->participants()->attach($admin->id, [
                    'role' => 'admin',
                    'joined_at' => now(),
                    'is_active' => true,
                ]);
            }

            // Create the initial message
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'content' => $request->message,
                'type' => 'text',
                'is_read' => false,
            ]);

            // Mark message as read by the sender
            $message->markAsReadBy($user->id);

            // Send notification to admin
            if ($admin) {
                $notificationService = new NotificationService();
                $notificationService->create(
                    type: 'message',
                    title: 'New Customer Message',
                    message: "New message from {$user->name}: {$request->subject}",
                    userId: $admin->id,
                    priority: 'medium',
                    actionUrl: "/admin/messaging/{$conversation->id}",
                    actionText: 'View Conversation',
                    icon: 'message',
                    color: 'blue'
                );
            }

            DB::commit();

            // Check if this is an Inertia request
            if ($request->header('X-Inertia')) {
                // Return Inertia response with conversation data
                $conversation->load(['participants', 'messages.user', 'assignedAdmin']);
                $conversation->latest_message = $conversation->latestMessage;
                
                return redirect()->route('customer.messaging.conversation', $conversation)->with([
                    'success' => 'Conversation created successfully!',
                    'conversation' => $conversation
                ]);
            }

            // Return JSON response for API requests
            return response()->json([
                'success' => true,
                'conversation' => $conversation->load(['participants', 'messages.user', 'assignedAdmin']),
                'message' => 'Conversation created successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->header('X-Inertia')) {
                return back()->withErrors(['error' => 'Failed to create conversation']);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create conversation'
            ], 500);
        }
    }

    /**
     * Send a message in an existing conversation.
     */
    public function sendMessage(Request $request, Conversation $conversation)
    {
        $user = auth()->user();
        
        // Verify the customer is a participant in this conversation
        $isParticipant = $conversation->participants()
            ->where('conversation_participants.user_id', $user->id)
            ->where('conversation_participants.role', 'customer')
            ->exists();

        if (!$isParticipant) {
            if ($request->header('X-Inertia')) {
                return back()->withErrors(['error' => 'Unauthorized']);
            }
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        DB::beginTransaction();
        
        try {
            // Create message
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'content' => $request->content,
                'type' => 'text',
                'is_read' => false,
            ]);

            // Update conversation
            $conversation->update([
                'last_message_at' => now(),
                'status' => 'open', // Reopen if it was closed
            ]);

            // Mark message as read by the sender
            $message->markAsReadBy($user->id);

            // Notify admin participants
            $this->notifyParticipants($conversation, $message, $user->id);

            // Broadcast the message to all participants
            broadcast(new MessageSent($message));

            DB::commit();

            // Check if this is an Inertia request
            if ($request->header('X-Inertia')) {
                // Return Inertia response with updated conversation
                $conversation->load(['participants', 'messages.user', 'assignedAdmin']);
                $conversation->latest_message = $conversation->latestMessage;
                
                return back()->with([
                    'success' => 'Message sent successfully!',
                    'conversation' => $conversation,
                    'newMessage' => $message->load('user')
                ]);
            }

            // Return JSON response for API requests
            return response()->json([
                'success' => true,
                'message' => $message->load('user')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->header('X-Inertia')) {
                return back()->withErrors(['error' => 'Failed to send message']);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message'
            ], 500);
        }
    }

    /**
     * Mark messages as read for a user.
     */
    private function markMessagesAsRead(Conversation $conversation, int $userId): void
    {
        $unreadMessages = $conversation->messages()
            ->where('user_id', '!=', $userId)
            ->whereDoesntHave('reads', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->get();

        foreach ($unreadMessages as $message) {
            $message->markAsReadBy($userId);
        }
    }

    /**
     * Send notifications to conversation participants.
     */
    private function notifyParticipants(Conversation $conversation, Message $message, int $senderId): void
    {
        $participants = $conversation->participants()
            ->where('user_id', '!=', $senderId)
            ->where('conversation_participants.is_active', true)
            ->get();

        foreach ($participants as $participant) {
            $notificationService = new NotificationService();
            $notificationService->create(
                type: 'message',
                title: 'New Message',
                message: "New message in conversation: {$conversation->subject}",
                userId: $participant->id,
                priority: 'medium',
                actionUrl: $participant->pivot->role === 'admin' 
                    ? "/admin/messaging/{$conversation->id}" 
                    : "/customer/messaging/{$conversation->id}",
                actionText: 'View Message',
                icon: 'message',
                color: 'blue'
            );
        }
    }
}