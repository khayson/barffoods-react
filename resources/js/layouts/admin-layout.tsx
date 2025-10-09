import { type ReactNode, useState, useEffect } from 'react';
import AdminSidebar from '@/layouts/admin/admin-sidebar';
import AdminRightSidebar from '@/layouts/admin/admin-right-sidebar';
import AdminHeader from '@/layouts/admin/admin-header';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Hide sidebars on mobile by default
            if (mobile) {
                setShowSidebar(false);
                setShowRightSidebar(false);
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Floating Header */}
            <AdminHeader 
                onToggleSidebar={toggleSidebar}
                onToggleRightSidebar={toggleRightSidebar}
                isMobile={isMobile}
            />

            <div className="flex pt-20">
                {/* Left Sidebar - Hidden on mobile by default, shown when toggled */}
                <div className={`${isMobile ? 'absolute z-30 h-full' : 'pl-25 pt-4'} ${isMobile && !showSidebar ? 'hidden' : 'block'}`}>
                    <AdminSidebar 
                        isMobile={isMobile}
                        onClose={closeSidebar}
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={toggleSidebarCollapse}
                    />
                </div>

                {/* Main Content - Fixed positioning independent of sidebar state */}
                <main className="flex-1 p-6 overflow-y-auto"
                style={{
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none', /* IE and Edge */
                }}>
                    {children}
                </main>

                {/* Right Sidebar - Hidden on mobile by default, shown when toggled */}
                <div className={`${isMobile ? 'absolute z-30 h-full right-0' : 'pr-25 pt-4'} ${isMobile && !showRightSidebar ? 'hidden' : 'block'}`}>
                    <AdminRightSidebar 
                        isMobile={isMobile}
                        onClose={closeRightSidebar}
                        collapsed={rightSidebarCollapsed}
                        onToggleCollapse={toggleRightSidebarCollapse}
                    />
                </div>
            </div>

            {/* Mobile overlay when sidebars are open */}
            {isMobile && (showSidebar || showRightSidebar) && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
                    onClick={() => {
                        closeSidebar();
                        closeRightSidebar();
                    }}
                />
            )}
        </div>
    );
}