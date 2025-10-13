import React from 'react';

export default function ProductSkeleton() {
    return (
        <main className="flex justify-center min-h-screen">
            {/* Left Column - Product Images */}
            <div className="w-[30%] p-8">
                <div className="space-y-6">
                    {/* Main Image Placeholder */}
                    <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                    
                    {/* Thumbnail Gallery Placeholders */}
                    <div className="flex space-x-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Right Column - Product Information */}
            <div className="w-[40%] p-8 overflow-y-auto">
                <div className="space-y-6">
                    {/* Top Section */}
                    <div className="space-y-4">
                        {/* Category Badge Placeholder */}
                        <div className="w-24 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                        
                        {/* Title Placeholders */}
                        <div className="space-y-2">
                            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </div>
                        
                        {/* Price Placeholder */}
                        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                        
                        {/* Primary Action Button Placeholder */}
                        <div className="h-12 bg-gray-300 rounded-lg w-full animate-pulse"></div>
                        
                        {/* Quantity/Secondary Action Controls */}
                        <div className="flex space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>

                    {/* Middle Section */}
                    <div className="space-y-4">
                        {/* Input Field Placeholder */}
                        <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                        
                        {/* Description Text Placeholders */}
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Features/Specifications Section */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-18 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-22 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="space-y-4 w-full">
                        {/* Reviews Header Placeholder */}
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        
                        {/* Individual Review Card Placeholders */}
                        <div className="space-y-3 w-full">
                            <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
