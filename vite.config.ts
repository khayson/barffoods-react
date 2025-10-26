import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
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
    build: {
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 kB
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Split vendor libraries into separate chunks
                    if (id.includes('node_modules')) {
                        // Large chart library
                        if (id.includes('recharts')) {
                            return 'recharts';
                        }
                        // Animation library
                        if (id.includes('framer-motion')) {
                            return 'framer-motion';
                        }
                        // React core
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'react-vendor';
                        }
                        // Inertia
                        if (id.includes('@inertiajs')) {
                            return 'inertia';
                        }
                        // Map library
                        if (id.includes('leaflet')) {
                            return 'leaflet';
                        }
                        // Radix UI components
                        if (id.includes('@radix-ui')) {
                            return 'radix-ui';
                        }
                        // Date utilities
                        if (id.includes('date-fns')) {
                            return 'date-fns';
                        }
                        // Icon libraries
                        if (id.includes('lucide-react')) {
                            return 'icons';
                        }
                        // Other node_modules
                        return 'vendor';
                    }
                },
            },
        },
    },
});
