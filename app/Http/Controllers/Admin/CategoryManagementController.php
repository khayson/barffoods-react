<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryManagementController extends Controller
{
    /**
     * Display a listing of categories for admin
     */
    public function index(Request $request)
    {
        $query = Category::withCount('products');

        // Search
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
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
        $sortBy = $request->get('sort_by', 'sort_order');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $categories = $query->paginate(20);

        return Inertia::render('admin/categories', [
            'categories' => [
                'data' => $categories->items(),
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
                'per_page' => $categories->perPage(),
                'total' => $categories->total(),
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
     * Display the specified category (API endpoint for off-canvas)
     */
    public function show($id)
    {
        $category = Category::withCount('products')->findOrFail($id);

        return response()->json($category);
    }

    /**
     * Store a newly created category in storage
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'icon' => 'nullable|string|max:10',
            'sort_order' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $category = Category::create($validated);

        return redirect()->route('admin.categories')->with('success', 'Category created successfully!');
    }

    /**
     * Update the specified category in storage
     */
    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $id,
            'icon' => 'nullable|string|max:10',
            'sort_order' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return redirect()->route('admin.categories')->with('success', 'Category updated successfully!');
    }

    /**
     * Remove the specified category from storage
     */
    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        
        // Check if category has products
        if ($category->products()->count() > 0) {
            return back()->withErrors([
                'delete' => 'Cannot delete category with existing products. Please reassign or delete products first.'
            ]);
        }

        $category->delete();

        return redirect()->route('admin.categories')->with('success', 'Category deleted successfully!');
    }

    /**
     * Toggle category active status
     */
    public function toggleStatus($id)
    {
        $category = Category::findOrFail($id);
        $category->is_active = !$category->is_active;
        $category->save();

        return back()->with('success', 'Category status updated successfully!');
    }
}

