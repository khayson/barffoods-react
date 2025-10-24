<?php

namespace App\Http\Controllers\Admin;

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
     * Display the admin messaging dashboard.
     */
    public function index(): Response
    {
        $conversations = Conversation::with([
            'participants',
            'latestMessage.user',
            'assignedAdmin'
        ])
        ->orderBy('last_message_at', 'desc')
        ->paginate(20);

        // Transform conversations to include snake_case latest_message
        $conversations->getCollection()->transform(function ($conversation) {
            $conversation->latest_message = $conversation->latestMessage;
            return $conversation;
        });

        $admins = User::where('role', 'super_admin')
            ->where('is_active', true)
            ->select('id', 'name', 'email')
            ->get();

        return Inertia::render('admin/messaging', [
            'conversations' => $conversations,
            'admins' => $admins,
        ]);
    }

    /**
     * Get conversation details as JSON (for off-canvas panel).
     */
    public function showApi(Conversation $conversation): JsonResponse
    {
        $conversation->load([
            'participants',
            'messages.user',
            'assignedAdmin'
        ]);

        // Add snake_case latest_message for consistency
        $conversation->latest_message = $conversation->latestMessage;

        // Mark messages as read for the current admin
        $this->markMessagesAsRead($conversation, auth()->id());

        return response()->json([
            'conversation' => $conversation,
        ]);
    }

    /**
     * Send a message in a conversation.
     */
    public function sendMessage(Request $request, Conversation $conversation)
    {
        $request->validate([
            'content' => 'required|string|max:5000',
            'type' => 'sometimes|in:text,image,file,system',
        ]);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => auth()->id(),
            'content' => $request->content,
            'type' => $request->type ?? 'text',
        ]);

        // Update conversation's last message time
        $conversation->update(['last_message_at' => now()]);

        // Mark message as read by sender
        $message->markAsReadBy(auth()->id());

        // Send notification to other participants
        $this->notifyParticipants($conversation, $message->load('user'), auth()->id());

        // Broadcast the message to all participants (only if broadcasting is enabled)
        try {
            broadcast(new MessageSent($message))->toOthers();
        } catch (\Exception $e) {
            // Log but don't fail the request if broadcasting fails
            \Log::warning('Failed to broadcast message', ['error' => $e->getMessage()]);
        }

        // Check if this is an Inertia request
        if ($request->header('X-Inertia')) {
            // Return Inertia response with updated conversation
            $conversation->load(['participants', 'messages.user', 'assignedAdmin']);
            $conversation->latest_message = $conversation->latestMessage;
            
            return back()->with([
                'success' => 'Message sent successfully!',
                'conversation' => $conversation,
                'newMessage' => $message
            ]);
        }

        // Return JSON response for API requests
        return response()->json([
            'success' => true,
            'message' => $message->load('user'),
        ], 201);
    }

    /**
     * Assign a conversation to an admin.
     */
    public function assign(Request $request, Conversation $conversation): JsonResponse
    {
        $request->validate([
            'admin_id' => 'required|exists:users,id',
        ]);

        $admin = User::findOrFail($request->admin_id);
        
        if ($admin->role !== 'super_admin') {
            return response()->json(['error' => 'User is not an admin'], 400);
        }

        $conversation->update(['assigned_to' => $admin->id]);

        // Add admin as participant if not already
        $conversation->participants()->syncWithoutDetaching([
            $admin->id => ['role' => 'admin', 'is_active' => true]
        ]);

        // Send notification to assigned admin
        $this->notifyAssignment($conversation, $admin);

        return response()->json([
            'success' => true,
            'assigned_admin' => $admin,
        ]);
    }

    /**
     * Update conversation status.
     */
    public function updateStatus(Request $request, Conversation $conversation): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
            'notes' => 'sometimes|string|max:1000',
        ]);

        $conversation->update([
            'status' => $request->status,
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'conversation' => $conversation,
        ]);
    }

    /**
     * Update conversation priority.
     */
    public function updatePriority(Request $request, Conversation $conversation): JsonResponse
    {
        $request->validate([
            'priority' => 'required|in:low,medium,high,urgent',
        ]);

        $conversation->update(['priority' => $request->priority]);

        return response()->json([
            'success' => true,
            'conversation' => $conversation,
        ]);
    }

    /**
     * Get conversation statistics.
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total_conversations' => Conversation::count(),
            'open_conversations' => Conversation::open()->count(),
            'in_progress_conversations' => Conversation::inProgress()->count(),
            'resolved_conversations' => Conversation::resolved()->count(),
            'urgent_conversations' => Conversation::withPriority('urgent')->count(),
            'unassigned_conversations' => Conversation::whereNull('assigned_to')->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Mark messages as read for a user in a conversation.
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

        // Update participant's last read time
        $conversation->participants()->updateExistingPivot($userId, [
            'last_read_at' => now()
        ]);
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
                message: "New message from " . ($message->user->name ?? 'Unknown User') . ": " . substr($message->content, 0, 100) . '...',
                userId: $participant->id,
                priority: $conversation->priority,
                actionUrl: "/admin/messaging?open={$conversation->id}",
                actionText: 'View Message',
                icon: 'message-square',
                color: 'blue'
            );
        }
    }

    /**
     * Send notification for conversation assignment.
     */
    private function notifyAssignment(Conversation $conversation, User $admin): void
    {
        $notificationService = new NotificationService();
        $notificationService->create(
            type: 'system',
            title: 'Conversation Assigned',
            message: "You have been assigned to a conversation with priority: {$conversation->priority}",
            userId: $admin->id,
            priority: $conversation->priority,
            actionUrl: "/admin/messaging?open={$conversation->id}",
            actionText: 'View Conversation',
            icon: 'user-check',
            color: 'green'
        );
    }
}
