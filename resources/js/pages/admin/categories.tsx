import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import CategoryOffCanvas from '@/components/admin/CategoryOffCanvas';
import { 
    Search, Plus, Tag, Package, Eye, Edit, Trash2, Power, MoreVertical, 
    Filter, ChevronLeft, ChevronRight, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Category {
    id: number;
    name: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
    products_count: number;
    created_at: string;
    updated_at: string;
}

interface CategoriesPageProps {
    categories: {
        data: Category[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        sort_by?: string;
        sort_order?: string;
    };
}

export default function CategoriesPage({ categories, filters }: CategoriesPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    // Off-canvas state
    const [offCanvasOpen, setOffCanvasOpen] = useState(false);
    const [offCanvasMode, setOffCanvasMode] = useState<'view' | 'edit' | 'create'>('view');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const handleSearch = () => {
        applyFilters();
    };

    const applyFilters = (page = 1) => {
        const params: Record<string, any> = { page };
        if (searchTerm) params.search = searchTerm;
        if (selectedStatus) params.status = selectedStatus;
        if (filters.sort_by) params.sort_by = filters.sort_by;
        if (filters.sort_order) params.sort_order = filters.sort_order;

        router.get('/admin/categories', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleViewCategory = (categoryId: number) => {
        setSelectedCategoryId(categoryId);
        setOffCanvasMode('view');
        setOffCanvasOpen(true);
    };

    const handleEditCategory = (categoryId: number) => {
        setSelectedCategoryId(categoryId);
        setOffCanvasMode('edit');
        setOffCanvasOpen(true);
    };

    const handleCreateCategory = () => {
        setSelectedCategoryId(null);
        setOffCanvasMode('create');
        setOffCanvasOpen(true);
    };

    const handleToggleStatus = async (categoryId: number) => {
        router.patch(`/admin/categories/${categoryId}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Category status updated successfully!');
            },
            onError: () => {
                toast.error('Failed to update status');
            },
        });
    };

    const handleDelete = (categoryId: number) => {
        if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            return;
        }

        router.delete(`/admin/categories/${categoryId}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                // Check if there's a success flash message
                const successMessage = (page.props as any).flash?.success;
                if (successMessage) {
                    toast.success(successMessage);
                }
            },
            onError: (errors) => {
                // Extract the first error message
                const errorMessage = typeof errors === 'object' && errors !== null 
                    ? Object.values(errors)[0] as string 
                    : 'Failed to delete category';
                toast.error(errorMessage);
            },
        });
    };

    const handlePageChange = (page: number) => {
        applyFilters(page);
    };

    const generatePageNumbers = () => {
        const pages = [];
        const { current_page, last_page } = categories;
        
        if (last_page <= 7) {
            for (let i = 1; i <= last_page; i++) {
                pages.push(i);
            }
        } else {
            if (current_page <= 3) {
                pages.push(1, 2, 3, 4, '...', last_page);
            } else if (current_page >= last_page - 2) {
                pages.push(1, '...', last_page - 3, last_page - 2, last_page - 1, last_page);
            } else {
                pages.push(1, '...', current_page - 1, current_page, current_page + 1, '...', last_page);
            }
        }
        
        return pages;
    };

    const activeFiltersCount = [searchTerm, selectedStatus].filter(Boolean).length;

    return (
        <AdminLayout>
            <Head title="Categories Management" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Stats */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                                <Tag className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    Categories
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Organize your products with categories
                                </p>
                            </div>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateCategory}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Add Category
                    </motion.button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Categories</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {categories.total}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Categories</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {categories.data.filter(c => c.is_active).length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Filters</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {activeFiltersCount}
                                </p>
                            </div>
                            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                <Filter className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search categories by name..."
                                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setTimeout(() => {
                                    applyFilters();
                                }, 100);
                            }}
                            className="px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                        >
                            <option value="">All Categories</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        {/* Search Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSearch}
                            className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Search className="h-5 w-5" />
                            Search
                        </motion.button>
                    </div>

                    {/* Active Filters Badges */}
                    <AnimatePresence>
                        {activeFiltersCount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="flex flex-wrap gap-2 overflow-hidden"
                            >
                                {searchTerm && (
                                    <Badge variant="secondary" className="gap-2">
                                        Search: "{searchTerm}"
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                applyFilters();
                                            }}
                                            className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                
                                {selectedStatus && (
                                    <Badge variant="secondary" className="gap-2">
                                        Status: {selectedStatus}
                                        <button
                                            onClick={() => {
                                                setSelectedStatus('');
                                                applyFilters();
                                            }}
                                            className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Categories Grid */}
                {categories.data.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700"
                    >
                        <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No categories found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {activeFiltersCount > 0
                                ? 'Try adjusting your filters to find what you\'re looking for.'
                                : 'Get started by creating your first product category.'}
                        </p>
                        <Button onClick={handleCreateCategory} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Category
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categories.data.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 cursor-pointer group relative"
                                onClick={() => handleViewCategory(category.id)}
                            >
                                {/* Category Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl mb-3">
                                            {category.icon || '📦'}
                                        </div>
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
                                            {category.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={category.is_active ? 'default' : 'secondary'}
                                                className={category.is_active 
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}
                                            >
                                                {category.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={() => handleViewCategory(category.id)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEditCategory(category.id)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(category.id)}>
                                                <Power className="h-4 w-4 mr-2" />
                                                {category.is_active ? 'Deactivate' : 'Activate'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => handleDelete(category.id)}
                                                className="text-red-600 dark:text-red-400"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Category Stats */}
                                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            Products
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{category.products_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <Hash className="h-4 w-4" />
                                            Sort Order
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{category.sort_order}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {categories.last_page > 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Showing <span className="font-semibold text-gray-900 dark:text-white">{((categories.current_page - 1) * categories.per_page) + 1}</span> to{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {Math.min(categories.current_page * categories.per_page, categories.total)}
                                </span> of{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">{categories.total}</span> categories
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(categories.current_page - 1)}
                                    disabled={categories.current_page === 1}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>

                                <div className="flex gap-1">
                                    {generatePageNumbers().map((page, index) => (
                                        page === '...' ? (
                                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                                                ...
                                            </span>
                                        ) : (
                                            <motion.button
                                                key={page}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handlePageChange(page as number)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    page === categories.current_page
                                                        ? 'bg-purple-600 text-white'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {page}
                                            </motion.button>
                                        )
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(categories.current_page + 1)}
                                    disabled={categories.current_page === categories.last_page}
                                    className="gap-1"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Off-Canvas Component */}
            <CategoryOffCanvas
                isOpen={offCanvasOpen}
                onClose={() => setOffCanvasOpen(false)}
                mode={offCanvasMode}
                categoryId={selectedCategoryId}
                onEdit={handleEditCategory}
            />
        </AdminLayout>
    );
}

