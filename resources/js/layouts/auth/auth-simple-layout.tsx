import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
            {/* Navigation */}
            <Navigation />
            
            {/* Auth Content */}
            <div className="flex-1 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-2 font-medium"
                            >
                                <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                    <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                                </div>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-center text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <Footer />
        </div>
    );
}
