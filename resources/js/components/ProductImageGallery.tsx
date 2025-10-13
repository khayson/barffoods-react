import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImageGalleryProps {
    productImages: string[];
    productName: string;
}

export default function ProductImageGallery({ productImages, productName }: ProductImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);

    const nextImage = () => {
        setSelectedImage((prev) => (prev + 1) % productImages.length);
    };

    const prevImage = () => {
        setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length);
    };

    return (
        <div className="space-y-6">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl">{productImages[selectedImage]}</span>
                </div>
                
                {/* Navigation Arrows */}
                <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Thumbnail Gallery */}
            <div className="flex space-x-4">
                {productImages.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                            selectedImage === index 
                                ? 'border-green-500' 
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl">{image}</span>
                        </div>
                        {index === 0 && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <span className="text-white text-xs font-medium">3D</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
