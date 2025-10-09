import { type ReactNode, useState, useEffect } from 'react';
import CustomerHeader from '@/layouts/customer/customer-header';
import CustomerMobileMenu from '@/layouts/customer/customer-mobile-menu';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Toaster } from '@/components/ui/sonner';

interface CustomerLayoutProps {
    children: ReactNode;
}

function CustomerLayoutContent({ children }: CustomerLayoutProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const page = usePage<SharedData>();
    const { auth } = page.props;

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Hide mobile menu on desktop
            if (!mobile) {
                setShowMobileMenu(false);
            }
        };
        
        // Set initial state
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Toggle mobile menu visibility
    const toggleMobileMenu = () => {
        setShowMobileMenu(!showMobileMenu);
    };

    const closeMobileMenu = () => {
        setShowMobileMenu(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <CustomerHeader 
                onToggleMobileMenu={toggleMobileMenu}
                isMobile={isMobile}
            />

            {/* Mobile Menu */}
            {isMobile && showMobileMenu && (
                <CustomerMobileMenu 
                    onClose={closeMobileMenu}
                />
            )}

            {/* Main Content */}
            <main className="py-6 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>

            {/* Mobile overlay when menu is open */}
            {isMobile && showMobileMenu && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sonner Toast Notifications */}
            <Toaster 
                position="top-right"
                expand={true}
                richColors={true}
                closeButton={true}
            />
        </div>
    );
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    
    return (
        <NotificationProvider userId={auth.user?.id?.toString()}>
            <CustomerLayoutContent>
                {children}
            </CustomerLayoutContent>
        </NotificationProvider>
    );
}