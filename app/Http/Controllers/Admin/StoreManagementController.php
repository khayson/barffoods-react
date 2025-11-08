<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class StoreManagementController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }
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

        // Filter by location
        if ($request->has('location')) {
            if ($request->location === 'no_location') {
                $query->where('latitude', 0)->where('longitude', 0);
            } elseif ($request->location === 'has_location') {
                $query->where(function ($q) {
                    $q->where('latitude', '!=', 0)->orWhere('longitude', '!=', 0);
                });
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
                'location' => $request->location,
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
     * Get products for a specific store (API endpoint)
     */
    public function getProducts($id)
    {
        $store = Store::findOrFail($id);
        
        $products = $store->products()
            ->with('category')
            ->orderBy('name')
            ->get();

        return response()->json([
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created store in storage
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|string',
            'image_file' => 'nullable|image|max:5120', // 5MB max
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'delivery_radius' => 'nullable|integer|min:1',
            'min_order_amount' => 'nullable|numeric|min:0',
            'delivery_fee' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Handle image upload
        if ($request->hasFile('image_file')) {
            try {
                $validated['image'] = $this->fileUploadService->uploadImage(
                    $request->file('image_file'),
                    'stores'
                );
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload store image: ' . $e->getMessage(),
                ], 422);
            }
        }

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
            'image' => 'nullable|string',
            'image_file' => 'nullable|image|max:5120', // 5MB max
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'delivery_radius' => 'nullable|integer|min:1',
            'min_order_amount' => 'nullable|numeric|min:0',
            'delivery_fee' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Handle image upload
        if ($request->hasFile('image_file')) {
            try {
                // Delete old image
                if ($store->image && Storage::disk('public')->exists($store->image)) {
                    Storage::disk('public')->delete($store->image);
                }

                $validated['image'] = $this->fileUploadService->uploadImage(
                    $request->file('image_file'),
                    'stores'
                );
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload store image: ' . $e->getMessage(),
                ], 422);
            }
        }

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

    /**
     * Upload store image
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:5120', // 5MB max
        ]);

        try {
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                
                // Store in public disk under 'stores' folder
                $path = $image->storeAs('stores', $filename, 'public');
                
                // Return the public URL
                $url = '/storage/' . $path;

                return response()->json([
                    'success' => true,
                    'message' => 'Image uploaded successfully',
                    'url' => $url,
                    'path' => $path,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No image file provided',
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image: ' . $e->getMessage(),
            ], 500);
        }
    }
}

