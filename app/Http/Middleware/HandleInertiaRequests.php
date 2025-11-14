<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\SystemSetting;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Get store address from system settings
        $storeAddress = SystemSetting::get('store_address', [
            'company_name' => 'BarfFoods',
            'phone' => '+1 (555) 123-4567',
            'email' => 'support@barffoods.com',
            'street_address' => '123 Grocery Street',
            'city' => 'Food City',
            'state' => 'FC',
            'zip_code' => '12345',
            'country' => 'US'
        ]);

        // Parse if it's a JSON string
        if (is_string($storeAddress)) {
            $storeAddress = json_decode($storeAddress, true);
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'phone' => $request->user()->phone,
                    'role' => $request->user()->role,
                    'is_active' => $request->user()->is_active,
                    'avatar' => $request->user()->avatar,
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
            'storeAddress' => $storeAddress,
        ];
    }
}
