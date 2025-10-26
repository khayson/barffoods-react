import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import StoreOffCanvas from '@/components/admin/StoreOffCanvas';
import { 
    Search, Plus, MapPin, Phone, Package, Truck, DollarSign, 
    Eye, Edit, Trash2, Power, MoreVertical, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Store {
    id: number;
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
    delivery_radius: number;
    min_order_amount: number;
    delivery_fee: number;
    is_active: boolean;
    products_count: number;
    created_at: string;
    updated_at: string;
}

interface StoresPageProps {
    stores: {
        data: Store[];
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

export default function StoresPage({ stores, filters }: StoresPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Off-canvas state
    const [offCanvasOpen, setOffCanvasOpen] = useState(false);
    const [offCanvasMode, setOffCanvasMode] = useState<'view' | 'edit' | 'create'>('view');
    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

    const handleSearch = () => {
        applyFilters();
    };

    const applyFilters = (page = 1) => {
        const params: Record<string, any> = { page };
        if (searchTerm) params.search = searchTerm;
        if (selectedStatus) params.status = selectedStatus;
        if (filters.sort_by) params.sort_by = filters.sort_by;
        if (filters.sort_order) params.sort_order = filters.sort_order;

        router.get('/admin/stores', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleViewStore = (storeId: number) => {
        setSelectedStoreId(storeId);
        setOffCanvasMode('view');
        setOffCanvasOpen(true);
    };

    const handleEditStore = (storeId: number) => {
        setSelectedStoreId(storeId);
        setOffCanvasMode('edit');
        setOffCanvasOpen(true);
    };

    const handleCreateStore = () => {
        setSelectedStoreId(null);
        setOffCanvasMode('create');
        setOffCanvasOpen(true);
    };

    const handleToggleStatus = async (storeId: number) => {
        router.patch(`/admin/stores/${storeId}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Store status updated successfully!');
            },
            onError: () => {
                toast.error('Failed to update status');
            },
        });
    };

    const handleDelete = (storeId: number) => {
        if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
            return;
        }

        router.delete(`/admin/stores/${storeId}`, {
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
                    : 'Failed to delete store';
                toast.error(errorMessage);
            },
        });
    };

    const handlePageChange = (page: number) => {
        applyFilters(page);
    };

    const generatePageNumbers = () => {
        const pages = [];
        const { current_page, last_page } = stores;
        
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
            <Head title="Stores Management" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Stats */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                                <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    Stores
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Manage store locations and delivery settings
                                </p>
                            </div>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateStore}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Add Store
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
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Stores</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stores.total}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Stores</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stores.data.filter(s => s.is_active).length}
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
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Filter className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search by store name, address, or phone..."
                                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
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
                            className="px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        >
                            <option value="">All Stores</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        {/* Search Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSearch}
                            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 flex items-center gap-2 whitespace-nowrap"
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

                {/* Stores Grid */}
                {stores.data.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700"
                    >
                        <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No stores found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {activeFiltersCount > 0
                                ? 'Try adjusting your filters to find what you\'re looking for.'
                                : 'Get started by creating your first store location.'}
                        </p>
                        <Button onClick={handleCreateStore} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Store
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.data.map((store, index) => (
                            <motion.div
                                key={store.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 cursor-pointer group relative"
                                onClick={() => handleViewStore(store.id)}
                            >
                                {/* Store Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {store.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge
                                                variant={store.is_active ? 'default' : 'secondary'}
                                                className={store.is_active 
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}
                                            >
                                                {store.is_active ? 'Active' : 'Inactive'}
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
                                            <DropdownMenuItem onClick={() => handleViewStore(store.id)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEditStore(store.id)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(store.id)}>
                                                <Power className="h-4 w-4 mr-2" />
                                                {store.is_active ? 'Deactivate' : 'Activate'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => handleDelete(store.id)}
                                                className="text-red-600 dark:text-red-400"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Store Details */}
                                <div className="space-y-3">
                                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2">{store.address}</span>
                                    </div>
                                    
                                    {store.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Phone className="h-4 w-4 flex-shrink-0" />
                                            <span>{store.phone}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Package className="h-4 w-4 flex-shrink-0" />
                                        <span>{store.products_count} products</span>
                                    </div>
                                </div>

                                {/* Store Stats */}
                                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Radius</div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{store.delivery_radius}mi</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Min. Order</div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">${store.min_order_amount}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Del. Fee</div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">${store.delivery_fee}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {stores.last_page > 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Showing <span className="font-semibold text-gray-900 dark:text-white">{((stores.current_page - 1) * stores.per_page) + 1}</span> to{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {Math.min(stores.current_page * stores.per_page, stores.total)}
                                </span> of{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">{stores.total}</span> stores
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(stores.current_page - 1)}
                                    disabled={stores.current_page === 1}
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
                                                    page === stores.current_page
                                                        ? 'bg-blue-600 text-white'
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
                                    onClick={() => handlePageChange(stores.current_page + 1)}
                                    disabled={stores.current_page === stores.last_page}
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
            <StoreOffCanvas
                isOpen={offCanvasOpen}
                onClose={() => setOffCanvasOpen(false)}
                mode={offCanvasMode}
                storeId={selectedStoreId}
                onEdit={handleEditStore}
            />
        </AdminLayout>
    );
}

