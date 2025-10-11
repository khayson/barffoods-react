<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\ShippingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ShippingController extends Controller
{
    protected $shippingService;

    public function __construct(ShippingService $shippingService)
    {
        $this->shippingService = $shippingService;
    }

    /**
     * Get shipping rates for an order
     */
    public function getRates(Request $request, Order $order): JsonResponse
    {
        $rates = $this->shippingService->calculateShippingRates($order);

        return response()->json($rates);
    }

    /**
     * Create shipping label for an order
     */
    public function createLabel(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'rate_id' => 'required|string',
        ]);

        $result = $this->shippingService->createShippingLabel($order, $request->rate_id);

        return response()->json($result);
    }

    /**
     * Track shipment
     */
    public function track(Request $request): JsonResponse
    {
        $request->validate([
            'tracking_code' => 'required|string',
        ]);

        $result = $this->shippingService->trackShipment($request->tracking_code);

        return response()->json($result);
    }

    /**
     * Get available shipping methods
     */
    public function getMethods(): JsonResponse
    {
        $methods = $this->shippingService->getAvailableShippingMethods();

        return response()->json([
            'success' => true,
            'methods' => $methods,
        ]);
    }
}
