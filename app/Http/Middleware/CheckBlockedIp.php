<?php

namespace App\Http\Middleware;

use App\Models\BlockedIp;
use App\Helpers\LogHelper;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBlockedIp
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $ipAddress = $request->ip();

        // Check if IP is blocked
        if (BlockedIp::isBlocked($ipAddress)) {
            $blockedRecord = BlockedIp::where('ip_address', $ipAddress)->first();

            LogHelper::security('Blocked IP attempted access', [
                'ip_address' => $ipAddress,
                'reason' => $blockedRecord->reason,
                'url' => $request->fullUrl(),
                'user_agent' => $request->userAgent(),
            ], 'warning');

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Access denied. Your IP address has been blocked.',
                    'error_code' => 'IP_BLOCKED',
                    'timestamp' => now()->toIso8601String(),
                ], 403);
            }

            abort(403, 'Access denied. Your IP address has been blocked.');
        }

        return $next($request);
    }
}
