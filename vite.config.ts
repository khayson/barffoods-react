import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig(({ isSsrBuild }) => ({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    ssr: {
        noExternal: ['@inertiajs/react', 'framer-motion', 'lucide-react'],
    },
    build: {
        chunkSizeWarningLimit: 1000,
        // Enable minification for production
        minify: 'esbuild',
        // Enable CSS code splitting
        cssCodeSplit: true,
        // Optimize dependencies
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        rollupOptions: {
            output: !isSsrBuild ? {
                // Only apply manual chunks for client build, not SSR
                manualChunks: {
                    // Group React and related core libraries together to avoid circular deps
                    'react-core': [
                        'react',
                        'react-dom',
                        'react/jsx-runtime',
                    ],
                    // Inertia and router
                    'inertia': [
                        '@inertiajs/react',
                    ],
                    // Large chart library
                    'recharts': [
                        'recharts',
                    ],
                    // Animation library
                    'framer-motion': [
                        'framer-motion',
                    ],
                    // Map library
                    'leaflet': [
                        'leaflet',
                    ],
                    // UI components
                    'ui-components': [
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-popover',
                        '@radix-ui/react-select',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-checkbox',
                        '@radix-ui/react-label',
                        '@radix-ui/react-separator',
                        '@radix-ui/react-switch',
                        '@radix-ui/react-slot',
                    ],
                    // Icons
                    'icons': [
                        'lucide-react',
                    ],
                    // Utilities
                    'utils': [
                        'date-fns',
                        'clsx',
                        'tailwind-merge',
                        'emoji-picker-react',
                    ],
                },
                // Optimize chunk file names for better caching
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    // Organize assets by type
                    if (assetInfo.name?.endsWith('.css')) {
                        return 'css/[name]-[hash][extname]';
                    }
                    if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(assetInfo.name || '')) {
                        return 'images/[name]-[hash][extname]';
                    }
                    if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
                        return 'fonts/[name]-[hash][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                },
            } : {},
        },
    },
}));
