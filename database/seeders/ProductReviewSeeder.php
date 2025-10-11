<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\User;
use App\Models\ProductReview;

class ProductReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = Product::all();
        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run CustomerSeeder first.');
            return;
        }

        $reviewTemplates = [
            [
                'ratings' => [5, 5, 4, 5, 4, 5, 5, 4, 5, 5],
                'comments' => [
                    'Excellent quality! Fresh and delicious.',
                    'Great product, highly recommend!',
                    'Good value for money.',
                    'Perfect! Exactly as described.',
                    'Very satisfied with this purchase.',
                    'Amazing quality, will buy again!',
                    'Fresh and tasty, love it!',
                    'Good product, fast delivery.',
                    'Excellent! Exceeded my expectations.',
                    'Perfect quality, great taste!'
                ]
            ],
            [
                'ratings' => [4, 5, 3, 4, 5, 4, 5, 3, 4, 5],
                'comments' => [
                    'Good product overall.',
                    'Love this! Great quality.',
                    'Decent product, could be better.',
                    'Nice quality, good price.',
                    'Excellent! Very happy with purchase.',
                    'Good value, recommend it.',
                    'Amazing quality!',
                    'Okay product, average quality.',
                    'Good quality, will buy again.',
                    'Perfect! Great taste and quality.'
                ]
            ],
            [
                'ratings' => [5, 4, 5, 4, 5, 3, 4, 5, 4, 5],
                'comments' => [
                    'Outstanding quality!',
                    'Very good product.',
                    'Excellent! Highly recommend.',
                    'Good quality, fair price.',
                    'Perfect! Great value.',
                    'Decent product, good quality.',
                    'Nice quality, satisfied.',
                    'Excellent! Will buy again.',
                    'Good product, recommend.',
                    'Perfect quality!'
                ]
            ]
        ];

        foreach ($products as $product) {
            $template = $reviewTemplates[array_rand($reviewTemplates)];
            $numReviews = min($product->review_count, $users->count()); // Limit to number of users

            // Shuffle users to get random selection
            $shuffledUsers = $users->shuffle();

            for ($i = 0; $i < $numReviews; $i++) {
                $user = $shuffledUsers[$i];
                $rating = $template['ratings'][$i % count($template['ratings'])];
                $comment = $template['comments'][$i % count($template['comments'])];

                // Check if review already exists
                $existingReview = ProductReview::where('product_id', $product->id)
                    ->where('user_id', $user->id)
                    ->first();

                if (!$existingReview) {
                    ProductReview::create([
                        'product_id' => $product->id,
                        'user_id' => $user->id,
                        'rating' => $rating,
                        'comment' => $comment,
                        'is_approved' => true,
                        'helpful_count' => rand(0, 10), // Random helpful count for seeding
                    ]);
                }
            }
        }

        $this->command->info('Product reviews seeded successfully!');
    }
}