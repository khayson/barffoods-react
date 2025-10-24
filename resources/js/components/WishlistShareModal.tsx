import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Lock, Copy, Check, Share2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WishlistShareModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WishlistShareModal({ isOpen, onClose }: WishlistShareModalProps) {
    const [isPublic, setIsPublic] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch share settings when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchShareSettings();
        }
    }, [isOpen]);

    const fetchShareSettings = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/wishlist/share/settings', {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setIsPublic(data.is_public);
                setShareUrl(data.share_url);
            }
        } catch (error) {
            console.error('Error fetching share settings:', error);
            toast.error('Failed to load share settings');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePrivacy = async () => {
        setIsTogglingPrivacy(true);
        try {
            const response = await fetch('/api/wishlist/share/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    is_public: !isPublic,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setIsPublic(data.is_public);
                setShareUrl(data.share_url);
                toast.success(data.message);
            } else {
                toast.error('Failed to update privacy settings');
            }
        } catch (error) {
            console.error('Error toggling privacy:', error);
            toast.error('Failed to update privacy settings');
        } finally {
            setIsTogglingPrivacy(false);
        }
    };

    const handleCopyShareLink = async () => {
        if (!shareUrl) {
            toast.error('Please enable public sharing first');
            return;
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            toast.success('Share link copied to clipboard!');
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    const handleWebShare = async () => {
        if (!shareUrl) {
            toast.error('Please enable public sharing first');
            return;
        }

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Wishlist - BARF Foods',
                    text: 'Check out my wishlist!',
                    url: shareUrl
                });
                toast.success('Wishlist shared successfully!');
            } else {
                // Fallback to copy
                await handleCopyShareLink();
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                await handleCopyShareLink();
            }
        }
    };

    if (!isOpen) return null;

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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                                        <Share2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            Wishlist Sharing
                                        </h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Control who can see your wishlist
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {isLoading ? (
                                    // Loading State
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Privacy Toggle Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className={`p-3 rounded-lg ${
                                                        isPublic 
                                                            ? 'bg-green-100 dark:bg-green-900/30' 
                                                            : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}>
                                                        {isPublic ? (
                                                            <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                        ) : (
                                                            <Lock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                                                            {isPublic ? 'Public Wishlist' : 'Private Wishlist'}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {isPublic 
                                                                ? 'Anyone with the link can view your wishlist' 
                                                                : 'Only you can see your wishlist'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={togglePrivacy}
                                                    disabled={isTogglingPrivacy}
                                                    className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                                        isPublic ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                                    } ${isTogglingPrivacy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <span
                                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                                                            isPublic ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>
                                            </div>

                                            {/* Info Alert */}
                                            <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-blue-900 dark:text-blue-100">
                                                    <p className="font-medium mb-1">How sharing works</p>
                                                    <p className="text-blue-800 dark:text-blue-200">
                                                        When you make your wishlist public, anyone with your unique link can view the products you've saved. 
                                                        They can add items to their own cart or wishlist, but they cannot modify yours.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Share Link Section */}
                                        <AnimatePresence mode="wait">
                                            {isPublic && shareUrl ? (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800"
                                                >
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                            Your Unique Share Link
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={shareUrl}
                                                                readOnly
                                                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={handleCopyShareLink}
                                                            className="flex-1 px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg"
                                                        >
                                                            {isCopied ? (
                                                                <>
                                                                    <Check className="h-5 w-5" />
                                                                    Copied!
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="h-5 w-5" />
                                                                    Copy Link
                                                                </>
                                                            )}
                                                        </motion.button>

                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={handleWebShare}
                                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg"
                                                        >
                                                            <Share2 className="h-5 w-5" />
                                                            Share
                                                        </motion.button>
                                                    </div>

                                                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                                                        💡 Share this link with friends and family so they can see your wishlist!
                                                    </p>
                                                </motion.div>
                                            ) : !isPublic ? (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="text-center py-6"
                                                >
                                                    <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        Enable public sharing to get your unique link
                                                    </p>
                                                </motion.div>
                                            ) : null}
                                        </AnimatePresence>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                                <button
                                    onClick={onClose}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

