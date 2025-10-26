<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminNotificationController;
use App\Http\Controllers\Admin\MessagingController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\WishlistItemController;
use App\Http\Controllers\CartItemController;
use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [WelcomeController::class, 'index'])->name('home');

// Broadcasting authentication is handled by routes/channels.php

// Product routes
Route::get('/products', [ProductController::class, 'browse'])->name('products.index');
Route::get('/products/{id}', [ProductController::class, 'show'])->name('products.show');

// Store routes
Route::get('/stores', [StoreController::class, 'browse'])->name('stores.index');
Route::get('/stores/{id}', [StoreController::class, 'show'])->name('stores.show');

// Order routes (authenticated users only)
Route::middleware(['auth'])->group(function () {
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{id}', [OrderController::class, 'show'])->name('orders.show');
    
    // Admin order management routes
    Route::prefix('admin')->middleware(['auth', 'role:super_admin'])->group(function () {
        Route::get('/orders', [App\Http\Controllers\Admin\OrderManagementController::class, 'index'])->name('admin.orders.index');
        Route::get('/orders/{id}', [App\Http\Controllers\Admin\OrderManagementController::class, 'show'])->name('admin.orders.show');
        Route::patch('/orders/{id}/status', [App\Http\Controllers\Admin\OrderManagementController::class, 'updateStatus'])->name('admin.orders.update-status');
        Route::get('/orders/{id}/transitions', [App\Http\Controllers\Admin\OrderManagementController::class, 'getAvailableTransitions'])->name('admin.orders.transitions');
        Route::get('/orders/{id}/csv', [App\Http\Controllers\Admin\OrderManagementController::class, 'downloadCsv'])->name('admin.orders.download-csv');
        Route::patch('/orders/{id}/ready', [App\Http\Controllers\Admin\OrderManagementController::class, 'markAsReady'])->name('admin.orders.mark-ready');
        Route::patch('/orders/{orderId}/items/{itemId}/status', [App\Http\Controllers\Admin\OrderManagementController::class, 'updateItemStatus'])->name('admin.orders.update-item-status');
        Route::post('/orders/{id}/create-label', [App\Http\Controllers\Admin\OrderManagementController::class, 'createLabel'])->name('admin.orders.create-label');
        Route::get('/orders/{id}/create-label', function($id) {
            return redirect()->route('admin.orders.show', $id)->with('info', 'Please use the "Create Label" button to create shipping labels.');
        });
        Route::delete('/orders/{id}', [App\Http\Controllers\Admin\OrderManagementController::class, 'destroy'])->name('admin.orders.destroy');
    });
});

// Review routes (authenticated users only)
Route::middleware(['auth'])->group(function () {
    Route::post('/reviews', [ProductReviewController::class, 'store'])->name('reviews.store');
    Route::put('/reviews/{id}', [ProductReviewController::class, 'update'])->name('reviews.update');
    Route::delete('/reviews/{id}', [ProductReviewController::class, 'destroy'])->name('reviews.destroy');
    Route::post('/reviews/{id}/helpful', [ProductReviewController::class, 'toggleHelpful'])->name('reviews.helpful');
    Route::post('/reviews/{id}/report', [ProductReviewController::class, 'report'])->name('reviews.report');
});

// Wishlist routes (authenticated users only)
Route::middleware(['auth'])->group(function () {
    Route::get('/wishlist', function () {
        return Inertia::render('wishlist');
    })->name('wishlist.page');
    Route::get('/api/wishlist', [WishlistItemController::class, 'index'])->name('wishlist.index');
    Route::post('/api/wishlist', [WishlistItemController::class, 'store'])->name('wishlist.store');
    Route::delete('/api/wishlist/{id}', [WishlistItemController::class, 'destroy'])->name('wishlist.destroy');
    Route::get('/api/wishlist/check/{productId}', [WishlistItemController::class, 'check'])->name('wishlist.check');
    
    // Wishlist sharing routes
    Route::post('/api/wishlist/share/generate', [App\Http\Controllers\WishlistShareController::class, 'generateToken'])->name('wishlist.share.generate');
    Route::post('/api/wishlist/share/toggle', [App\Http\Controllers\WishlistShareController::class, 'togglePrivacy'])->name('wishlist.share.toggle');
    Route::get('/api/wishlist/share/settings', [App\Http\Controllers\WishlistShareController::class, 'getSettings'])->name('wishlist.share.settings');
});

// Public shared wishlist route (no auth required)
Route::get('/wishlist/shared/{token}', [App\Http\Controllers\WishlistShareController::class, 'show'])->name('wishlist.shared');

// Cart page (no auth required)
Route::get('/cart', [CartItemController::class, 'show'])->name('cart.show');

// Checkout routes (auth required)
Route::middleware(['auth'])->group(function () {
    Route::get('/checkout', [App\Http\Controllers\CheckoutController::class, 'index'])->name('checkout.index');
        Route::post('/checkout/create-session', [App\Http\Controllers\CheckoutController::class, 'createCheckoutSession'])->name('checkout.create-session');
    Route::get('/checkout/success', [App\Http\Controllers\CheckoutController::class, 'success'])->name('checkout.success');
    Route::post('/checkout', [App\Http\Controllers\CheckoutController::class, 'store'])->name('checkout.store');
    
    // Debug route for testing checkout success
    Route::get('/checkout/debug-success', function() {
        return redirect('/orders/1')->with('success', 'Test redirect to order page');
    })->name('checkout.debug-success');
    
    // Sanctum token endpoint
    Route::get('/api/sanctum/token', function () {
        return response()->json([
            'token' => session('sanctum_token')
        ]);
    })->name('api.sanctum.token');
    
    // Notification routes
    Route::get('/api/notifications', [App\Http\Controllers\NotificationController::class, 'index'])->name('api.notifications.index');
    Route::post('/api/notifications/{notification}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('api.notifications.read');
    Route::post('/api/notifications/mark-all-read', [App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('api.notifications.mark-all-read');
});

        // Address management routes (auth required)
        Route::middleware(['auth'])->group(function () {
            Route::get('/api/addresses', [App\Http\Controllers\UserAddressController::class, 'index'])->name('addresses.index');
            Route::post('/api/addresses', [App\Http\Controllers\UserAddressController::class, 'store'])->name('addresses.store');
            Route::put('/api/addresses/{address}', [App\Http\Controllers\UserAddressController::class, 'update'])->name('addresses.update');
            Route::delete('/api/addresses/{address}', [App\Http\Controllers\UserAddressController::class, 'destroy'])->name('addresses.destroy');
            Route::post('/api/addresses/{address}/set-default', [App\Http\Controllers\UserAddressController::class, 'setDefault'])->name('addresses.set-default');
        });
            
        // Address validation routes (no auth required for suggestions)
        Route::post('/api/address/validate', [App\Http\Controllers\AddressValidationController::class, 'validate'])->name('address.validate');
        Route::post('/api/address/check-delivery-zone', [App\Http\Controllers\AddressValidationController::class, 'checkDeliveryZone'])->name('address.check-delivery-zone');
        
        // Shipping routes (auth required)
        Route::get('/api/orders/{order}/shipping/rates', [App\Http\Controllers\ShippingController::class, 'getRates'])->name('shipping.rates');
        Route::post('/api/orders/{order}/shipping/label', [App\Http\Controllers\ShippingController::class, 'createLabel'])->name('shipping.label');
        Route::post('/api/shipping/track', [App\Http\Controllers\ShippingController::class, 'track'])->name('shipping.track');


// Anonymous cart routes (no auth required, session-based)
Route::get('/api/cart/anonymous', [CartItemController::class, 'getAnonymousCart'])->name('api.cart.anonymous');
Route::post('/api/cart/anonymous', [CartItemController::class, 'addToAnonymousCart'])->name('api.cart.anonymous.store');
Route::put('/api/cart/anonymous/{id}', [CartItemController::class, 'updateAnonymousCart'])->name('api.cart.anonymous.update');
Route::delete('/api/cart/anonymous/{id}', [CartItemController::class, 'removeFromAnonymousCart'])->name('api.cart.anonymous.destroy');
Route::delete('/api/cart/anonymous', [CartItemController::class, 'clearAnonymousCart'])->name('api.cart.anonymous.clear');

// Product API routes
Route::get('/api/products', [ProductController::class, 'index'])->name('api.products.index');
Route::get('/api/products/{id}', [ProductController::class, 'show'])->name('api.products.show');

// System Settings API (public)
Route::get('/api/system-settings', [App\Http\Controllers\Admin\SystemSettingsController::class, 'getPublicSettings'])->name('api.system-settings');

// Store API routes
Route::get('/api/stores', [StoreController::class, 'index'])->name('api.stores.index');
Route::get('/api/stores/nearby', [StoreController::class, 'getNearbyStores'])->name('api.stores.nearby');
Route::post('/api/stores/calculate-delivery', [StoreController::class, 'calculateDelivery'])->name('api.stores.calculate-delivery');

// Customer routes (default authenticated users)
Route::middleware(['auth', 'role:customer'])->group(function () {
    Route::get('/dashboard', [CustomerController::class, 'dashboard'])->name('customer.dashboard');
    Route::get('/notifications', function () { return Inertia::render('notifications/index'); })->name('customer.notifications');
    // Add other customer routes here
});

// Admin routes
Route::prefix('admin')->name('admin.')->middleware(['auth', 'role:super_admin'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/notifications', [AdminController::class, 'notifications'])->name('notifications');
    
    // Messaging routes (using off-canvas panel, no separate conversation page)
    Route::get('/messaging', [MessagingController::class, 'index'])->name('messaging');
    
    // Product Management
    Route::get('/products', [App\Http\Controllers\Admin\ProductManagementController::class, 'index'])->name('products');
    Route::post('/products', [App\Http\Controllers\Admin\ProductManagementController::class, 'store'])->name('products.store');
    Route::put('/products/{id}', [App\Http\Controllers\Admin\ProductManagementController::class, 'update'])->name('products.update');
    Route::delete('/products/{id}', [App\Http\Controllers\Admin\ProductManagementController::class, 'destroy'])->name('products.destroy');
    Route::patch('/products/{id}/toggle-status', [App\Http\Controllers\Admin\ProductManagementController::class, 'toggleStatus'])->name('products.toggle-status');
    Route::post('/products/upload-image', [App\Http\Controllers\Admin\ProductManagementController::class, 'uploadImage'])->name('products.upload-image');
    
    // Store Management
    Route::get('/stores', [App\Http\Controllers\Admin\StoreManagementController::class, 'index'])->name('stores');
    Route::post('/stores', [App\Http\Controllers\Admin\StoreManagementController::class, 'store'])->name('stores.store');
    Route::put('/stores/{id}', [App\Http\Controllers\Admin\StoreManagementController::class, 'update'])->name('stores.update');
    Route::delete('/stores/{id}', [App\Http\Controllers\Admin\StoreManagementController::class, 'destroy'])->name('stores.destroy');
    Route::patch('/stores/{id}/toggle-status', [App\Http\Controllers\Admin\StoreManagementController::class, 'toggleStatus'])->name('stores.toggle-status');
    
    // Category Management
    Route::get('/categories', [App\Http\Controllers\Admin\CategoryManagementController::class, 'index'])->name('categories');
    Route::post('/categories', [App\Http\Controllers\Admin\CategoryManagementController::class, 'store'])->name('categories.store');
    Route::put('/categories/{id}', [App\Http\Controllers\Admin\CategoryManagementController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{id}', [App\Http\Controllers\Admin\CategoryManagementController::class, 'destroy'])->name('categories.destroy');
    Route::patch('/categories/{id}/toggle-status', [App\Http\Controllers\Admin\CategoryManagementController::class, 'toggleStatus'])->name('categories.toggle-status');
    
    // System Settings (Super Admin only)
    Route::get('/system-settings', [App\Http\Controllers\Admin\SystemSettingsController::class, 'index'])->name('system-settings');
    
    // Add other admin routes here
});

// Notification API Routes
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/api/notifications', [NotificationController::class, 'index']);
    Route::get('/api/notifications/{notification}', [NotificationController::class, 'show']);
    Route::patch('/api/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/api/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/api/notifications/{notification}', [NotificationController::class, 'destroy']);
    Route::get('/api/notifications/unread/count', [NotificationController::class, 'getUnreadCount']);
    Route::put('/api/notifications/settings', [NotificationController::class, 'updateSettings']);
});

// Admin Messaging API Routes
Route::prefix('api/admin')->middleware(['web', 'auth', 'role:super_admin'])->group(function () {
    Route::get('/messaging/{conversation}', [App\Http\Controllers\Admin\MessagingController::class, 'showApi']);
    Route::post('/messaging/{conversation}/messages', [App\Http\Controllers\Admin\MessagingController::class, 'sendMessage']);
    Route::post('/messaging/{conversation}/assign', [App\Http\Controllers\Admin\MessagingController::class, 'assign']);
    Route::patch('/messaging/{conversation}/status', [App\Http\Controllers\Admin\MessagingController::class, 'updateStatus']);
    Route::patch('/messaging/{conversation}/priority', [App\Http\Controllers\Admin\MessagingController::class, 'updatePriority']);
    Route::get('/messaging/stats', [App\Http\Controllers\Admin\MessagingController::class, 'stats']);
});

// Admin Notification API Routes
Route::prefix('api/admin')->middleware(['web', 'auth', 'role:super_admin'])->group(function () {
    Route::get('/notifications', [AdminNotificationController::class, 'index']);
    Route::post('/notifications', [AdminNotificationController::class, 'store']);
    Route::post('/notifications/dispatch', [AdminNotificationController::class, 'dispatch']);
    Route::get('/notifications/users', [AdminNotificationController::class, 'getUsers']);
    Route::get('/notifications/stats', [AdminNotificationController::class, 'getStats']);
    Route::delete('/notifications/bulk-delete', [AdminNotificationController::class, 'bulkDelete']);
    Route::get('/notifications/{notification}', [AdminNotificationController::class, 'show']);
    Route::put('/notifications/{notification}', [AdminNotificationController::class, 'update']);
    Route::delete('/notifications/{notification}', [AdminNotificationController::class, 'destroy']);
    
    // Product API endpoint (for fetching single product in off-canvas)
    Route::get('/products/{id}', [App\Http\Controllers\Admin\ProductManagementController::class, 'show'])->name('admin.products.show');
    
    // Store API endpoint (for fetching single store in off-canvas)
    Route::get('/stores/{id}', [App\Http\Controllers\Admin\StoreManagementController::class, 'show'])->name('admin.stores.show');
    
    // Category API endpoint (for fetching single category in off-canvas)
    Route::get('/categories/{id}', [App\Http\Controllers\Admin\CategoryManagementController::class, 'show'])->name('admin.categories.show');
    
    // System Settings API
    Route::post('/system-settings', [App\Http\Controllers\Admin\SystemSettingsController::class, 'update'])->name('admin.system-settings.update');
    Route::get('/system-settings', [App\Http\Controllers\Admin\SystemSettingsController::class, 'getSettings'])->name('admin.system-settings.api');
});

// Customer Messaging API Routes (for FloatingSupportIcon)
Route::prefix('api/customer')->middleware(['web', 'auth', 'role:customer'])->group(function () {
    Route::get('/messaging', [App\Http\Controllers\Customer\MessagingController::class, 'apiIndex'])->name('messaging.api');
    Route::get('/messaging/{conversation}/messages', [App\Http\Controllers\Customer\MessagingController::class, 'apiMessages'])->name('messaging.messages.api');
    Route::post('/messaging', [App\Http\Controllers\Customer\MessagingController::class, 'store'])->name('messaging.store');
    Route::post('/messaging/{conversation}/messages', [App\Http\Controllers\Customer\MessagingController::class, 'sendMessage'])->name('messaging.send');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
