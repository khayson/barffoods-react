import { type ReactNode, useState, useEffect } from 'react';
import AdminSidebar from '@/layouts/admin/admin-sidebar';
import AdminRightSidebar from '@/layouts/admin/admin-right-sidebar';
import AdminHeader from '@/layouts/admin/admin-header';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Toaster } from '@/components/ui/sonner';

interface AdminLayoutProps {
    children: ReactNode;
    hideRightSidebar?: boolean;
}

function AdminLayoutContent({ children, hideRightSidebar = false }: AdminLayoutProps) {
    const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'large'>('desktop');
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);

    // Handle responsive behavior with multiple breakpoints
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            let newScreenSize: 'mobile' | 'tablet' | 'desktop' | 'large';
            
            if (width < 640) {
                newScreenSize = 'mobile';
            } else if (width < 1024) {
                newScreenSize = 'tablet';
            } else if (width < 1536) {
                newScreenSize = 'desktop';
            } else {
                newScreenSize = 'large';
            }
            
            setScreenSize(newScreenSize);
            
            // Auto-hide sidebars on smaller screens
            if (newScreenSize === 'mobile') {
                setShowSidebar(false);
                setShowRightSidebar(false);
                setSidebarCollapsed(false);
                setRightSidebarCollapsed(true);
            } else if (newScreenSize === 'tablet') {
                setShowRightSidebar(false);
                setRightSidebarCollapsed(true);
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

    const isMobile = screenSize === 'mobile';
    const isTablet = screenSize === 'tablet';
    const isDesktop = screenSize === 'desktop';
    const isLarge = screenSize === 'large';

    // Toggle sidebar visibility on mobile
    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const closeSidebar = () => {
        setShowSidebar(false);
    };

    const toggleSidebarCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const toggleRightSidebar = () => {
        setShowRightSidebar(!showRightSidebar);
    };

    const closeRightSidebar = () => {
        setShowRightSidebar(false);
    };

    const toggleRightSidebarCollapse = () => {
        setRightSidebarCollapsed(!rightSidebarCollapsed);
    };

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
            {/* Floating Header */}
            <AdminHeader 
                onToggleSidebar={toggleSidebar}
                onToggleRightSidebar={toggleRightSidebar}
                isMobile={isMobile}
                screenSize={screenSize}
                showRightSidebar={!hideRightSidebar}
            />

            <div className="flex flex-1 overflow-hidden" style={{ paddingTop: isMobile ? '5rem' : isTablet ? '5.5rem' : '6rem' }}>
                {/* Left Sidebar - Responsive positioning */}
                <div className={`
                    ${isMobile ? 'absolute z-30 h-full w-80' : ''}
                    ${isTablet ? 'absolute z-30 h-full w-80' : ''}
                    ${isDesktop ? 'pl-20 pt-4' : ''}
                    ${isLarge ? 'pl-30 pt-4' : ''}
                    ${(isMobile || isTablet) && !showSidebar ? 'hidden' : 'block'}
                `}>
                    <AdminSidebar 
                        isMobile={isMobile}
                        onClose={closeSidebar}
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={toggleSidebarCollapse}
                        screenSize={screenSize}
                    />
                </div>

                {/* Main Content - Responsive padding */}
                <main className={`
                    flex-1 overflow-y-auto scrollbar-hide
                    ${isMobile ? 'p-3' : ''}
                    ${isTablet ? 'p-4' : ''}
                    ${isDesktop ? 'p-6' : ''}
                    ${isLarge ? 'p-8' : ''}
                `}>
                    {children}
                </main>

                {/* Right Sidebar - Responsive positioning */}
                {!hideRightSidebar && (
                    <div className={`
                        ${isMobile ? 'absolute z-30 h-full right-0 w-80' : ''}
                        ${isTablet ? 'absolute z-30 h-full right-0 w-80' : ''}
                        ${isDesktop ? 'pr-15 pt-4' : ''}
                        ${isLarge ? 'pr-30 pt-4' : ''}
                        ${(isMobile || isTablet) && !showRightSidebar ? 'hidden' : 'block'}
                        scrollbar-hide
                    `}>
                        <AdminRightSidebar 
                            isMobile={isMobile}
                            onClose={closeRightSidebar}
                            collapsed={rightSidebarCollapsed}
                            onToggleCollapse={toggleRightSidebarCollapse}
                            screenSize={screenSize}
                        />
                    </div>
                )}
            </div>

            {/* Responsive overlay when sidebars are open */}
            {(isMobile || isTablet) && (showSidebar || (!hideRightSidebar && showRightSidebar)) && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
                    onClick={() => {
                        closeSidebar();
                        closeRightSidebar();
                    }}
                />
            )}

            {/* Sonner Toast Notifications - Responsive positioning */}
            {/* <Toaster 
                position={isMobile ? "top-center" : "top-right"}
                expand={!isMobile}
                richColors={true}
                closeButton={true}
            /> */}
        </div>
    );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    
    // Check localStorage for user's global preference
    const [globalHideRightSidebar, setGlobalHideRightSidebar] = useState(false);
    
    useEffect(() => {
        const savedPreference = localStorage.getItem('admin-hide-right-sidebar');
        if (savedPreference !== null) {
            setGlobalHideRightSidebar(JSON.parse(savedPreference));
        }
    }, []);
    
    // Use global preference for all pages
    const hideRightSidebar = globalHideRightSidebar;
    
    return (
        <NotificationProvider userId={auth.user?.id?.toString()}>
            <AdminLayoutContent hideRightSidebar={hideRightSidebar}>
                {children}
            </AdminLayoutContent>
        </NotificationProvider>
    );
}