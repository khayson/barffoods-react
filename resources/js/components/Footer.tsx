import { Link, usePage } from '@inertiajs/react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';
import HowItWorksModal from './HowItWorksModal';

interface StoreAddress {
  company_name: string;
  phone: string;
  email: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const { storeAddress } = usePage().props as any;

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl">🛒</div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">BarfFoods</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Fresh groceries delivered to your doorstep. Quality products from local stores with fast delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => setShowHowItWorks(true)}
                  className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <Link href="/products" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/stores" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                  Stores
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Customer Service
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Contact Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">{storeAddress?.phone }</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">{storeAddress?.email}</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {storeAddress?.street_address}<br />
                  {storeAddress?.city}, {storeAddress?.state} {storeAddress?.zip_code}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                © {currentYear} BarfFoods. All rights reserved.
              </p>
              <div className="flex space-x-4">
                <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors text-sm">
                  Terms of Service
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Powered by</span>
              <span className="text-green-600 dark:text-green-400 font-semibold text-sm">BarfFoods</span>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Modal */}
      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
    </footer>
  );
}
