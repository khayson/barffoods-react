<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Store;
use App\Models\Category;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductManagementController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }
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

        // Per page (allow user to choose: 10, 20, 50, 100)
        $perPage = $request->get('per_page', 20);
        $allowedPerPage = [10, 20, 50, 100];
        if (!in_array($perPage, $allowedPerPage)) {
            $perPage = 20; // Default fallback
        }

        $products = $query->paginate($perPage);

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
                'per_page' => $perPage,
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
            'image_file' => 'nullable|image|max:5120', // 5MB max
            'images' => 'nullable|array|max:4',
            'images.*' => 'nullable|string',
            'image_files' => 'nullable|array|max:4',
            'image_files.*' => 'nullable|image|max:5120',
            'category_id' => 'required|exists:categories,id',
            'store_id' => 'required|exists:stores,id',
            'stock_quantity' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'weight' => 'nullable|numeric|min:0',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
        ]);

        // Handle primary image upload
        if ($request->hasFile('image_file')) {
            try {
                $validated['image'] = $this->fileUploadService->uploadImage(
                    $request->file('image_file'),
                    'products'
                );
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload image: ' . $e->getMessage(),
                ], 422);
            }
        }

        // Handle multiple image uploads
        if ($request->hasFile('image_files')) {
            $uploadedImages = [];
            foreach ($request->file('image_files') as $imageFile) {
                try {
                    $uploadedImages[] = $this->fileUploadService->uploadImage(
                        $imageFile,
                        'products'
                    );
                } catch (\Exception $e) {
                    // Clean up already uploaded images
                    foreach ($uploadedImages as $uploadedImage) {
                        Storage::disk('public')->delete($uploadedImage);
                    }
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload images: ' . $e->getMessage(),
                    ], 422);
                }
            }
            $validated['images'] = $uploadedImages;
        }

        // Always set the primary image to the first image in the array if array exists
        if (!empty($validated['images']) && count($validated['images']) > 0 && empty($validated['image'])) {
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
            'image_file' => 'nullable|image|max:5120',
            'images' => 'nullable|array|max:4',
            'images.*' => 'nullable|string',
            'image_files' => 'nullable|array|max:4',
            'image_files.*' => 'nullable|image|max:5120',
            'category_id' => 'required|exists:categories,id',
            'store_id' => 'required|exists:stores,id',
            'stock_quantity' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'weight' => 'nullable|numeric|min:0',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
        ]);

        // Handle primary image upload
        if ($request->hasFile('image_file')) {
            try {
                // Delete old image
                if ($product->image && Storage::disk('public')->exists($product->image)) {
                    Storage::disk('public')->delete($product->image);
                }

                $validated['image'] = $this->fileUploadService->uploadImage(
                    $request->file('image_file'),
                    'products'
                );
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload image: ' . $e->getMessage(),
                ], 422);
            }
        }

        // Handle multiple image uploads
        if ($request->hasFile('image_files')) {
            // Delete old images
            if ($product->images) {
                foreach ($product->images as $oldImage) {
                    if (Storage::disk('public')->exists($oldImage)) {
                        Storage::disk('public')->delete($oldImage);
                    }
                }
            }

            $uploadedImages = [];
            foreach ($request->file('image_files') as $imageFile) {
                try {
                    $uploadedImages[] = $this->fileUploadService->uploadImage(
                        $imageFile,
                        'products'
                    );
                } catch (\Exception $e) {
                    // Clean up already uploaded images
                    foreach ($uploadedImages as $uploadedImage) {
                        Storage::disk('public')->delete($uploadedImage);
                    }
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload images: ' . $e->getMessage(),
                    ], 422);
                }
            }
            $validated['images'] = $uploadedImages;
        }

        // Always set the primary image to the first image in the array if array exists
        if (!empty($validated['images']) && count($validated['images']) > 0 && empty($validated['image'])) {
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
     * Estimate product dimensions using AI/rules
     */
    public function estimateDimensions(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'category' => 'nullable|string',
            'weight' => 'nullable|numeric',
            'description' => 'nullable|string',
        ]);

        try {
            $estimationService = app(\App\Services\DimensionEstimationService::class);
            $result = $estimationService->estimate([
                'name' => $request->input('name'),
                'category' => $request->input('category'),
                'weight' => $request->input('weight'),
                'description' => $request->input('description'),
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to estimate dimensions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate product description using AI
     */
    public function generateDescription(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'category' => 'nullable|string',
            'weight' => 'nullable|numeric',
            'description' => 'nullable|string',
        ]);

        try {
            $estimationService = app(\App\Services\DimensionEstimationService::class);
            $result = $estimationService->generateDescription([
                'name' => $request->input('name'),
                'category' => $request->input('category'),
                'weight' => $request->input('weight'),
                'description' => $request->input('description'),
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate description: ' . $e->getMessage(),
            ], 500);
        }
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

    /**
     * Duplicate product to another store
     */
    public function duplicate(Request $request, $id)
    {
        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
        ]);

        $originalProduct = Product::findOrFail($id);
        $targetStore = Store::findOrFail($validated['store_id']);

        // Check if the target store already has the original product (without "(Copy)")
        $existingOriginal = Product::where('store_id', $validated['store_id'])
            ->where('name', $originalProduct->name)
            ->first();

        if ($existingOriginal) {
            return response()->json([
                'success' => false,
                'message' => "Cannot duplicate: {$targetStore->name} already has '{$originalProduct->name}'",
                'store_name' => $targetStore->name,
                'product_name' => $originalProduct->name,
            ], 422);
        }

        // Generate the new product name with (Copy) suffix
        $newProductName = $originalProduct->name . ' (Copy)';
        
        // Check if a product with "(Copy)" suffix already exists in target store
        $existingCopy = Product::where('store_id', $validated['store_id'])
            ->where('name', $newProductName)
            ->first();

        if ($existingCopy) {
            return response()->json([
                'success' => false,
                'message' => "A product named '{$newProductName}' already exists in {$targetStore->name}. Please rename the existing duplicate first.",
            ], 422);
        }

        // Clone product data
        $newProduct = $originalProduct->replicate();
        $newProduct->store_id = $validated['store_id'];
        $newProduct->name = $newProductName; // Already calculated above
        $newProduct->is_active = false; // Set to inactive - admin must review and activate
        $newProduct->save();

        return response()->json([
            'success' => true,
            'message' => "Product duplicated to {$targetStore->name} successfully!",
            'note' => 'The duplicated product is set to INACTIVE. Please review and adjust price/stock before activating.',
            'product' => [
                'id' => $newProduct->id,
                'name' => $newProduct->name,
                'store' => [
                    'id' => $targetStore->id,
                    'name' => $targetStore->name,
                ],
            ],
        ]);
    }
}
