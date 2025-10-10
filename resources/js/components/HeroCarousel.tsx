import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselSlide {
    id: number;
    image: string;
    imageAlt: string;
}

const slides: CarouselSlide[] = [
    {
        id: 1,
        image: "/assets/images/banner1.png",
        imageAlt: "Fresh vegetables and fruits basket"
    },
    {
        id: 2,
        image: "/assets/images/banner2.png",
        imageAlt: "Fresh fruits assortment"
    },
    {
        id: 3,
        image: "/assets/images/banner3.png",
        imageAlt: "Fresh vegetables discount"
    },
    {
        id: 4,
        image: "/assets/images/banner4.png",
        imageAlt: "Premium quality produce"
    },
    {
        id: 5,
        image: "/assets/images/banner5.png",
        imageAlt: "Healthy living products"
    }
];

export default function HeroCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        // Resume auto-play after 10 seconds
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const goToPrevious = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const goToNext = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    return (
        <div className="relative w-full h-full overflow-hidden rounded-[50px]">
            {/* Carousel Container */}
            <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide) => (
                    <div key={slide.id} className="w-full h-full flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center">
                            <img 
                                src={slide.image} 
                                alt={slide.imageAlt}
                                className="w-full h-full object-cover rounded-[50px]"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={goToPrevious}
                className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-110 hover:shadow-2xl"
                aria-label="Previous slide"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>

            <button
                onClick={goToNext}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-110 hover:shadow-2xl"
                aria-label="Next slide"
            >
                <ChevronRight className="h-6 w-6" />
            </button>
            {/* Dots Indicator */}
            {/* <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentSlide
                                ? 'bg-green-600 dark:bg-green-400'
                                : 'bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div> */}
        </div>
    );
}
