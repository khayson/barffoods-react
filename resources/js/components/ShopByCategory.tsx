import { useEffect, useRef, useState } from 'react';

interface Category {
    id: number;
    name: string;
    itemCount: number;
    image: string;
    backgroundColor: string;
}

const categories: Category[] = [
    {
        id: 1,
        name: "Fruits",
        itemCount: 20,
        image: "🍎",
        backgroundColor: "bg-pink-50"
    },
    {
        id: 2,
        name: "Vegetable",
        itemCount: 16,
        image: "🥬",
        backgroundColor: "bg-yellow-50"
    },
    {
        id: 3,
        name: "Juice",
        itemCount: 8,
        image: "🥤",
        backgroundColor: "bg-green-50"
    },
    {
        id: 4,
        name: "Nuts & Seeds",
        itemCount: 22,
        image: "🌽",
        backgroundColor: "bg-mint-50"
    },
    {
        id: 5,
        name: "Dairy",
        itemCount: 15,
        image: "🥛",
        backgroundColor: "bg-blue-50"
    },
    {
        id: 6,
        name: "Meat",
        itemCount: 12,
        image: "🥩",
        backgroundColor: "bg-red-50"
    },
    {
        id: 7,
        name: "Bakery",
        itemCount: 18,
        image: "🍞",
        backgroundColor: "bg-orange-50"
    },
    {
        id: 8,
        name: "Spices",
        itemCount: 25,
        image: "🌶️",
        backgroundColor: "bg-purple-50"
    }
];

export default function ShopByCategory() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const scrollPositionRef = useRef(0);

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
                                className={`${category.backgroundColor} dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all duration-300 cursor-pointer group flex-shrink-0 w-48`}
                            >
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
