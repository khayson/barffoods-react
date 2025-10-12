<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Store;
use App\Models\Category;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stores = Store::all();
        $categories = Category::all();

        $products = [
            // Fruits & Vegetables
            [
                'name' => 'Organic Apples',
                'description' => 'Fresh, crisp organic apples grown locally. Perfect for snacking, baking, or making fresh juice.',
                'price' => 4.99,
                'original_price' => 6.99,
                'image' => '🍎',
                'category_id' => $categories->where('name', 'Fruits & Vegetables')->first()->id,
                'stock_quantity' => 50,
                'average_rating' => 4.5,
                'review_count' => 128,
                'weight' => 12.0, // ounces
                'length' => 3.0,  // inches
                'width' => 3.0,   // inches
                'height' => 3.0,  // inches
            ],
            [
                'name' => 'Bananas',
                'description' => 'Sweet, ripe bananas perfect for breakfast or snacking.',
                'price' => 2.49,
                'original_price' => null,
                'image' => '🍌',
                'category_id' => $categories->where('name', 'Fruits & Vegetables')->first()->id,
                'stock_quantity' => 75,
                'average_rating' => 4.3,
                'review_count' => 89,
                'weight' => 8.0, // ounces
                'length' => 7.0,  // inches
                'width' => 1.5,   // inches
                'height' => 1.5,  // inches
            ],
            [
                'name' => 'Organic Spinach',
                'description' => 'Fresh organic spinach leaves, perfect for salads and cooking.',
                'price' => 3.99,
                'original_price' => null,
                'image' => '🥬',
                'category_id' => $categories->where('name', 'Fruits & Vegetables')->first()->id,
                'stock_quantity' => 30,
                'average_rating' => 4.7,
                'review_count' => 156,
                'weight' => 6.0, // ounces
                'length' => 8.0,  // inches
                'width' => 6.0,   // inches
                'height' => 2.0,  // inches
            ],
            [
                'name' => 'Carrots',
                'description' => 'Fresh, crunchy carrots perfect for snacking or cooking.',
                'price' => 2.99,
                'original_price' => null,
                'image' => '🥕',
                'category_id' => $categories->where('name', 'Fruits & Vegetables')->first()->id,
                'stock_quantity' => 40,
                'average_rating' => 4.2,
                'review_count' => 67,
                'weight' => 10.0, // ounces
                'length' => 6.0,  // inches
                'width' => 1.0,   // inches
                'height' => 1.0,  // inches
            ],

            // Dairy & Eggs
            [
                'name' => 'Fresh Milk',
                'description' => 'Fresh whole milk from local dairy farms.',
                'price' => 3.49,
                'original_price' => null,
                'image' => '🥛',
                'category_id' => $categories->where('name', 'Dairy & Eggs')->first()->id,
                'stock_quantity' => 60,
                'average_rating' => 4.2,
                'review_count' => 89,
                'weight' => 32.0, // ounces (1 quart)
                'length' => 4.0,  // inches
                'width' => 4.0,   // inches
                'height' => 6.0,  // inches
            ],
            [
                'name' => 'Free Range Eggs',
                'description' => 'Fresh free-range eggs from happy hens.',
                'price' => 4.99,
                'original_price' => null,
                'image' => '🥚',
                'category_id' => $categories->where('name', 'Dairy & Eggs')->first()->id,
                'stock_quantity' => 45,
                'average_rating' => 4.6,
                'review_count' => 134,
                'weight' => 24.0, // ounces (dozen eggs)
                'length' => 10.0,  // inches
                'width' => 6.0,   // inches
                'height' => 3.0,  // inches
            ],
            [
                'name' => 'Greek Yogurt',
                'description' => 'Creamy Greek yogurt perfect for breakfast or snacks.',
                'price' => 5.99,
                'original_price' => null,
                'image' => '🥄',
                'category_id' => $categories->where('name', 'Dairy & Eggs')->first()->id,
                'stock_quantity' => 35,
                'average_rating' => 4.4,
                'review_count' => 78,
                'weight' => 16.0, // ounces
                'length' => 4.0,  // inches
                'width' => 3.0,   // inches
                'height' => 3.0,  // inches
            ],

            // Meat & Seafood
            [
                'name' => 'Ground Beef',
                'description' => 'Fresh ground beef, perfect for burgers and meatballs.',
                'price' => 8.99,
                'original_price' => null,
                'image' => '🥩',
                'category_id' => $categories->where('name', 'Meat & Seafood')->first()->id,
                'stock_quantity' => 25,
                'average_rating' => 4.3,
                'review_count' => 92,
                'weight' => 16.0, // ounces (1 lb)
                'length' => 6.0,  // inches
                'width' => 4.0,   // inches
                'height' => 2.0,  // inches
            ],
            [
                'name' => 'Salmon Fillet',
                'description' => 'Fresh Atlantic salmon fillet, perfect for grilling.',
                'price' => 12.99,
                'original_price' => null,
                'image' => '🐟',
                'category_id' => $categories->where('name', 'Meat & Seafood')->first()->id,
                'stock_quantity' => 20,
                'average_rating' => 4.8,
                'review_count' => 156,
                'weight' => 20.0, // ounces
                'length' => 8.0,  // inches
                'width' => 4.0,   // inches
                'height' => 1.5,  // inches
            ],

            // Bakery
            [
                'name' => 'Whole Wheat Bread',
                'description' => 'Fresh baked whole wheat bread, perfect for sandwiches.',
                'price' => 2.99,
                'original_price' => 3.49,
                'image' => '🍞',
                'category_id' => $categories->where('name', 'Bakery')->first()->id,
                'stock_quantity' => 30,
                'average_rating' => 4.7,
                'review_count' => 156,
                'weight' => 18.0, // ounces
                'length' => 8.0,  // inches
                'width' => 4.0,   // inches
                'height' => 4.0,  // inches
            ],
            [
                'name' => 'Croissants',
                'description' => 'Buttery, flaky croissants baked fresh daily.',
                'price' => 4.99,
                'original_price' => null,
                'image' => '🥐',
                'category_id' => $categories->where('name', 'Bakery')->first()->id,
                'stock_quantity' => 20,
                'average_rating' => 4.5,
                'review_count' => 89,
                'weight' => 8.0, // ounces (pack of 4)
                'length' => 6.0,  // inches
                'width' => 4.0,   // inches
                'height' => 2.0,  // inches
            ],

            // Beverages
            [
                'name' => 'Orange Juice',
                'description' => 'Fresh squeezed orange juice, no added sugar.',
                'price' => 4.99,
                'original_price' => null,
                'image' => '🧃',
                'category_id' => $categories->where('name', 'Beverages')->first()->id,
                'stock_quantity' => 40,
                'average_rating' => 4.3,
                'review_count' => 67,
                'weight' => 64.0, // ounces (half gallon)
                'length' => 6.0,  // inches
                'width' => 4.0,   // inches
                'height' => 8.0,  // inches
            ],
            [
                'name' => 'Coffee Beans',
                'description' => 'Premium coffee beans, medium roast.',
                'price' => 9.99,
                'original_price' => null,
                'image' => '☕',
                'category_id' => $categories->where('name', 'Beverages')->first()->id,
                'stock_quantity' => 25,
                'average_rating' => 4.6,
                'review_count' => 123,
                'weight' => 12.0, // ounces
                'length' => 4.0,  // inches
                'width' => 3.0,   // inches
                'height' => 6.0,  // inches
            ],

            // Snacks
            [
                'name' => 'Mixed Nuts',
                'description' => 'Premium mixed nuts, unsalted and roasted.',
                'price' => 7.99,
                'original_price' => null,
                'image' => '🥜',
                'category_id' => $categories->where('name', 'Snacks')->first()->id,
                'stock_quantity' => 35,
                'average_rating' => 4.4,
                'review_count' => 89,
                'weight' => 16.0, // ounces
                'length' => 6.0,  // inches
                'width' => 4.0,   // inches
                'height' => 3.0,  // inches
            ],
            [
                'name' => 'Dark Chocolate',
                'description' => 'Rich dark chocolate bar, 70% cocoa.',
                'price' => 3.99,
                'original_price' => null,
                'image' => '🍫',
                'category_id' => $categories->where('name', 'Snacks')->first()->id,
                'stock_quantity' => 50,
                'average_rating' => 4.7,
                'review_count' => 167,
                'weight' => 4.0, // ounces
                'length' => 6.0,  // inches
                'width' => 2.0,   // inches
                'height' => 0.5,  // inches
            ],
        ];

        foreach ($products as $productData) {
            // Assign products to random stores
            $store = $stores->random();
            $productData['store_id'] = $store->id;
            
            Product::create($productData);
        }
    }
}
