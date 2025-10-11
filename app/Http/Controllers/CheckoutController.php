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

    public function __construct(CartCalculationService $cartCalculationService, DiscountService $discountService, AddressService $addressService)
    {
        $this->cartCalculationService = $cartCalculationService;
        $this->discountService = $discountService;
        $this->addressService = $addressService;
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
     * Process checkout
     */
    public function store(Request $request)
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
        ]);

        DB::beginTransaction();

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

            // Create or update user address using AddressService
            $addressData = [
                'user_id' => Auth::id(),
                'type' => $request->type ?? 'home',
                'label' => $request->label ?? 'Checkout Address',
                'street_address' => $request->street_address,
                'city' => $request->city,
                'state' => $request->state,
                'zip_code' => $request->zip_code,
                'delivery_instructions' => $request->delivery_instructions,
                'is_default' => !UserAddress::where('user_id', Auth::id())->where('is_default', true)->exists(),
                'is_active' => true,
            ];

            $userAddress = $this->addressService->createAddress($addressData);

            // Create order
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => Auth::id(),
                'store_id' => $cartItems->first()->product->store_id,
                'user_address_id' => $userAddress->id,
                'status' => 'pending',
                'total_amount' => $calculations['total'],
                'delivery_address' => $request->delivery_address,
                'delivery_fee' => $calculations['delivery_fee'],
                'delivery_time_estimate' => 30, // Default 30 minutes
            ]);

            // Create order items
            foreach ($cartItems as $cartItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem->product_id,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $cartItem->product->price,
                    'total_price' => $cartItem->quantity * $cartItem->product->price,
                ]);
            }

            // Create payment transaction
            PaymentTransaction::create([
                'order_id' => $order->id,
                'amount' => $calculations['total'],
                'payment_method' => $request->payment_method,
                'status' => 'pending',
            ]);

            // Clear cart
            CartItem::where('user_id', Auth::id())->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'message' => 'Order placed successfully!'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to process order: ' . $e->getMessage()], 500);
        }
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
