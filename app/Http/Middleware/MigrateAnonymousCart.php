<?php

namespace App\Http\Middleware;

use App\Models\AnonymousCart;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class MigrateAnonymousCart
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only run for authenticated users
        if (Auth::check()) {
            $this->migrateCartIfNeeded(Auth::id());
        }

        return $next($request);
    }

    /**
     * Migrate anonymous cart to user cart if not already done
     */
    private function migrateCartIfNeeded($userId)
    {
        try {
            $sessionId = Session::getId();
            
            // Check if there's an anonymous cart for this session
            $anonymousCart = AnonymousCart::where('session_id', $sessionId)->first();
            
            if ($anonymousCart && !empty($anonymousCart->cart_data)) {
                Log::info('Middleware: Migrating anonymous cart', [
                    'user_id' => $userId,
                    'session_id' => $sessionId,
                    'items_count' => count($anonymousCart->cart_data)
                ]);
                
                $anonymousCart->migrateToUser($userId);
            }
        } catch (\Exception $e) {
            // Log error but don't break the request
            Log::error('Middleware: Failed to migrate anonymous cart', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }
}
