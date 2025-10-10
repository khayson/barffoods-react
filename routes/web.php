<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminNotificationController;
use App\Http\Controllers\Admin\MessagingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Customer routes (default authenticated users)
Route::middleware(['auth', 'role:customer'])->group(function () {
    Route::get('/dashboard', [CustomerController::class, 'dashboard'])->name('customer.dashboard');
    // Add other customer routes here
});

// Admin routes
Route::prefix('admin')->name('admin.')->middleware(['auth', 'role:super_admin'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/notifications', [AdminController::class, 'notifications'])->name('notifications');
    
    // Messaging routes
    Route::get('/messaging', [MessagingController::class, 'index'])->name('messaging');
    Route::get('/messaging/{conversation}', [MessagingController::class, 'show'])->name('messaging.conversation');
    
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
