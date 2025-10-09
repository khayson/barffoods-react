import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Menu, Bell, MessageSquare, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdminHeaderProps {
    onToggleSidebar: () => void;
    onToggleRightSidebar: () => void;
    isMobile: boolean;
}

export default function AdminHeader({ onToggleSidebar, onToggleRightSidebar, isMobile }: AdminHeaderProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const page = usePage<SharedData>();
    const { auth } = page.props;
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
    return (
        <div className="fixed top-4 left-10 right-10 z-40">
            <div className="mx-auto max-w-8xl">
                <div className="flex h-16 items-center justify-between px-20 bg-white dark:bg-gray-800 shadow-lg rounded-xl border-2 border-gray-200 dark:border-gray-900">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={onToggleSidebar}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center space-x-3">
                            <div >
                                {/* <span className="text-white font-bold text-sm">BF</span> */}
                                <AppLogoIcon className={`${isMobile ? 'w-10' : 'w-10'} h-auto text-white font-bold`} />
                            </div>
                            {/* <span className="text-xl font-semibold text-gray-900 dark:text-white">BarfFoods Admin</span> */}
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                            Welcome back! {auth.user.name}
                        </div>

                        {/* Messages */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={() => {
                                // TODO: Implement messages functionality
                                console.log('Messages clicked');
                            }}
                        >
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                        
                        {/* Right Sidebar Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={onToggleRightSidebar}
                        >
                            <Bell className="h-5 w-5" />
                        </Button>
                        
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={toggleTheme}
                        >
                            {isDarkMode ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
