import { Head } from '@inertiajs/react';
import Navigation from '@/components/Navigation';
import HowItWorksBanner from '@/components/HowItWorksBanner';
import HeroCarousel from '@/components/HeroCarousel';
import FeaturesSection from '@/components/FeaturesSection';
import ShopByCategory from '@/components/ShopByCategory';
import ProductSection from '@/components/ProductSection';
import StoreLocationsMap from '@/components/StoreLocationsMap';
import Footer from '@/components/Footer';

export default function Welcome() {
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
                <ShopByCategory />

                {/* Product Section */}
                <ProductSection />
                
                {/* Store Locations & Delivery Zones */}
                <StoreLocationsMap />
                
                {/* Footer */}
                <Footer />
            </div>
        </>
    );
}