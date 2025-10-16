<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BroadcastController extends Controller
{
    /**
     * Authenticate the request for channel access.
     */
    public function authenticate(Request $request)
    {
        \Log::info('Broadcasting auth request', [
            'channel_name' => $request->input('channel_name'),
            'user_id' => $request->user()?->id,
            'headers' => $request->headers->all(),
        ]);
        
        $user = $request->user();
        
        if (!$user) {
            \Log::warning('Broadcasting auth failed: No authenticated user');
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get the channel name from the request
        $channelName = $request->input('channel_name');
        
        // Authorize different channel types
        if (strpos($channelName, 'private-user.') === 0) {
            $userId = str_replace('private-user.', '', $channelName);
            
            // User can only access their own channel
            if ($user->id != $userId) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
            
            \Log::info('Broadcasting auth successful for user channel', [
                'user_id' => $user->id,
                'channel_name' => $channelName,
            ]);
            
            return response()->json([
                'auth' => 'authorized',
                'channel_data' => [
                    'user_id' => $user->id,
                    'user_info' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ]
                ]
            ]);
        }
        
        if (strpos($channelName, 'private-notifications.') === 0) {
            $userId = str_replace('private-notifications.', '', $channelName);
            
            // User can only access their own notifications channel
            if ($user->id != $userId) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
            
            \Log::info('Broadcasting auth successful for notifications channel', [
                'user_id' => $user->id,
                'channel_name' => $channelName,
            ]);
            
            return response()->json([
                'auth' => 'authorized',
                'channel_data' => [
                    'user_id' => $user->id,
                    'user_info' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ]
                ]
            ]);
        }
        
        if ($channelName === 'private-admin.orders') {
            // Only admins can access admin channels
            if (!$user->isAdmin()) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
            
            \Log::info('Broadcasting auth successful for admin channel', [
                'user_id' => $user->id,
                'channel_name' => $channelName,
            ]);
            
            return response()->json([
                'auth' => 'authorized',
                'channel_data' => [
                    'user_id' => $user->id,
                    'user_info' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ]
                ]
            ]);
        }
        
        // Default: deny access to unknown channels
        return response()->json(['error' => 'Forbidden'], 403);
    }
}
