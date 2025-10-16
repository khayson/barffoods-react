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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Address suggestions (no auth required, no CSRF)
Route::post('/address/suggestions', [AddressValidationController::class, 'getSuggestions'])->name('api.address.suggestions');

// Shipping methods (no auth required, no CSRF)
Route::post('/shipping/methods', [App\Http\Controllers\ShippingController::class, 'getMethods'])->name('api.shipping.methods');

// Cart API routes with Sanctum authentication (no CSRF required)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/cart', [CartItemController::class, 'index'])->name('api.cart.index');
    Route::post('/cart', [CartItemController::class, 'store'])->name('api.cart.store');
    Route::put('/cart/{id}', [CartItemController::class, 'update'])->name('api.cart.update');
    Route::delete('/cart/{id}', [CartItemController::class, 'destroy'])->name('api.cart.destroy');
    Route::delete('/cart', [CartItemController::class, 'clear'])->name('api.cart.clear');
    Route::get('/cart/calculations', [CartItemController::class, 'getCalculations'])->name('api.cart.calculations');
});

// Anonymous cart routes moved to web.php for session support

// Payment routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/payments/create-intent', [App\Http\Controllers\PaymentTransactionController::class, 'createPaymentIntent'])->name('api.payments.create-intent');
    Route::post('/payments/confirm', [App\Http\Controllers\PaymentTransactionController::class, 'confirmPayment'])->name('api.payments.confirm');
    Route::post('/payments/process', [App\Http\Controllers\PaymentTransactionController::class, 'processPayment'])->name('api.payments.process');
    Route::get('/payments/status', [App\Http\Controllers\PaymentTransactionController::class, 'getPaymentStatus'])->name('api.payments.status');
    Route::post('/payments/refund', [App\Http\Controllers\PaymentTransactionController::class, 'refundPayment'])->name('api.payments.refund');
    Route::get('/payments/publishable-key', [App\Http\Controllers\PaymentTransactionController::class, 'getPublishableKey'])->name('api.payments.publishable-key');
});

// Stripe webhook route (no auth required)
Route::post('/stripe/webhook', [App\Http\Controllers\StripeWebhookController::class, 'handle'])->name('api.stripe.webhook');

// EasyPost webhook route (no auth required)
Route::post('/webhooks/easypost', [App\Http\Controllers\Webhooks\EasyPostWebhookController::class, 'handle'])->name('api.webhooks.easypost');

// EasyPost webhook test route (development only)
Route::post('/webhooks/easypost/test', [App\Http\Controllers\Webhooks\EasyPostWebhookController::class, 'test'])->name('api.webhooks.easypost.test');