import React from 'react';
import { Link } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Review {
    id: string;
    user: {
        name: string;
        avatar: string;
    };
    rating: number;
    date: string;
    comment: string;
}

interface ProductReviewsProps {
    reviews: Review[];
}

export default function ProductReviews({ reviews }: ProductReviewsProps) {
    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Reviews & Rating</h2>
                <Link href="#" className="text-green-600 hover:text-green-700 font-medium">
                    View All Reviews →
                </Link>
            </div>

            {reviews.length > 0 ? (
                <div className="space-y-6">
                    {reviews.slice(0, 3).map((review) => (
                        <Card key={review.id} className="border-gray-200">
                            <CardContent className="p-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-lg font-medium text-gray-600">
                                            {review.user.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">
                                                    {review.user.name}
                                                </h4>
                                                <p className="text-sm text-gray-500">{review.date}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span className="ml-1 font-semibold">{review.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">
                                            {review.comment}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-gray-200">
                    <CardContent className="p-8 text-center">
                        <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
