import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Menu, Bell, MessageSquare, Sun, Moon, PanelRight, PanelRightClose } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface AdminHeaderProps {
    onToggleSidebar: () => void;
    onToggleRightSidebar: () => void;
    isMobile: boolean;
    screenSize: 'mobile' | 'tablet' | 'desktop' | 'large';
    showRightSidebar?: boolean;
}

export default function AdminHeader({ onToggleSidebar, onToggleRightSidebar, isMobile, screenSize, showRightSidebar = true }: AdminHeaderProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [globalHideRightSidebar, setGlobalHideRightSidebar] = useState(false);
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const { state: notificationState, setDropdownOpen } = useNotifications();
    // Check for saved theme preference or default to light mode
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Check for saved right sidebar preference
    useEffect(() => {
        const savedPreference = localStorage.getItem('admin-hide-right-sidebar');
        if (savedPreference !== null) {
            setGlobalHideRightSidebar(JSON.parse(savedPreference));
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        
        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const toggleGlobalRightSidebar = () => {
        const newState = !globalHideRightSidebar;
        setGlobalHideRightSidebar(newState);
        localStorage.setItem('admin-hide-right-sidebar', JSON.stringify(newState));
        // Force a page reload to apply the change globally
        window.location.reload();
    };
    return (
        <div className={`
            fixed z-40
            ${screenSize === 'mobile' ? 'top-2 left-2 right-2' : ''}
            ${screenSize === 'tablet' ? 'top-3 left-4 right-4' : ''}
            ${screenSize === 'desktop' ? 'top-4 left-6 right-6' : ''}
            ${screenSize === 'large' ? 'top-4 left-8 right-8' : ''}
        `}>
            <div className="mx-auto max-w-8xl">
                <div className={`
                    flex items-center justify-between bg-white dark:bg-gray-800 shadow-lg rounded-full border-2 border-gray-200 dark:border-gray-900
                    ${screenSize === 'mobile' ? 'h-12 px-3' : ''}
                    ${screenSize === 'tablet' ? 'h-14 px-4' : ''}
                    ${screenSize === 'desktop' ? 'h-16 px-6' : ''}
                    ${screenSize === 'large' ? 'h-16 px-30' : ''}
                `}>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={onToggleSidebar}
                        >
                            <Menu className={`${screenSize === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                        </Button>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <AppLogoIcon className={`
                                h-auto text-white font-bold
                                ${screenSize === 'mobile' ? 'w-8' : ''}
                                ${screenSize === 'tablet' ? 'w-9' : ''}
                                ${screenSize === 'desktop' ? 'w-10' : ''}
                                ${screenSize === 'large' ? 'w-10' : ''}
                            `} />
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                        {/* Welcome message - hidden on mobile */}
                        {screenSize !== 'mobile' && (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                Welcome back! {auth.user.name}
                            </div>
                        )}

                        {/* Messages - hidden on mobile */}
                        {screenSize !== 'mobile' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                onClick={() => {
                                    console.log('Messages clicked');
                                }}
                            >
                                <MessageSquare className="h-5 w-5" />
                            </Button>
                        )}
                        
                        {/* Notifications */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative"
                                data-notification-button
                                onClick={() => {
                                    const newState = !notificationOpen;
                                    setNotificationOpen(newState);
                                    setDropdownOpen(newState);
                                }}
                            >
                                <Bell className={`${screenSize === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                                {notificationState.unreadCount > 0 && (
                                    <span className={`absolute -top-1 -right-1 bg-red-500 rounded-full text-xs text-white flex items-center justify-center ${
                                        notificationState.unreadCount >= 9 
                                            ? 'px-1.5 py-0.5 min-w-[1.5rem] h-4' 
                                            : 'h-3 w-3'
                                    }`}>
                                        {notificationState.unreadCount >= 9 ? '9+' : notificationState.unreadCount}
                                    </span>
                                )}
                            </Button>
                            <NotificationDropdown 
                                isOpen={notificationOpen} 
                                onClose={() => {
                                    setNotificationOpen(false);
                                    setDropdownOpen(false);
                                }} 
                            />
                        </div>
                        
                        {/* Right Sidebar Toggle - Hidden on mobile and when showRightSidebar is false */}
                        {screenSize !== 'mobile' && showRightSidebar && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                onClick={onToggleRightSidebar}
                            >
                                <PanelRight className="h-5 w-5" />
                            </Button>
                        )}
                        
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={toggleTheme}
                        >
                            {isDarkMode ? (
                                <Sun className={`${screenSize === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                            ) : (
                                <Moon className={`${screenSize === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                            )}
                        </Button>
                        
                        {/* Global Right Sidebar Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={toggleGlobalRightSidebar}
                            title={globalHideRightSidebar ? "Show Right Sidebar" : "Hide Right Sidebar"}
                        >
                            {globalHideRightSidebar ? (
                                <PanelRightClose className={`${screenSize === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                            ) : (
                                <PanelRight className={`${screenSize === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
