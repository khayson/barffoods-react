import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface Category {
    id: number;
    name: string;
    itemCount: number;
    image: string;
    backgroundColor: string;
}

interface ShopByCategoryProps {
    onCategorySelect?: (categoryName: string) => void;
    selectedCategory?: string;
}

// Category mapping for icons and colors
const categoryMapping: { [key: string]: { image: string; backgroundColor: string } } = {
    'Fruits & Vegetables': { image: '🍎', backgroundColor: 'bg-pink-50' },
    'Dairy & Eggs': { image: '🥛', backgroundColor: 'bg-blue-50' },
    'Meat & Seafood': { image: '🥩', backgroundColor: 'bg-red-50' },
    'Bakery': { image: '🍞', backgroundColor: 'bg-orange-50' },
    'Beverages': { image: '🥤', backgroundColor: 'bg-green-50' },
    'Snacks': { image: '🍿', backgroundColor: 'bg-yellow-50' },
    'Pantry Essentials': { image: '🥫', backgroundColor: 'bg-gray-50' },
    'Frozen Foods': { image: '🧊', backgroundColor: 'bg-blue-50' },
    'Health & Wellness': { image: '💊', backgroundColor: 'bg-green-50' },
    'Household': { image: '🧽', backgroundColor: 'bg-purple-50' }
};

export default function ShopByCategory({ onCategorySelect, selectedCategory }: ShopByCategoryProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const scrollPositionRef = useRef(0);
    const [categories, setCategories] = useState<Category[]>([]);

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/api/products');
                const apiCategories = response.data.categories;
                
                // Map API categories to component format
                const mappedCategories: Category[] = apiCategories.map((cat: any) => {
                    const mapping = categoryMapping[cat.name] || { image: '📦', backgroundColor: 'bg-gray-50' };
                    return {
                        id: parseInt(cat.id),
                        name: cat.name,
                        itemCount: cat.product_count || 0,
                        image: mapping.image,
                        backgroundColor: mapping.backgroundColor
                    };
                });
                
                setCategories(mappedCategories);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories([]); // Empty array on error, no fallback data
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationId: number;
        const scrollSpeed = 0.5; // pixels per frame

        const animate = () => {
            if (!isHovered) {
                scrollPositionRef.current += scrollSpeed;
                const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
                
                if (scrollPositionRef.current >= maxScroll) {
                    scrollPositionRef.current = 0;
                }
                
                scrollContainer.scrollLeft = scrollPositionRef.current;
            }
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [isHovered]);

    return (
        <div className="w-full py-8 bg-white dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
                    Shop By Category
                </h2>

                {/* Infinite Scrolling Categories */}
                <div className="relative overflow-hidden">
                    <div 
                        ref={scrollRef}
                        className="flex gap-4 overflow-x-hidden scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Duplicate categories for seamless loop */}
                        {[...categories, ...categories, ...categories].map((category, index) => (
                            <div
                                key={`${category.id}-${index}`}
                                className={`${category.backgroundColor} dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all duration-300 cursor-pointer group flex-shrink-0 w-48 relative border-2 ${
                                    selectedCategory === category.name 
                                        ? 'border-green-500 shadow-lg bg-green-50 dark:bg-green-900/20' 
                                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => onCategorySelect?.(category.name)}
                            >
                                {/* Selected indicator */}
                                {selectedCategory === category.name && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                                {/* Category Image */}
                                <div className="flex justify-center items-center mb-3 h-16">
                                    <div className="text-6xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                                        {category.image}
                                    </div>
                                </div>

                                {/* Category Info */}
                                <div className="text-center">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                        {category.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Item ({category.itemCount})
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
