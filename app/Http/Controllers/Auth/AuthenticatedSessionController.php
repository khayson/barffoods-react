<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AnonymousCart;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'redirect' => $request->get('redirect'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $user = $request->validateCredentials();

        // Check if user is active
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Your account has been deactivated. Please contact support.',
            ]);
        }

        if (Features::enabled(Features::twoFactorAuthentication()) && $user->hasEnabledTwoFactorAuthentication()) {
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => $request->boolean('remember'),
            ]);

            return to_route('two-factor.login');
        }

        Auth::login($user, $request->boolean('remember'));

        // Migrate anonymous cart to user cart before regenerating session
        $this->migrateAnonymousCart($user->id);

        // Create Sanctum token for API access
        $token = $user->createToken('web-cart-token')->plainTextToken;
        
        // Store token in session for frontend access
        $request->session()->put('sanctum_token', $token);

        $request->session()->regenerate();

        // Handle redirect parameter
        $redirectUrl = $request->get('redirect');
        if ($redirectUrl) {
            return redirect($redirectUrl);
        }

        // Role-based redirect
        if ($user->role === 'super_admin') {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        }

        return redirect()->intended(route('customer.dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Migrate anonymous cart to user cart
     */
    private function migrateAnonymousCart($userId)
    {
        try {
            $sessionId = Session::getId();
            $anonymousCart = AnonymousCart::where('session_id', $sessionId)->first();
            
            if ($anonymousCart && !empty($anonymousCart->cart_data)) {
                $anonymousCart->migrateToUser($userId);
            }
        } catch (\Exception $e) {
            // Log error but don't break login process
            \Log::warning('Failed to migrate anonymous cart', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }
}
