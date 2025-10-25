<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Store;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductManagementController extends Controller
{
    /**
     * Display a listing of products for admin
     */
    public function index(Request $request)
    {
        $query = Product::with(['category', 'store']);

        // Search
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->has('category_id') && $request->category_id != '') {
            $query->where('category_id', $request->category_id);
        }

        // Filter by store
        if ($request->has('store_id') && $request->store_id != '') {
            $query->where('store_id', $request->store_id);
        }

        // Filter by status
        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Filter by stock
        if ($request->has('stock_status')) {
            if ($request->stock_status === 'in_stock') {
                $query->where('stock_quantity', '>', 0);
            } elseif ($request->stock_status === 'low_stock') {
                $query->where('stock_quantity', '>', 0)
                      ->where('stock_quantity', '<', 10);
            } elseif ($request->stock_status === 'out_of_stock') {
                $query->where('stock_quantity', 0);
            }
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $products = $query->paginate(20);

        // Get categories and stores for filters
        $categories = Category::orderBy('name')->get();
        $stores = Store::orderBy('name')->get();

        return Inertia::render('admin/products', [
            'products' => [
                'data' => $products->items(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
            'categories' => $categories->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                ];
            }),
            'stores' => $stores->map(function ($store) {
                return [
                    'id' => $store->id,
                    'name' => $store->name,
                ];
            }),
            'filters' => [
                'search' => $request->search,
                'category_id' => $request->category_id,
                'store_id' => $request->store_id,
                'status' => $request->status,
                'stock_status' => $request->stock_status,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Get single product data (API)
     */
    public function show($id)
    {
        $product = Product::with(['category', 'store'])->findOrFail($id);

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'original_price' => $product->original_price,
                'image' => $product->image,
                'images' => $product->images ?? [],
                'category_id' => $product->category_id,
                'store_id' => $product->store_id,
                'stock_quantity' => $product->stock_quantity,
                'is_active' => $product->is_active,
                'average_rating' => $product->average_rating,
                'review_count' => $product->review_count,
                'weight' => $product->weight,
                'length' => $product->length,
                'width' => $product->width,
                'height' => $product->height,
                'created_at' => $product->created_at->toISOString(),
                'updated_at' => $product->updated_at->toISOString(),
            ],
        ]);
    }

    /**
     * Store a newly created product
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'image' => 'nullable|string',
            'images' => 'nullable|array|max:4',
            'images.*' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'store_id' => 'required|exists:stores,id',
            'stock_quantity' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'weight' => 'nullable|numeric|min:0',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
        ]);

        // Always set the primary image to the first image in the array if array exists
        if (!empty($validated['images']) && count($validated['images']) > 0) {
            $validated['image'] = $validated['images'][0];
        }

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'original_price' => $product->original_price,
                'image' => $product->image,
                'category_id' => $product->category_id,
                'store_id' => $product->store_id,
                'stock_quantity' => $product->stock_quantity,
                'is_active' => $product->is_active,
            ],
        ]);
    }

    /**
     * Update the specified product
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'image' => 'nullable|string',
            'images' => 'nullable|array|max:4',
            'images.*' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'store_id' => 'required|exists:stores,id',
            'stock_quantity' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'weight' => 'nullable|numeric|min:0',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
        ]);

        // Always set the primary image to the first image in the array if array exists
        if (!empty($validated['images']) && count($validated['images']) > 0) {
            $validated['image'] = $validated['images'][0];
        }

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'original_price' => $product->original_price,
                'image' => $product->image,
                'category_id' => $product->category_id,
                'store_id' => $product->store_id,
                'stock_quantity' => $product->stock_quantity,
                'is_active' => $product->is_active,
            ],
        ]);
    }

    /**
     * Remove the specified product
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        
        // Check if product has orders
        if ($product->orderItems()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete product with existing orders. Consider deactivating instead.',
            ], 422);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }

    /**
     * Toggle product active status
     */
    public function toggleStatus($id)
    {
        $product = Product::findOrFail($id);
        $product->is_active = !$product->is_active;
        $product->save();

        return response()->json([
            'success' => true,
            'message' => 'Product status updated successfully',
            'is_active' => $product->is_active,
        ]);
    }

    /**
     * Upload product image
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
        ]);

        try {
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                
                // Store in public disk under 'products' folder
                $path = $image->storeAs('products', $filename, 'public');
                
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
