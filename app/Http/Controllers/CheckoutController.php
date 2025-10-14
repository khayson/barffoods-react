<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentTransaction;
use App\Models\CartItem;
use App\Models\AnonymousCart;
use App\Models\UserAddress;
use App\Services\CartCalculationService;
use App\Services\DiscountService;
use App\Services\AddressService;
use App\Services\StripeService;
use App\Jobs\ProcessStripePaymentJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    protected $cartCalculationService;
    protected $discountService;
    protected $addressService;
    protected $stripeService;

    public function __construct(CartCalculationService $cartCalculationService, DiscountService $discountService, AddressService $addressService, StripeService $stripeService)
    {
        $this->cartCalculationService = $cartCalculationService;
        $this->discountService = $discountService;
        $this->addressService = $addressService;
        $this->stripeService = $stripeService;
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
            'discount_code' => 'nullable|string|max:50',
            'save_address' => 'boolean',
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
            session([
                'checkout_data' => [
                    'address_data' => $addressData,
                    'user_address_id' => $userAddress ? $userAddress->id : null,
                    'cart_items' => $cartItems->toArray(),
                    'calculations' => $calculations,
                    'shipping_method' => $request->shipping_method,
                    'discount_code' => $request->discount_code,
                ]
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

            // Store checkout data in session for later use (instead of metadata)
            session([
                'checkout_data' => [
                    'address_data' => $addressData,
                    'user_address_id' => $userAddress ? $userAddress->id : null,
                    'cart_items' => $cartItems,
                    'calculations' => $calculations,
                    'shipping_method' => $request->shipping_method,
                    'discount_code' => $request->discount_code,
                ]
            ]);

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
                'customer_email' => $session->customer_email,
            ]);
            
            if ($session->payment_status !== 'paid') {
                \Log::error('Payment not completed', [
                    'session_id' => $sessionId,
                    'payment_status' => $session->payment_status,
                ]);
                return redirect('/checkout')->with('error', 'Payment not completed');
            }

            // Get checkout data from session
            $checkoutData = session('checkout_data');
            
            if (!$checkoutData) {
                return redirect('/checkout')->with('error', 'Checkout data not found');
            }

            DB::beginTransaction();

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
                'is_ready_for_delivery' => false,
            ]);

            // Create order items for all cart items
            foreach ($checkoutData['cart_items'] as $cartItem) {
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
                'transaction_id' => $session->payment_intent,
                'status' => 'completed',
            ]);

            // Create initial status history
            \App\Models\OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'confirmed',
                'notes' => 'Order confirmed after successful payment',
            ]);

            // Clear cart
            CartItem::where('user_id', Auth::id())->delete();

            // Clear checkout session data
            session()->forget('checkout_data');

            DB::commit();

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
            \Log::error('Checkout success error', [
                'error' => $e->getMessage(),
                'session_id' => $sessionId,
                'user_id' => Auth::id(),
            ]);
            
            return redirect('/checkout')->with('error', 'Failed to process order: ' . $e->getMessage());
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

        DB::beginTransaction();

        try {
            // Verify payment intent with Stripe
            $paymentResult = $this->stripeService->getPaymentIntent($request->payment_intent_id);
            
            if (!$paymentResult['success'] || $paymentResult['status'] !== 'succeeded') {
                return response()->json(['error' => 'Payment not completed'], 400);
            }

            // Get checkout data from session
            $checkoutData = session('checkout_data');
            if (!$checkoutData) {
                return response()->json(['error' => 'Checkout session expired'], 400);
            }

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
                'is_ready_for_delivery' => false,
            ]);

            // Create order items for all cart items
            foreach ($cartItems as $cartItem) {
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

            // Clear cart
            CartItem::where('user_id', Auth::id())->delete();

            // Clear checkout session data
            session()->forget('checkout_data');

            DB::commit();

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
