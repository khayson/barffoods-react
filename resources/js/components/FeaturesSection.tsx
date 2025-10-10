import { Truck, Shield, Clock, RotateCcw } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Quick delivery within 2 hours'
    },
    {
      icon: Shield,
      title: 'Fresh Guarantee',
      description: '100% fresh products guaranteed'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer support'
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      description: 'Hassle-free returns within 30 days'
    }
  ];

  return (
    <section className="py-4 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <IconComponent className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
