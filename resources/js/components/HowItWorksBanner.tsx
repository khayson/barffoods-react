import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, CreditCard, Truck } from 'lucide-react';

export default function HowItWorksBanner() {
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  const steps = [
    {
      icon: Search,
      title: 'Browse Products',
      description: 'Explore our wide selection of fresh groceries'
    },
    {
      icon: ShoppingCart,
      title: 'Add to Cart',
      description: 'Select your favorite items and add them to cart'
    },
    {
      icon: CreditCard,
      title: 'Checkout',
      description: 'Complete your order with secure payment'
    },
    {
      icon: Truck,
      title: 'Delivery',
      description: 'Get your groceries delivered to your doorstep'
    }
  ];

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
    <section className="bg-green-600 dark:bg-green-700 text-white py-1 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left side - Static text */}
          <div className="flex-shrink-0 mr-8">
            <h2 className="text-sm font-semibold">How it works:</h2>
          </div>

          {/* Right side - Scrolling steps */}
          <div className="flex-1 overflow-hidden">
            <div 
              ref={scrollRef}
              className="flex space-x-8 overflow-x-hidden scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Duplicate steps for seamless loop */}
              {[...steps, ...steps, ...steps].map((step, index) => {
                const IconComponent = step.icon;
                const isLastStep = step.title === 'Delivery';
                return (
                  <div key={`${step.title}-${index}`} className="flex items-center space-x-2 flex-shrink-0">
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs font-medium">{step.title}</span>
                    {!isLastStep && <span className="text-xs opacity-80">→</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
