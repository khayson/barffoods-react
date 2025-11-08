import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { configureEcho } from '@laravel/echo-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { WishlistProvider } from './contexts/WishlistContext';
import { CartProvider } from './contexts/CartContext';
import { LocationProvider } from './contexts/LocationContext';
import { type SharedData } from './types';
import ErrorBoundary from './components/ErrorBoundary';

configureEcho({
    broadcaster: 'reverb',
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        const pageProps = props.initialPage.props as unknown as SharedData;
        
        root.render(
            <ErrorBoundary>
                <LocationProvider>
                    <WishlistProvider user={pageProps.auth?.user}>
                        <CartProvider user={pageProps.auth?.user}>
                            <App {...props} />
                            <Toaster 
                                position={pageProps.isMobile ? "top-center" : "top-right"}
                                expand={!pageProps.isMobile}
                                richColors={true}
                                closeButton={true}
                            />
                        </CartProvider>
                    </WishlistProvider>
                </LocationProvider>
            </ErrorBoundary>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Global Inertia error handling
router.on('error', (event) => {
    const errors = event.detail.errors;
    const status = (event.detail as any).response?.status;

    // Handle different error types
    switch (status) {
        case 401:
            toast.error('Authentication Required', {
                description: 'Please log in to continue',
            });
            break;
        case 403:
            toast.error('Access Denied', {
                description: 'You do not have permission to access this resource',
            });
            break;
        case 404:
            toast.error('Not Found', {
                description: 'The requested resource could not be found',
            });
            break;
        case 419:
            toast.error('Session Expired', {
                description: 'Your session has expired. Please refresh the page.',
                action: {
                    label: 'Refresh',
                    onClick: () => window.location.reload(),
                },
            });
            break;
        case 422:
            // Validation errors - handled by form components
            break;
        case 429:
            toast.error('Too Many Requests', {
                description: 'Please slow down and try again in a moment',
            });
            break;
        case 500:
        case 502:
        case 503:
        case 504:
            toast.error('Server Error', {
                description: 'Something went wrong on our end. Please try again later.',
            });
            break;
        default:
            if (status && status >= 400) {
                toast.error('Error', {
                    description: 'An unexpected error occurred. Please try again.',
                });
            }
    }
});

// Handle network errors
router.on('exception', (event) => {
    console.error('Inertia exception:', event.detail);
    
    toast.error('Network Error', {
        description: 'Unable to connect to the server. Please check your internet connection.',
        action: {
            label: 'Retry',
            onClick: () => window.location.reload(),
        },
    });
});
