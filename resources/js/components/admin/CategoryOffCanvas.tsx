import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Package, Edit, Trash2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EmojiPickerComponent } from '@/components/ui/emoji-picker';
import { router } from '@inertiajs/react';
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

interface CategoryOffCanvasProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'view' | 'edit' | 'create';
    categoryId?: number | null;
    onEdit?: (categoryId: number) => void;
}

export default function CategoryOffCanvas({ isOpen, onClose, mode, categoryId, onEdit }: CategoryOffCanvasProps) {
    const [category, setCategory] = useState<Category>({
        id: 0,
        name: '',
        icon: '📦',
        sort_order: 0,
        is_active: true,
        products_count: 0,
        created_at: '',
        updated_at: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch category data when in view/edit mode
    useEffect(() => {
        if ((mode === 'view' || mode === 'edit') && categoryId && isOpen) {
            fetchCategory();
        } else if (mode === 'create') {
            // Reset form for create mode
            setCategory({
                id: 0,
                name: '',
                icon: '📦',
                sort_order: 0,
                is_active: true,
                products_count: 0,
                created_at: '',
                updated_at: '',
            });
        }
    }, [mode, categoryId, isOpen]);

    const fetchCategory = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/categories/${categoryId}`);
            if (!response.ok) throw new Error('Failed to fetch category');
            const data = await response.json();
            
            // Ensure proper type conversion for numeric fields
            setCategory({
                ...data,
                sort_order: parseInt(data.sort_order) || 0,
            });
        } catch (error) {
            console.error('Error fetching category:', error);
            toast.error('Failed to load category data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        // Validation
        if (!category.name?.trim()) {
            toast.error('Please enter a category name');
            return;
        }
        if (category.sort_order < 0) {
            toast.error('Sort order cannot be negative');
            return;
        }

        setIsSaving(true);

        const url = mode === 'create' ? '/admin/categories' : `/admin/categories/${category.id}`;
        const method = mode === 'create' ? 'post' : 'put';

        router[method](url, category as any, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Category ${mode === 'create' ? 'created' : 'updated'} successfully!`);
                onClose();
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                const firstError = Object.values(errors)[0];
                toast.error(firstError as string || 'Failed to save category');
            },
            onFinish: () => {
                setIsSaving(false);
            },
        });
    };

    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            return;
        }

        router.delete(`/admin/categories/${category.id}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                // Check if there's a success flash message
                const successMessage = (page.props as any).flash?.success;
                if (successMessage) {
                    toast.success(successMessage);
                    onClose();
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

    const renderViewMode = () => (
        <div className="space-y-6">
            {/* Category Header */}
            <div className="text-center space-y-2">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg text-4xl">
                    {category.icon || '📦'}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h2>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    category.is_active 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${category.is_active ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                    {category.is_active ? 'Active' : 'Inactive'}
                </div>
            </div>

            {/* Category Details */}
            <div className="space-y-4">
                {/* Sort Order */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Sort Order</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{category.sort_order}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Lower numbers appear first</p>
                        </div>
                    </div>
                </div>

                {/* Products Count */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Total Products</h4>
                        </div>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{category.products_count}</span>
                    </div>
                </div>

                {/* Icon Preview */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Tag className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Category Icon</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center text-3xl">
                                    {category.icon || '📦'}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Emoji Code</p>
                                    <code className="text-sm font-mono text-gray-900 dark:text-white">{category.icon || 'None'}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    onClick={() => onEdit && onEdit(category.id)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Category
                </Button>
                <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="px-4"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    const renderFormMode = () => (
        <div className="space-y-6">
            {/* Category Name */}
            <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                    id="name"
                    type="text"
                    value={category.name}
                    onChange={(e) => setCategory({ ...category, name: e.target.value })}
                    placeholder="Enter category name"
                    className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use a clear, descriptive name for your category
                </p>
            </div>

            {/* Category Icon */}
            <div>
                <Label htmlFor="icon">Category Icon (Emoji)</Label>
                <div className="flex gap-4 mt-1">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 shadow-sm">
                        {category.icon || '📦'}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                        <EmojiPickerComponent
                            value={category.icon}
                            onEmojiSelect={(emoji) => setCategory({ ...category, icon: emoji })}
                            buttonText={category.icon ? 'Change Emoji' : 'Select Emoji'}
                            buttonClassName="w-full"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Click to choose an emoji that represents this category
                        </p>
                    </div>
                </div>
            </div>

            {/* Sort Order */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
                <Label htmlFor="sort_order">Sort Order *</Label>
                <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={category.sort_order}
                    onChange={(e) => setCategory({ ...category, sort_order: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                />
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                    💡 Lower numbers appear first in the category list (e.g., 0, 1, 2...)
                </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                    <Label htmlFor="is_active" className="text-sm font-semibold">Active Status</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Inactive categories won't appear in customer product filters
                    </p>
                </div>
                <Switch
                    id="is_active"
                    checked={category.is_active}
                    onCheckedChange={(checked) => setCategory({ ...category, is_active: checked })}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
                    disabled={isSaving}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : mode === 'create' ? 'Create Category' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Off-Canvas Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {mode === 'view' ? 'Category Details' : mode === 'edit' ? 'Edit Category' : 'Create New Category'}
                                    </h2>
                                    <p className="text-purple-100 text-sm mt-1">
                                        {mode === 'view' ? 'View category information' : mode === 'edit' ? 'Update category details' : 'Add a new product category'}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                </div>
                            ) : mode === 'view' ? (
                                renderViewMode()
                            ) : (
                                renderFormMode()
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

