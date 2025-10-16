<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BroadcastingController extends Controller
{
    /**
     * Authenticate the request for channel access.
     */
    public function authenticate(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
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
