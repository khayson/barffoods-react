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
