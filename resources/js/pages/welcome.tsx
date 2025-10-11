import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksBanner from '@/components/HowItWorksBanner';
import HeroCarousel from '@/components/HeroCarousel';
import FeaturesSection from '@/components/FeaturesSection';
import ShopByCategory from '@/components/ShopByCategory';
import ProductSection from '@/components/ProductSection';
import StoreLocationsMap from '@/components/StoreLocationsMap';
import Footer from '@/components/Footer';

interface PageProps {
    nearbyStores: Array<{
        id: string;
        name: string;
        address: string;
        phone: string;
        latitude: number;
        longitude: number;
        delivery_radius: number;
        min_order_amount: number;
        delivery_fee: number;
        distance: number;
    }>;
    allStores: Array<{
        id: string;
        name: string;
        address: string;
        phone: string;
        latitude: number;
        longitude: number;
        delivery_radius: number;
        min_order_amount: number;
        delivery_fee: number;
        distance: number;
    }>;
    products: Array<{
        id: string;
        name: string;
        price: number | string;
        originalPrice?: number | string | null;
        rating: number | string;
        reviews: number | string;
        image: string;
        store: string;
        category: string;
        badges?: Array<{ text: string; color: 'red' | 'orange' | 'green' | 'yellow' | 'blue' | 'brown' | 'purple' }>;
    }>;
    categories: Array<{
        id: string;
        name: string;
        product_count: number;
    }>;
    userLocation: {
        latitude: number;
        longitude: number;
    };
    [key: string]: any;
}

export default function Welcome() {
    const { props } = usePage<PageProps>();
    const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
    return (
        <>
            <Head title="BarfFoods - Fresh Groceries Delivered">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            
            <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
                {/* How it Works Banner */}
                <HowItWorksBanner />
                
                <Navigation />
                
                
                {/* Hero Carousel */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-6">
                    <HeroCarousel />
                </section>

                {/* Features Section */}
                <FeaturesSection />

                {/* Shop By Category */}
                <ShopByCategory 
                    onCategorySelect={setSelectedCategory} 
                    selectedCategory={selectedCategory}
                />

                {/* Product Section */}
                <ProductSection 
                    nearbyStores={props.nearbyStores}
                    allStores={props.allStores}
                    initialProducts={props.products}
                    initialCategories={props.categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                />
                
                {/* Store Locations & Delivery Zones */}
                <StoreLocationsMap />
                
                {/* Footer */}
                <Footer />
            </div>
        </>
    );
}