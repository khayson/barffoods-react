<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AdminNotificationController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Notification::class);
        
        $query = Notification::with('user')->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $notifications = $query->paginate(50);

        return response()->json($notifications);
    }

    public function show(Notification $notification): JsonResponse
    {
        $this->authorize('view', $notification);
        
        $notification->load('user');
        
        return response()->json($notification);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Notification::class);
        
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string|in:order,product,promotion,security,inventory,system',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'action_url' => 'nullable|string|max:500',
            'action_text' => 'nullable|string|max:100',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'expires_at' => 'nullable|string|date',
        ]);

        $notification = NotificationService::create(
            userId: $request->user_id,
            type: $request->type,
            priority: $request->priority,
            title: $request->title,
            message: $request->message,
            actionUrl: $request->action_url,
            actionText: $request->action_text,
            icon: $request->icon,
            color: $request->color,
            expiresAt: $request->expires_at ? now()->parse($request->expires_at) : null,
        );

        return response()->json($notification, 201);
    }

    public function update(Request $request, Notification $notification): JsonResponse
    {
        $this->authorize('update', $notification);
        
        $request->validate([
            'type' => 'sometimes|string|in:order,product,promotion,security,inventory,system',
            'priority' => 'sometimes|string|in:low,medium,high,urgent',
            'status' => 'sometimes|string|in:unread,read,archived',
            'title' => 'sometimes|string|max:255',
            'message' => 'sometimes|string',
            'action_url' => 'nullable|string|max:500',
            'action_text' => 'nullable|string|max:100',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'expires_at' => 'nullable|string|date',
        ]);

        $notification->update($request->only([
            'type', 'priority', 'status', 'title', 'message',
            'action_url', 'action_text', 'icon', 'color', 'expires_at'
        ]));

        // Broadcast the update
        broadcast(new \App\Events\NotificationUpdated($notification))->toOthers();

        return response()->json($notification);
    }

    public function destroy(Notification $notification): JsonResponse
    {
        $this->authorize('delete', $notification);
        
        $notification->delete();

        return response()->json(['success' => true]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', Notification::class);
        
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:notifications,id',
        ]);

        $deletedCount = Notification::whereIn('id', $request->ids)->delete();

        return response()->json(['success' => true, 'deleted_count' => $deletedCount]);
    }

    public function dispatch(Request $request): JsonResponse
    {
        // Debug: Check authentication
        if (!auth()->check()) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $user = auth()->user();
        if ($user->role !== 'super_admin') {
            return response()->json(['error' => 'Unauthorized - not super admin'], 403);
        }
        
        $this->authorize('create', Notification::class);
        
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
            'type' => 'required|string|in:order,product,promotion,security,inventory,system',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'action_url' => 'nullable|string|max:500',
            'action_text' => 'nullable|string|max:100',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'expires_at' => 'nullable|string|date',
        ]);

        $notifications = [];
        $expiresAt = null;
        if ($request->expires_at && trim($request->expires_at) !== '') {
            try {
                $expiresAt = now()->parse($request->expires_at);
                
                // Only set expiration if it's in the future
                if ($expiresAt->isPast()) {
                    $expiresAt = null; // Don't set expiration for past dates
                }
            } catch (\Exception $e) {
                $expiresAt = null;
            }
        }

        $notificationService = new NotificationService();
        
        foreach ($request->user_ids as $userId) {
            $notification = $notificationService->create(
                type: $request->type,
                title: $request->title,
                message: $request->message,
                userId: $userId,
                priority: $request->priority,
                data: null,
                actionUrl: $request->action_url,
                actionText: $request->action_text,
                icon: $request->icon,
                color: $request->color,
                expiresAt: $expiresAt,
            );
            $notifications[] = $notification;
        }

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'count' => count($notifications)
        ], 201);
    }

    public function getUsers(): JsonResponse
    {
        $this->authorize('viewAny', Notification::class);
        
        $users = User::select('id', 'name', 'email', 'role')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    public function getStats(): JsonResponse
    {
        $this->authorize('viewAny', Notification::class);
        
        $stats = [
            'total' => Notification::count(),
            'unread' => Notification::where('status', 'unread')->count(),
            'read' => Notification::where('status', 'read')->count(),
            'archived' => Notification::where('status', 'archived')->count(),
            'by_type' => Notification::selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
            'by_priority' => Notification::selectRaw('priority, count(*) as count')
                ->groupBy('priority')
                ->pluck('count', 'priority'),
            'recent' => Notification::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        return response()->json($stats);
    }
}
