<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class NotificationController extends Controller
{
    use AuthorizesRequests;
    
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Notification::forUser($user->id)
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->has('type')) {
            $query->byType($request->type);
        }

        if ($request->has('priority')) {
            $query->byPriority($request->priority);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $notifications = $query->limit(50)->get();

        return response()->json($notifications);
    }

    public function show(Notification $notification): JsonResponse
    {
        $this->authorize('view', $notification);
        
        return response()->json($notification);
    }

    public function markAsRead(Notification $notification): JsonResponse
    {
        $this->authorize('update', $notification);
        
        $notification->markAsRead();

        // Broadcast the update
        broadcast(new \App\Events\NotificationUpdated($notification))->toOthers();

        return response()->json(['success' => true]);
    }

    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();
        
        Notification::forUser($user->id)
            ->unread()
            ->update([
                'status' => 'read',
                'read_at' => now(),
            ]);

        return response()->json(['success' => true]);
    }

    public function destroy(Notification $notification): JsonResponse
    {
        $this->authorize('delete', $notification);
        
        $notification->delete();

        return response()->json(['success' => true]);
    }

    public function getUnreadCount(): JsonResponse
    {
        $user = Auth::user();
        
        $count = Notification::forUser($user->id)->unread()->count();

        return response()->json(['count' => $count]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $request->validate([
            'email' => 'boolean',
            'push' => 'boolean',
            'inApp' => 'boolean',
            'types' => 'array',
            'frequency' => 'in:immediate,hourly,daily,weekly',
        ]);

        // Store settings in user preferences or separate table
        $user->update([
            'notification_settings' => $request->all(),
        ]);

        return response()->json(['success' => true]);
    }
}
