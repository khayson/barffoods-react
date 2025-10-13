import React, { useState } from 'react';
import { Package, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Product {
    description: string;
}

interface ProductTabsProps {
    product: Product;
}

export default function ProductTabs({ product }: ProductTabsProps) {
    const [activeTab, setActiveTab] = useState('details');

    return (
        <div className="mt-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Product Details</TabsTrigger>
                    <TabsTrigger value="packaging">Packaging</TabsTrigger>
                    <TabsTrigger value="shipping">Shipping Information</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Detailed Description</h3>
                            <p className="text-gray-700 leading-relaxed">
                                {product.description}
                            </p>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center">
                                    <Package className="w-5 h-5 mr-2" />
                                    Size
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Height:</span>
                                        <span className="font-medium">43 inches</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Width:</span>
                                        <span className="font-medium">20 inches</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center">
                                    <Info className="w-5 h-5 mr-2" />
                                    Material
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Seat:</span>
                                        <span className="font-medium">Premium Leather</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Legs:</span>
                                        <span className="font-medium">Teak wood & Metal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="packaging" className="mt-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Packaging Information</h3>
                        <p className="text-gray-700">
                            Your product will be carefully packaged to ensure it arrives in perfect condition. 
                            We use eco-friendly packaging materials and secure padding to protect your items during transit.
                        </p>
                    </div>
                </TabsContent>
                
                <TabsContent value="shipping" className="mt-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Shipping Information</h3>
                        <p className="text-gray-700">
                            We offer fast and reliable shipping options. Standard delivery takes 3-5 business days, 
                            while express delivery is available for next-day delivery in most areas.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
