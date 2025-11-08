<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentTransaction;
use App\Models\CartItem;
use App\Models\AnonymousCart;
use App\Models\UserAddress;
use App\Models\PaymentIdempotency;
use App\Services\CartCalculationService;
use App\Services\DiscountService;
use App\Services\AddressService;
use App\Services\StripeService;
use App\Services\ShippingService;
use App\Services\InventoryService;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Jobs\ProcessStripePaymentJob;
use App\Jobs\ProcessRefundJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    protected $cartCalculationService;
    protected $discountService;
    protected $addressService;
    protected $stripeService;
    protected $inventoryService;
    protected $auditService;
    protected $notificationService;

    public function __construct(
        CartCalculationService $cartCalculationService,
        DiscountService $discountService,
        AddressService $addressService,
        StripeService $stripeService,
        InventoryService $inventoryService,
        AuditService $auditService,
        NotificationService $notificationService
    ) {
        $this->cartCalculationService = $cartCalculationService;
        $this->discountService = $discountService;
        $this->addressService = $addressService;
        $this->stripeService = $stripeService;
        $this->inventoryService = $inventoryService;
        $this->auditService = $auditService;
        $this->notificationService = $notificationService;
    }

    /**
     * Show checkout page
     */
    public function index()
    {
        if (!Auth::check()) {
            return redirect()->route('login')->with('error', 'Please log in to proceed with checkout.');
        }

        if (Auth::check()) {
            $cartItems = $this->getAuthenticatedUserCartItems();
        } else {
            $cartItems = $this->getAnonymousCartItems();
        }

        if ($cartItems->isEmpty()) {
            return redirect()->route('cart.show')->with('error', 'Your cart is empty.');
        }

        // Calculate totals
        $calculations = $this->cartCalculationService->calculateCartTotals(
            $cartItems->toArray(), 
            Auth::id()
        );

        // Get available payment methods
        $availablePaymentMethods = $this->cartCalculationService->getAvailablePaymentMethods();

        // Get user's saved addresses using AddressService
        $userAddresses = $this->addressService->getUserAddresses(Auth::id());
        $defaultAddress = $this->addressService->getDefaultAddress(Auth::id());

        return Inertia::render('checkout/index', [
            'cartItems' => $cartItems,
            'calculations' => $calculations,
            'availablePaymentMethods' => $availablePaymentMethods,
            'user' => Auth::user(),
            'userAddresses' => $userAddresses,
            'defaultAddress' => $defaultAddress
        ]);
    }

    /**
     * Create Stripe Checkout Session
     */
    public function createCheckoutSession(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $request->validate([
            'type' => 'required|in:home,work,other',
            'label' => 'nullable|string|max:255',
            'street_address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'zip_code' => 'required|string|max:20',
            'delivery_instructions' => 'nullable|string|max:1000',
            'shipping_method' => 'required|string',
            'carrier_id' => 'nullable|string', // EasyPost rate_id
            'carrier_name' => 'nullable|string',
            'carrier_service' => 'nullable|string',
            'carrier_cost' => 'nullable|numeric',
            'discount_code' => 'nullable|string|max:50',
            'save_address' => 'boolean',
        ]);

        // Debug what we're receiving
        \Log::info('CreateCheckoutSession - Received Data', [
            'shipping_method' => $request->shipping_method,
            'carrier_id' => $request->carrier_id,
            'carrier_name' => $request->carrier_name,
            'carrier_service' => $request->carrier_service,
            'carrier_cost' => $request->carrier_cost,
            'all_request_data' => $request->all(),
        ]);

        try {
            // Get cart items
            $cartItems = $this->getAuthenticatedUserCartItems();
            
            if ($cartItems->isEmpty()) {
                return response()->json(['error' => 'Cart is empty'], 400);
            }

            // Calculate totals
            $calculations = $this->cartCalculationService->calculateCartTotals(
                $cartItems->toArray(), 
                Auth::id()
            );

            // Only create address if user wants to save it
            $userAddress = null;
            $addressData = [
                'type' => $request->type ?? 'home',
                'label' => $request->label ?? 'Checkout Address',
                'street_address' => $request->street_address,
                'city' => $request->city,
                'state' => $request->state,
                'zip_code' => $request->zip_code,
                'delivery_instructions' => $request->delivery_instructions,
            ];

            if ($request->save_address) {
                // Create address with full data including user_id and defaults
                $fullAddressData = array_merge($addressData, [
                    'user_id' => Auth::id(),
                    'is_default' => !UserAddress::where('user_id', Auth::id())->where('is_default', true)->exists(),
                    'is_active' => true,
                ]);

                $userAddress = $this->addressService->createAddress($fullAddressData);
            }

            // Store checkout data in session for later use
            $checkoutData = [
                'address_data' => $addressData,
                'user_address_id' => $userAddress ? $userAddress->id : null,
                'cart_items' => $cartItems->toArray(),
                'calculations' => $calculations,
                'shipping_method' => $request->shipping_method,
                'carrier_id' => $request->carrier_id, // EasyPost rate_id
                'carrier_name' => $request->carrier_name,
                'carrier_service' => $request->carrier_service,
                'carrier_cost' => $request->carrier_cost,
                'discount_code' => $request->discount_code,
            ];
            
            session(['checkout_data' => $checkoutData]);
            
            // Debug what we're storing in session
            \Log::info('CreateCheckoutSession - Storing in Session', [
                'shipping_method' => $checkoutData['shipping_method'],
                'carrier_id' => $checkoutData['carrier_id'],
                'carrier_name' => $checkoutData['carrier_name'],
                'carrier_service' => $checkoutData['carrier_service'],
                'carrier_cost' => $checkoutData['carrier_cost'],
            ]);

            // Prepare line items for Stripe Checkout
            $lineItems = [];
            foreach ($cartItems as $cartItem) {
                $lineItems[] = [
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => $cartItem['product']['name'],
                            'description' => $cartItem['product']['description'] ?? '',
                            'images' => $this->getValidImageUrls($cartItem['product']['image']),
                        ],
                        'unit_amount' => $this->convertToCents($cartItem['product']['price']),
                    ],
                    'quantity' => $cartItem['quantity'],
                ];
            }

            // Add delivery fee if applicable
            if ($calculations['delivery_fee'] > 0) {
                $lineItems[] = [
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => 'Delivery Fee',
                        ],
                        'unit_amount' => $this->convertToCents($calculations['delivery_fee']),
                    ],
                    'quantity' => 1,
                ];
            }

            // Add tax if applicable
            if ($calculations['tax'] > 0) {
                $lineItems[] = [
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => 'Tax',
                        ],
                        'unit_amount' => $this->convertToCents($calculations['tax']),
                    ],
                    'quantity' => 1,
                ];
            }

            // Session data already stored above with carrier information

            // Create Stripe Checkout Session with minimal metadata
            $checkoutData = [
                'line_items' => $lineItems,
                'success_url' => url('/checkout/success?session_id={CHECKOUT_SESSION_ID}'),
                'cancel_url' => url('/checkout'),
                'customer_email' => Auth::user()->email,
                'shipping_address' => [
                    'line1' => $request->street_address,
                    'city' => $request->city,
                    'state' => $request->state,
                    'postal_code' => $request->zip_code,
                    'country' => 'US',
                ],
                'metadata' => [
                    'user_id' => Auth::id(),
                    'cart_items_count' => count($cartItems),
                    'session_id' => session()->getId(),
                    'shipping_method' => $request->shipping_method,
                    'carrier_name' => $request->carrier_name,
                    'carrier_service' => $request->carrier_service,
                    'carrier_cost' => $request->carrier_cost,
                    'carrier_id' => $request->carrier_id,
                ],
            ];

            $result = $this->stripeService->createCheckoutSession($checkoutData);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'checkout_url' => $result['url'],
                    'session_id' => $result['session_id'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error'],
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create payment intent: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Handle successful Stripe Checkout redirect
     */
    public function success(Request $request)
    {
        $sessionId = $request->query('session_id');
        
        \Log::info('Checkout success called', [
            'session_id' => $sessionId,
            'user_id' => Auth::id(),
            'has_session_data' => session()->has('checkout_data'),
            'all_query_params' => $request->query(),
            'request_url' => $request->fullUrl(),
        ]);
        
        if (!$sessionId) {
            \Log::error('No session ID provided in checkout success', [
                'query_params' => $request->query(),
                'request_url' => $request->fullUrl(),
            ]);
            return redirect('/checkout')->with('error', 'Invalid checkout session');
        }

        try {
            // Retrieve the checkout session from Stripe
            $session = \Stripe\Checkout\Session::retrieve($sessionId);
            
            \Log::info('Stripe session retrieved', [
                'session_id' => $sessionId,
                'payment_status' => $session->payment_status,
                'payment_intent' => $session->payment_intent,
                'customer_email' => $session->customer_email,
                'amount_total' => $session->amount_total,
            ]);
            
            if ($session->payment_status !== 'paid') {
                \Log::error('Payment not completed', [
                    'session_id' => $sessionId,
                    'payment_status' => $session->payment_status,
                ]);
                return redirect('/checkout')->with('error', 'Payment not completed. Please try again.');
            }

            // Get checkout data from session
            $checkoutData = session('checkout_data');
            
            // If session data is missing, reconstruct from Stripe session and current cart
            if (!$checkoutData) {
                \Log::warning('Session data missing, reconstructing from Stripe and cart', [
                    'session_id' => $sessionId,
                    'user_id' => Auth::id(),
                ]);
                
                // Get current cart items
                $cartItems = CartItem::where('user_id', Auth::id())
                    ->with(['product.store', 'product.category'])
                    ->get();
                
                if ($cartItems->isEmpty()) {
                    \Log::error('Cart is empty during checkout success', [
                        'session_id' => $sessionId,
                        'user_id' => Auth::id(),
                    ]);
                    ProcessRefundJob::dispatch($session->payment_intent, null, 'Cart empty during checkout completion');
                    return redirect('/checkout')->with('error', 'Your cart is empty. Refund will be processed automatically.');
                }
                
                // Get address from Stripe session
                $shippingAddress = $session->shipping_details->address ?? $session->customer_details->address ?? null;
                
                if (!$shippingAddress) {
                    \Log::error('No shipping address in Stripe session', [
                        'session_id' => $sessionId,
                    ]);
                    ProcessRefundJob::dispatch($session->payment_intent, null, 'No shipping address found');
                    return redirect('/checkout')->with('error', 'Shipping address not found. Refund will be processed automatically.');
                }
                
                // Find or create user address
                $userAddress = \App\Models\UserAddress::firstOrCreate([
                    'user_id' => Auth::id(),
                    'street_address' => $shippingAddress->line1,
                    'city' => $shippingAddress->city,
                    'state' => $shippingAddress->state,
                    'zip_code' => $shippingAddress->postal_code,
                ], [
                    'type' => 'home',
                    'label' => 'Checkout Address',
                    'is_default' => false,
                    'is_active' => true,
                ]);
                
                // Recalculate totals
                $calculations = $this->cartCalculationService->calculateCartTotals(
                    $cartItems->toArray(),
                    Auth::id()
                );
                
                // Add delivery fee from Stripe metadata or session
                $deliveryFee = isset($session->metadata['carrier_cost']) 
                    ? floatval($session->metadata['carrier_cost']) 
                    : 0;
                
                $calculations['delivery_fee'] = $deliveryFee;
                $calculations['total'] = $calculations['subtotal'] - $calculations['discount'] + $deliveryFee + $calculations['tax'];
                
                // Reconstruct checkout data
                $checkoutData = [
                    'address_data' => [
                        'street_address' => $shippingAddress->line1,
                        'city' => $shippingAddress->city,
                        'state' => $shippingAddress->state,
                        'zip_code' => $shippingAddress->postal_code,
                    ],
                    'user_address_id' => $userAddress->id,
                    'cart_items' => $cartItems->toArray(),
                    'calculations' => $calculations,
                    'shipping_method' => $session->metadata['shipping_method'] ?? 'shipping',
                    'carrier_id' => $session->metadata['carrier_id'] ?? null,
                    'carrier_name' => $session->metadata['carrier_name'] ?? null,
                    'carrier_service' => $session->metadata['carrier_service'] ?? null,
                    'carrier_cost' => $session->metadata['carrier_cost'] ?? null,
                    'discount_code' => null,
                ];
                
                \Log::info('Successfully reconstructed checkout data', [
                    'cart_items_count' => count($cartItems),
                    'total' => $calculations['total'],
                    'carrier_name' => $checkoutData['carrier_name'],
                ]);
            }

            // Generate idempotency key from session ID
            $idempotencyKey = 'checkout_' . $sessionId;
            
            // Check for duplicate order using idempotency
            $idempotencyRecord = PaymentIdempotency::check($idempotencyKey);
            if ($idempotencyRecord && $idempotencyRecord->status === 'completed') {
                \Log::info('Duplicate order prevented by idempotency', [
                    'idempotency_key' => $idempotencyKey,
                    'existing_order_id' => $idempotencyRecord->order_id,
                ]);

                return redirect('/orders/' . $idempotencyRecord->order_id)->with([
                    'success' => 'Order already processed',
                    'order_confirmed' => true,
                    'order_number' => $idempotencyRecord->order->order_number,
                ]);
            }

            // Create idempotency record
            if (!$idempotencyRecord) {
                $idempotencyRecord = PaymentIdempotency::createOrRetrieve(
                    $idempotencyKey,
                    Auth::id(),
                    ['session_id' => $sessionId, 'payment_intent' => $session->payment_intent]
                );
            }

            // Debug shipping data in session
            \Log::info('Checkout Success - Shipping Data', [
                'shipping_method' => $checkoutData['shipping_method'] ?? 'NOT_SET',
                'carrier_name' => $checkoutData['carrier_name'] ?? 'NOT_SET',
                'carrier_service' => $checkoutData['carrier_service'] ?? 'NOT_SET',
                'carrier_cost' => $checkoutData['carrier_cost'] ?? 'NOT_SET',
                'carrier_id' => $checkoutData['carrier_id'] ?? 'NOT_SET',
            ]);

            DB::beginTransaction();

            // STEP 1: Create order FIRST
            // Temporarily unguard to allow setting protected fields
            $order = Order::unguarded(function () use ($checkoutData) {
                return Order::create([
                    'order_number' => Order::generateOrderNumber(),
                    'user_id' => Auth::id(),
                    'user_address_id' => $checkoutData['user_address_id'],
                    'status' => 'confirmed',
                    'total_amount' => $checkoutData['calculations']['total'],
                    'subtotal' => $checkoutData['calculations']['subtotal'],
                    'tax' => $checkoutData['calculations']['tax'],
                    'delivery_fee' => $checkoutData['calculations']['delivery_fee'],
                    'delivery_address' => $checkoutData['address_data']['street_address'] . ', ' . 
                                         $checkoutData['address_data']['city'] . ', ' . 
                                         $checkoutData['address_data']['state'] . ' ' . 
                                         $checkoutData['address_data']['zip_code'],
                    'shipping_method' => $checkoutData['shipping_method'],
                    'carrier' => $checkoutData['carrier_name'] ?? null,
                    'service' => $checkoutData['carrier_service'] ?? null,
                    'shipping_cost' => $checkoutData['carrier_cost'] ?? null,
                    'rate_id' => $checkoutData['carrier_id'] ?? null,
                    'is_ready_for_delivery' => false,
                ]);
            });

            \Log::info('Order created successfully', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ]);

            // STEP 2: Create payment transaction with order_id
            // Temporarily unguard to allow setting protected fields
            $paymentTransaction = PaymentTransaction::unguarded(function () use ($checkoutData, $session, $sessionId, $idempotencyKey, $order) {
                return PaymentTransaction::create([
                    'order_id' => $order->id,
                    'amount' => $checkoutData['calculations']['total'],
                    'payment_method' => 'stripe',
                    'transaction_id' => $session->payment_intent,
                    'status' => 'completed',
                    'metadata' => json_encode([
                        'session_id' => $sessionId,
                        'user_id' => Auth::id(),
                        'idempotency_key' => $idempotencyKey,
                    ]),
                ]);
            });

            \Log::info('Payment transaction record created', [
                'transaction_id' => $paymentTransaction->id,
                'payment_intent' => $session->payment_intent,
                'amount' => $paymentTransaction->amount,
                'order_id' => $order->id,
            ]);

            // STEP 3: Create order items and decrement inventory
            foreach ($checkoutData['cart_items'] as $cartItem) {
                // Decrement stock using InventoryService (with pessimistic locking)
                $this->inventoryService->decrementStock(
                    $cartItem['product']['id'],
                    $cartItem['quantity']
                );

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem['product']['id'],
                    'store_id' => $cartItem['product']['store_id'], // Store is now on order items
                    'quantity' => $cartItem['quantity'],
                    'unit_price' => $cartItem['product']['price'],
                    'total_price' => $cartItem['quantity'] * $cartItem['product']['price'],
                ]);
            }

            // Create initial status history
            \App\Models\OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'confirmed',
                'notes' => 'Order confirmed after successful payment',
            ]);

            // Note: Shipping labels are now created manually by admin via the admin panel
            // This ensures proper control over when labels are generated and reduces costs

            // Log order creation for audit trail
            $this->auditService->log(
                'order_created',
                $order,
                null,
                [
                    'order_number' => $order->order_number,
                    'total_amount' => $order->total_amount,
                    'items_count' => count($checkoutData['cart_items']),
                    'payment_method' => 'stripe',
                ],
                "Order {$order->order_number} created with status confirmed"
            );

            // Mark idempotency as completed
            $idempotencyRecord->update([
                'order_id' => $order->id,
                'payment_intent_id' => $session->payment_intent,
            ]);
            $idempotencyRecord->markCompleted([
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ], $session->payment_intent);

            // Clear cart
            CartItem::where('user_id', Auth::id())->delete();

            // Clear checkout session data
            session()->forget('checkout_data');

            DB::commit();

            // Send order confirmation notification (after commit)
            try {
                $this->notificationService->create(
                    userId: Auth::id(),
                    type: 'order_confirmed',
                    title: 'Order Confirmed',
                    message: "Your order #{$order->order_number} has been confirmed and is being processed.",
                    data: [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'total_amount' => $order->total_amount,
                    ]
                );
            } catch (\Exception $e) {
                // Log notification failure but don't fail the order
                \Log::warning('Failed to send order confirmation notification', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $successMessage = "Order placed successfully! Order #{$order->order_number}";

            \Log::info('Order created successfully, redirecting to order page', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'redirect_url' => '/orders/' . $order->id,
            ]);

            return redirect('/orders/' . $order->id)->with([
                'success' => $successMessage,
                'order_confirmed' => true,
                'order_number' => $order->order_number,
                'toast_message' => $successMessage,
                'toast_type' => 'success'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            
            // Mark idempotency as failed
            if (isset($idempotencyRecord)) {
                $idempotencyRecord->markFailed([
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            // Mark payment transaction as pending_refund if it was created
            if (isset($paymentTransaction)) {
                try {
                    // Update payment transaction status outside of rolled-back transaction
                    DB::connection()->table('payment_transactions')
                        ->where('id', $paymentTransaction->id)
                        ->update([
                            'status' => 'pending_refund',
                            'metadata' => json_encode([
                                'session_id' => $sessionId,
                                'user_id' => Auth::id(),
                                'idempotency_key' => $idempotencyKey,
                                'refund_reason' => 'Order creation failed: ' . $e->getMessage(),
                                'failed_at' => now()->toISOString(),
                            ]),
                            'updated_at' => now(),
                        ]);
                    
                    \Log::info('Payment transaction marked as pending_refund', [
                        'transaction_id' => $paymentTransaction->id,
                        'payment_intent' => $session->payment_intent ?? 'unknown',
                    ]);
                } catch (\Exception $updateError) {
                    \Log::error('Failed to update payment transaction status', [
                        'error' => $updateError->getMessage(),
                        'transaction_id' => $paymentTransaction->id ?? 'unknown',
                    ]);
                }
            }

            // Queue automatic refund for failed order
            if (isset($session) && isset($session->payment_intent)) {
                ProcessRefundJob::dispatch(
                    $session->payment_intent,
                    null,
                    'Order creation failed: ' . $e->getMessage()
                );
                
                \Log::error('Order creation failed - Refund queued', [
                    'payment_intent_id' => $session->payment_intent,
                    'payment_transaction_id' => $paymentTransaction->id ?? null,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'session_id' => $sessionId,
                    'user_id' => Auth::id(),
                ]);
            } else {
                \Log::error('Order creation failed - No payment intent to refund', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'session_id' => $sessionId,
                    'user_id' => Auth::id(),
                ]);
            }
            
            return redirect('/checkout')->with('error', 'Failed to process order: ' . $e->getMessage() . '. A refund will be processed automatically.');
        }
    }

    /**
     * Process checkout after successful payment
     */
    public function store(Request $request)
    {
        \Log::info('Checkout store method called', [
            'payment_intent_id' => $request->payment_intent_id,
            'user_id' => Auth::id(),
            'has_session_data' => session()->has('checkout_data'),
        ]);

        if (!Auth::check()) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        // Generate or retrieve idempotency key
        $idempotencyKey = $request->header('X-Idempotency-Key') ?? Str::uuid()->toString();
        
        // Check for duplicate payment using idempotency
        $idempotencyRecord = PaymentIdempotency::check($idempotencyKey);
        if ($idempotencyRecord && $idempotencyRecord->status === 'completed') {
            \Log::info('Duplicate payment prevented by idempotency', [
                'idempotency_key' => $idempotencyKey,
                'existing_order_id' => $idempotencyRecord->order_id,
            ]);

            return response()->json([
                'success' => true,
                'order_id' => $idempotencyRecord->order_id,
                'order_number' => $idempotencyRecord->order->order_number,
                'message' => 'Order already processed',
                'duplicate' => true,
            ]);
        }

        // Create idempotency record
        if (!$idempotencyRecord) {
            $idempotencyRecord = PaymentIdempotency::createOrRetrieve(
                $idempotencyKey,
                Auth::id(),
                ['payment_intent_id' => $request->payment_intent_id]
            );
        }

        DB::beginTransaction();

        try {
            // Verify payment intent with Stripe
            $paymentResult = $this->stripeService->getPaymentIntent($request->payment_intent_id);
            
            if (!$paymentResult['success'] || $paymentResult['status'] !== 'succeeded') {
                $idempotencyRecord->markFailed(['error' => 'Payment not completed']);
                return response()->json(['error' => 'Payment not completed'], 400);
            }

            // Check payment intent timeout (30 minutes)
            if (isset($paymentResult['created'])) {
                $paymentAge = time() - $paymentResult['created'];
                if ($paymentAge > 1800) { // 30 minutes
                    $idempotencyRecord->markFailed(['error' => 'Payment intent expired']);
                    
                    // Queue refund for expired payment
                    ProcessRefundJob::dispatch($request->payment_intent_id, null, 'Payment timeout - order not completed within 30 minutes');
                    
                    return response()->json(['error' => 'Payment session expired. Refund will be processed automatically.'], 400);
                }
            }

            // Get checkout data from session
            $checkoutData = session('checkout_data');
            if (!$checkoutData) {
                $idempotencyRecord->markFailed(['error' => 'Checkout session expired']);
                
                // Queue refund for session expiry
                ProcessRefundJob::dispatch($request->payment_intent_id, null, 'Checkout session expired');
                
                return response()->json(['error' => 'Checkout session expired. Refund will be processed automatically.'], 400);
            }

            // Log shipping data for debugging
            \Log::info('Checkout Store - Shipping Data', [
                'shipping_method' => $checkoutData['shipping_method'] ?? 'NOT_SET',
                'carrier_name' => $checkoutData['carrier_name'] ?? 'NOT_SET',
                'carrier_service' => $checkoutData['carrier_service'] ?? 'NOT_SET',
                'carrier_cost' => $checkoutData['carrier_cost'] ?? 'NOT_SET',
                'carrier_id' => $checkoutData['carrier_id'] ?? 'NOT_SET',
            ]);

            // Get cart items to verify they still exist
            $cartItems = $this->getAuthenticatedUserCartItems();
            if ($cartItems->isEmpty()) {
                return response()->json(['error' => 'Cart is empty'], 400);
            }

            // Create a single order with all items (simplified structure)
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => Auth::id(),
                'user_address_id' => $checkoutData['user_address_id'],
                'status' => 'confirmed',
                'total_amount' => $checkoutData['calculations']['total'],
                'subtotal' => $checkoutData['calculations']['subtotal'],
                'tax' => $checkoutData['calculations']['tax'],
                'delivery_fee' => $checkoutData['calculations']['delivery_fee'],
                'delivery_address' => $checkoutData['address_data']['street_address'] . ', ' . 
                                     $checkoutData['address_data']['city'] . ', ' . 
                                     $checkoutData['address_data']['state'] . ' ' . 
                                     $checkoutData['address_data']['zip_code'],
                'shipping_method' => $checkoutData['shipping_method'],
                'carrier' => $checkoutData['carrier_name'] ?? null,
                'service' => $checkoutData['carrier_service'] ?? null,
                'shipping_cost' => $checkoutData['carrier_cost'] ?? null,
                'rate_id' => $checkoutData['carrier_id'] ?? null,
                'is_ready_for_delivery' => false,
            ]);

            // Create order items for all cart items and decrement inventory
            foreach ($cartItems as $cartItem) {
                // Decrement stock using InventoryService (with pessimistic locking)
                $this->inventoryService->decrementStock(
                    $cartItem['product']['id'],
                    $cartItem['quantity']
                );

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem['product']['id'],
                    'store_id' => $cartItem['product']['store_id'], // Store is now on order items
                    'quantity' => $cartItem['quantity'],
                    'unit_price' => $cartItem['product']['price'],
                    'total_price' => $cartItem['quantity'] * $cartItem['product']['price'],
                ]);
            }

            // Create payment transaction
            PaymentTransaction::create([
                'order_id' => $order->id,
                'amount' => $checkoutData['calculations']['total'],
                'payment_method' => 'stripe',
                'transaction_id' => $request->payment_intent_id,
                'status' => 'completed',
            ]);

            // Create initial status history
            \App\Models\OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'confirmed',
                'notes' => 'Order confirmed after successful payment',
            ]);

            // Note: Shipping labels are now created manually by admin via the admin panel
            // This ensures proper control over when labels are generated and reduces costs

            // Log order creation for audit trail
            $this->auditService->log(
                'order_created',
                $order,
                null,
                [
                    'order_number' => $order->order_number,
                    'total_amount' => $order->total_amount,
                    'items_count' => $cartItems->count(),
                    'payment_method' => 'stripe',
                ],
                "Order {$order->order_number} created with status confirmed"
            );

            // Mark idempotency as completed
            $idempotencyRecord->update([
                'order_id' => $order->id,
                'payment_intent_id' => $request->payment_intent_id,
            ]);
            $idempotencyRecord->markCompleted([
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ], $request->payment_intent_id);

            // Clear cart
            CartItem::where('user_id', Auth::id())->delete();

            // Clear checkout session data
            session()->forget('checkout_data');

            DB::commit();

            // Send order confirmation notification (after commit)
            try {
                $this->notificationService->create(
                    userId: Auth::id(),
                    type: 'order_confirmed',
                    title: 'Order Confirmed',
                    message: "Your order #{$order->order_number} has been confirmed and is being processed.",
                    data: [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'total_amount' => $order->total_amount,
                    ]
                );
            } catch (\Exception $e) {
                // Log notification failure but don't fail the order
                \Log::warning('Failed to send order confirmation notification', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $successMessage = "Order placed successfully! Order #{$order->order_number}";

            $response = [
                'success' => true,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'message' => $successMessage
            ];

            // Return appropriate response based on request type
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json($response);
            }

            return response()->json($response);

        } catch (\Exception $e) {
            DB::rollback();
            
            // Mark idempotency as failed
            if (isset($idempotencyRecord)) {
                $idempotencyRecord->markFailed([
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            // Queue automatic refund for failed order
            if (isset($request->payment_intent_id)) {
                ProcessRefundJob::dispatch(
                    $request->payment_intent_id,
                    null,
                    'Order creation failed: ' . $e->getMessage()
                );
                
                \Log::info('Refund queued for failed order', [
                    'payment_intent_id' => $request->payment_intent_id,
                    'error' => $e->getMessage(),
                ]);
            }
            
            \Log::error('Checkout store error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payment_intent_id' => $request->payment_intent_id,
                'user_id' => Auth::id(),
            ]);
            return response()->json(['error' => 'Failed to process order: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Convert amount to cents for Stripe
     */
    private function convertToCents(float $amount): int
    {
        return (int) round($amount * 100);
    }

    /**
     * Get valid image URLs for Stripe Checkout
     */
    private function getValidImageUrls($image): array
    {
        // If image is empty or null, return empty array
        if (empty($image)) {
            return [];
        }

        // If image is a valid URL, return it
        if (filter_var($image, FILTER_VALIDATE_URL)) {
            return [$image];
        }

        // If image is an emoji or non-URL string, return empty array
        // Stripe Checkout doesn't support emoji images
        return [];
    }

    /**
     * Get authenticated user's cart items
     */
    private function getAuthenticatedUserCartItems()
    {
        return CartItem::with('product.store', 'product.category')
            ->where('user_id', Auth::id())
            ->get()
            ->map(function ($item) {
                return [
                    'id' => (string) $item->id,
                    'quantity' => $item->quantity,
                    'total_price' => $item->quantity * $item->product->price,
                    'product' => [
                        'id' => (string) $item->product->id,
                        'name' => $item->product->name,
                        'price' => $item->product->price,
                        'image' => $item->product->image,
                        'description' => $item->product->description,
                        'store_id' => $item->product->store_id,
                        'store' => [
                            'id' => (string) $item->product->store->id,
                            'name' => $item->product->store->name,
                        ],
                        'category' => [
                            'id' => (string) $item->product->category->id,
                            'name' => $item->product->category->name,
                        ],
                    ],
                ];
            });
    }

    /**
     * Get anonymous cart items
     */
    private function getAnonymousCartItems()
    {
        $anonymousCart = AnonymousCart::getOrCreateForSession(Session::getId());
        $cartData = $anonymousCart->cart_data ?? [];

        if (empty($cartData)) {
            return collect();
        }

        $productIds = array_column($cartData, 'product_id');
        $products = Product::with('store', 'category')
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        return collect($cartData)->map(function ($item) use ($products) {
            $product = $products->get($item['product_id']);
            if (!$product) {
                return null;
            }

            return [
                'id' => 'anonymous_' . $item['product_id'] . '_' . $item['added_at'],
                'quantity' => $item['quantity'],
                'total_price' => $item['quantity'] * $product->price,
                'product' => [
                    'id' => (string) $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'image' => $product->image,
                    'store' => [
                        'id' => (string) $product->store->id,
                        'name' => $product->store->name,
                    ],
                    'category' => [
                        'id' => (string) $product->category->id,
                        'name' => $product->category->name,
                    ],
                ],
            ];
        })->filter();
    }
}
