<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreManagementController extends Controller
{
    /**
     * Display a listing of stores for admin
     */
    public function index(Request $request)
    {
        $query = Store::withCount('products');

        // Search
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $stores = $query->paginate(20);

        return Inertia::render('admin/stores', [
            'stores' => [
                'data' => $stores->items(),
                'current_page' => $stores->currentPage(),
                'last_page' => $stores->lastPage(),
                'per_page' => $stores->perPage(),
                'total' => $stores->total(),
            ],
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Display the specified store (API endpoint for off-canvas)
     */
    public function show($id)
    {
        $store = Store::withCount('products')->findOrFail($id);

        return response()->json($store);
    }

    /**
     * Store a newly created store in storage
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'delivery_radius' => 'nullable|integer|min:1',
            'min_order_amount' => 'nullable|numeric|min:0',
            'delivery_fee' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Set defaults for optional fields
        $validated['address'] = $validated['address'] ?? '';
        $validated['phone'] = $validated['phone'] ?? '';
        $validated['delivery_radius'] = $validated['delivery_radius'] ?? 25;
        $validated['min_order_amount'] = $validated['min_order_amount'] ?? 25.00;
        $validated['delivery_fee'] = $validated['delivery_fee'] ?? 5.99;
        $validated['latitude'] = $validated['latitude'] ?? 0;
        $validated['longitude'] = $validated['longitude'] ?? 0;

        $store = Store::create($validated);

        return redirect()->route('admin.stores')->with('success', 'Store created successfully!');
    }

    /**
     * Update the specified store in storage
     */
    public function update(Request $request, $id)
    {
        $store = Store::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'delivery_radius' => 'nullable|integer|min:1',
            'min_order_amount' => 'nullable|numeric|min:0',
            'delivery_fee' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Set defaults for optional fields if not provided
        $validated['address'] = $validated['address'] ?? $store->address ?? '';
        $validated['phone'] = $validated['phone'] ?? $store->phone ?? '';
        $validated['delivery_radius'] = $validated['delivery_radius'] ?? $store->delivery_radius ?? 25;
        $validated['min_order_amount'] = $validated['min_order_amount'] ?? $store->min_order_amount ?? 25.00;
        $validated['delivery_fee'] = $validated['delivery_fee'] ?? $store->delivery_fee ?? 5.99;
        $validated['latitude'] = $validated['latitude'] ?? $store->latitude ?? 0;
        $validated['longitude'] = $validated['longitude'] ?? $store->longitude ?? 0;

        $store->update($validated);

        return redirect()->route('admin.stores')->with('success', 'Store updated successfully!');
    }

    /**
     * Remove the specified store from storage
     */
    public function destroy($id)
    {
        $store = Store::findOrFail($id);
        
        // Check if store has products
        if ($store->products()->count() > 0) {
            return back()->withErrors([
                'delete' => 'Cannot delete store with existing products. Please reassign or delete products first.'
            ]);
        }

        $store->delete();

        return redirect()->route('admin.stores')->with('success', 'Store deleted successfully!');
    }

    /**
     * Toggle store active status
     */
    public function toggleStatus($id)
    {
        $store = Store::findOrFail($id);
        $store->is_active = !$store->is_active;
        $store->save();

        return back()->with('success', 'Store status updated successfully!');
    }
}

