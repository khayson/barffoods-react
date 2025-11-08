<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AddressValidationController;
use App\Http\Controllers\CartItemController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware(['auth:sanctum', 'throttle:api'])->get('/user', function (Request $request) {
    return $request->user();
});

// Address suggestions (no auth required, no CSRF, guest rate limit)
Route::middleware('throttle:guest')->post('/address/suggestions', [AddressValidationController::class, 'getSuggestions'])->name('api.address.suggestions');

// Shipping methods (no auth required, no CSRF, guest rate limit)
Route::middleware('throttle:guest')->post('/shipping/methods', [App\Http\Controllers\ShippingController::class, 'getMethods'])->name('api.shipping.methods');

// Cart API routes with Sanctum authentication (no CSRF required)
Route::middleware(['auth:sanctum', 'throttle:authenticated'])->group(function () {
    Route::get('/cart', [CartItemController::class, 'index'])->name('api.cart.index');
    Route::post('/cart', [CartItemController::class, 'store'])->name('api.cart.store');
    Route::put('/cart/{id}', [CartItemController::class, 'update'])->name('api.cart.update');
    Route::delete('/cart/{id}', [CartItemController::class, 'destroy'])->name('api.cart.destroy');
    Route::delete('/cart', [CartItemController::class, 'clear'])->name('api.cart.clear');
    Route::get('/cart/calculations', [CartItemController::class, 'getCalculations'])->name('api.cart.calculations');
});

// Anonymous cart routes moved to web.php for session support

// Payment routes (stricter rate limiting for payment operations)
Route::middleware(['auth:sanctum', 'throttle:payment'])->group(function () {
    Route::post('/payments/create-intent', [App\Http\Controllers\PaymentTransactionController::class, 'createPaymentIntent'])->name('api.payments.create-intent');
    Route::post('/payments/confirm', [App\Http\Controllers\PaymentTransactionController::class, 'confirmPayment'])->name('api.payments.confirm');
    Route::post('/payments/process', [App\Http\Controllers\PaymentTransactionController::class, 'processPayment'])->name('api.payments.process');
    Route::get('/payments/status', [App\Http\Controllers\PaymentTransactionController::class, 'getPaymentStatus'])->name('api.payments.status');
    Route::post('/payments/refund', [App\Http\Controllers\PaymentTransactionController::class, 'refundPayment'])->name('api.payments.refund');
    Route::get('/payments/publishable-key', [App\Http\Controllers\PaymentTransactionController::class, 'getPublishableKey'])->name('api.payments.publishable-key');
});

// Webhook routes (no auth required, webhook rate limiting)
Route::middleware('throttle:webhook')->group(function () {
    // Stripe webhook route
    Route::post('/stripe/webhook', [App\Http\Controllers\StripeWebhookController::class, 'handle'])->name('api.stripe.webhook');
    
    // EasyPost webhook route
    Route::post('/webhooks/easypost', [App\Http\Controllers\Webhooks\EasyPostWebhookController::class, 'handle'])->name('api.webhooks.easypost');
    
    // EasyPost webhook test route (development only)
    Route::post('/webhooks/easypost/test', [App\Http\Controllers\Webhooks\EasyPostWebhookController::class, 'test'])->name('api.webhooks.easypost.test');
});