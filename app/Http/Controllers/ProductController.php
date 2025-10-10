<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        // Mock product data - in a real app, this would come from a database
        $products = [
            [
                'id' => '1',
                'name' => 'Organic Apples',
                'price' => 4.99,
                'originalPrice' => 6.99,
                'rating' => 4.5,
                'reviews' => 128,
                'image' => '🍎',
                'store' => 'Downtown Store',
                'category' => 'Fruits & Vegetables',
                'badges' => [
                    ['text' => 'Organic', 'color' => 'green'],
                    ['text' => 'Sale', 'color' => 'red']
                ]
            ],
            [
                'id' => '2',
                'name' => 'Fresh Milk',
                'price' => 3.49,
                'originalPrice' => null,
                'rating' => 4.2,
                'reviews' => 89,
                'image' => '🥛',
                'store' => 'Mall Location',
                'category' => 'Dairy & Eggs',
                'badges' => [
                    ['text' => 'Fresh', 'color' => 'blue']
                ]
            ],
            [
                'id' => '3',
                'name' => 'Whole Wheat Bread',
                'price' => 2.99,
                'originalPrice' => 3.49,
                'rating' => 4.7,
                'reviews' => 156,
                'image' => '🍞',
                'store' => 'Suburban Branch',
                'category' => 'Bakery',
                'badges' => [
                    ['text' => 'Fresh Baked', 'color' => 'brown']
                ]
            ],
            [
                'id' => '4',
                'name' => 'Chicken Breast',
                'price' => 8.99,
                'originalPrice' => null,
                'rating' => 4.3,
                'reviews' => 67,
                'image' => '🍗',
                'store' => 'Express Store',
                'category' => 'Meat & Seafood',
                'badges' => [
                    ['text' => 'Free Range', 'color' => 'green']
                ]
            ],
            [
                'id' => '5',
                'name' => 'Cheddar Cheese',
                'price' => 5.99,
                'originalPrice' => 6.99,
                'rating' => 4.6,
                'reviews' => 94,
                'image' => '🧀',
                'store' => 'Mall Location',
                'category' => 'Dairy & Eggs',
                'badges' => [
                    ['text' => 'Aged', 'color' => 'yellow'],
                    ['text' => 'Sale', 'color' => 'red']
                ]
            ],
            [
                'id' => '6',
                'name' => 'Spinach',
                'price' => 2.49,
                'originalPrice' => null,
                'rating' => 4.1,
                'reviews' => 43,
                'image' => '🥬',
                'store' => 'Downtown Store',
                'category' => 'Fruits & Vegetables',
                'badges' => [
                    ['text' => 'Fresh', 'color' => 'green']
                ]
            ],
            [
                'id' => '7',
                'name' => 'Lipton Lemon Green Tea',
                'price' => 2.35,
                'originalPrice' => 3.00,
                'rating' => 4.8,
                'reviews' => 92,
                'image' => '🍵',
                'store' => 'Tea House',
                'category' => 'Beverages',
                'badges' => [
                    ['text' => '20% OFF', 'color' => 'orange'],
                    ['text' => 'Organic', 'color' => 'green']
                ]
            ],
            [
                'id' => '8',
                'name' => 'Lay\'s Tomato Ketchup Chips',
                'price' => 4.40,
                'rating' => 4.8,
                'reviews' => 167,
                'image' => '🍟',
                'store' => 'Snack Central',
                'category' => 'Snacks'
            ],
            [
                'id' => '9',
                'name' => 'Arabian Beef Meat Kirkland Signature Roast',
                'price' => 24.00,
                'rating' => 4.8,
                'reviews' => 134,
                'image' => '🥩',
                'store' => 'Meat Master',
                'category' => 'Meat',
                'badges' => [
                    ['text' => 'Best Sale', 'color' => 'red']
                ]
            ],
            [
                'id' => '10',
                'name' => 'APLIFE Black Seed Honey',
                'price' => 30.25,
                'rating' => 4.8,
                'reviews' => 67,
                'image' => '🍯',
                'store' => 'Health Plus',
                'category' => 'Health',
                'badges' => [
                    ['text' => 'Premium', 'color' => 'yellow']
                ]
            ],
            [
                'id' => '11',
                'name' => 'Seoul Yopokki Spicy Korean Topokki',
                'price' => 0.40,
                'rating' => 4.8,
                'reviews' => 89,
                'image' => '🍜',
                'store' => 'Korean Delights',
                'category' => 'Snacks'
            ],
            [
                'id' => '12',
                'name' => 'Lemon Big imported from South Africa',
                'price' => 4.40,
                'rating' => 4.8,
                'reviews' => 92,
                'image' => '🍋',
                'store' => 'Citrus Corner',
                'category' => 'Fruits'
            ]
        ];

        // Mock stores data
        $stores = [
            ['id' => 's1', 'name' => 'Downtown Store', 'address' => '123 Main St, Downtown'],
            ['id' => 's2', 'name' => 'Mall Location', 'address' => '456 Mall Ave, Shopping Center'],
            ['id' => 's3', 'name' => 'Suburban Branch', 'address' => '789 Suburb St, Suburban'],
            ['id' => 's4', 'name' => 'Express Store', 'address' => '321 Quick Lane, Express'],
            ['id' => 's5', 'name' => 'Tea House', 'address' => '555 Tea Street, Downtown'],
            ['id' => 's6', 'name' => 'Snack Central', 'address' => '777 Snack Blvd, Mall'],
            ['id' => 's7', 'name' => 'Meat Master', 'address' => '999 Meat Ave, Suburban'],
            ['id' => 's8', 'name' => 'Health Plus', 'address' => '111 Health St, Downtown'],
            ['id' => 's9', 'name' => 'Korean Delights', 'address' => '333 Korean Way, Mall'],
            ['id' => 's10', 'name' => 'Citrus Corner', 'address' => '444 Citrus St, Express']
        ];

        // Mock categories data
        $categories = [
            ['id' => 'c1', 'name' => 'Fruits & Vegetables'],
            ['id' => 'c2', 'name' => 'Dairy & Eggs'],
            ['id' => 'c3', 'name' => 'Bakery'],
            ['id' => 'c4', 'name' => 'Meat & Seafood'],
            ['id' => 'c5', 'name' => 'Beverages'],
            ['id' => 'c6', 'name' => 'Snacks'],
            ['id' => 'c7', 'name' => 'Meat'],
            ['id' => 'c8', 'name' => 'Health'],
            ['id' => 'c9', 'name' => 'Fruits']
        ];

        return response()->json([
            'products' => $products,
            'stores' => $stores,
            'categories' => $categories
        ])->header('Cache-Control', 'no-cache, no-store, must-revalidate')
          ->header('Pragma', 'no-cache')
          ->header('Expires', '0');
    }

    public function show($id)
    {
        // Mock product data - in a real app, this would come from a database
        $products = [
            '1' => [
                'id' => '1',
                'name' => 'Organic Apples',
                'price' => 4.99,
                'originalPrice' => 6.99,
                'rating' => 4.5,
                'reviews' => 128,
                'image' => '🍎',
                'store' => 'Downtown Store',
                'category' => 'Fruits & Vegetables',
                'description' => 'Fresh, crisp organic apples grown locally. These apples are hand-picked at peak ripeness and are perfect for snacking, baking, or making fresh juice. Rich in fiber and vitamin C.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'Farm Fresh'],
                    ['key' => 'Weight', 'value' => '1 lb'],
                    ['key' => 'Origin', 'value' => 'Local Farm'],
                    ['key' => 'Certification', 'value' => 'USDA Organic'],
                    ['key' => 'Storage', 'value' => 'Refrigerate'],
                    ['key' => 'Shelf Life', 'value' => '2-3 weeks']
                ],
                'badges' => [
                    ['text' => 'Organic', 'color' => 'green'],
                    ['text' => 'Sale', 'color' => 'red']
                ],
                'inStock' => true,
                'stockCount' => 25
            ],
            '2' => [
                'id' => '2',
                'name' => 'Fresh Milk',
                'price' => 3.49,
                'originalPrice' => null,
                'rating' => 4.2,
                'reviews' => 89,
                'image' => '🥛',
                'store' => 'Mall Location',
                'category' => 'Dairy & Eggs',
                'description' => 'Farm-fresh whole milk from local dairy farms. Pasteurized for safety while maintaining natural flavor and nutrients. Perfect for drinking, cereal, or cooking.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'Dairy Fresh'],
                    ['key' => 'Volume', 'value' => '1 Gallon'],
                    ['key' => 'Fat Content', 'value' => '3.25%'],
                    ['key' => 'Pasteurized', 'value' => 'Yes'],
                    ['key' => 'Storage', 'value' => 'Refrigerate'],
                    ['key' => 'Shelf Life', 'value' => '7-10 days']
                ],
                'badges' => [
                    ['text' => 'Fresh', 'color' => 'blue']
                ],
                'inStock' => true,
                'stockCount' => 15
            ],
            '3' => [
                'id' => '3',
                'name' => 'Whole Wheat Bread',
                'price' => 2.99,
                'originalPrice' => 3.49,
                'rating' => 4.7,
                'reviews' => 156,
                'image' => '🍞',
                'store' => 'Suburban Branch',
                'category' => 'Bakery',
                'description' => 'Artisan whole wheat bread baked fresh daily. Made with premium whole wheat flour and natural ingredients. Perfect for sandwiches, toast, or as a side with meals.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'Bakery Fresh'],
                    ['key' => 'Weight', 'value' => '1 lb'],
                    ['key' => 'Ingredients', 'value' => 'Whole Wheat, Water, Salt, Yeast'],
                    ['key' => 'Preservatives', 'value' => 'None'],
                    ['key' => 'Storage', 'value' => 'Room Temperature'],
                    ['key' => 'Shelf Life', 'value' => '3-5 days']
                ],
                'badges' => [
                    ['text' => 'Fresh Baked', 'color' => 'brown'],
                    ['text' => 'No Preservatives', 'color' => 'green']
                ],
                'inStock' => true,
                'stockCount' => 8
            ],
            '4' => [
                'id' => '4',
                'name' => 'Chicken Breast',
                'price' => 8.99,
                'originalPrice' => null,
                'rating' => 4.3,
                'reviews' => 67,
                'image' => '🍗',
                'store' => 'Express Store',
                'category' => 'Meat & Seafood',
                'description' => 'Premium boneless chicken breast from free-range chickens. Tender, juicy, and perfect for grilling, baking, or pan-frying. High in protein and low in fat.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'Farm Raised'],
                    ['key' => 'Weight', 'value' => '1 lb'],
                    ['key' => 'Type', 'value' => 'Boneless'],
                    ['key' => 'Source', 'value' => 'Free Range'],
                    ['key' => 'Storage', 'value' => 'Refrigerate'],
                    ['key' => 'Shelf Life', 'value' => '2-3 days']
                ],
                'badges' => [
                    ['text' => 'Free Range', 'color' => 'green'],
                    ['text' => 'High Protein', 'color' => 'blue']
                ],
                'inStock' => true,
                'stockCount' => 12
            ],
            '5' => [
                'id' => '5',
                'name' => 'Cheddar Cheese',
                'price' => 5.99,
                'originalPrice' => 6.99,
                'rating' => 4.6,
                'reviews' => 94,
                'image' => '🧀',
                'store' => 'Mall Location',
                'category' => 'Dairy & Eggs',
                'description' => 'Aged cheddar cheese with rich, sharp flavor. Perfect for snacking, sandwiches, or cooking. Made from premium milk and aged to perfection.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'Cheese Masters'],
                    ['key' => 'Weight', 'value' => '8 oz'],
                    ['key' => 'Age', 'value' => '6 months'],
                    ['key' => 'Type', 'value' => 'Sharp Cheddar'],
                    ['key' => 'Storage', 'value' => 'Refrigerate'],
                    ['key' => 'Shelf Life', 'value' => '2-3 weeks']
                ],
                'badges' => [
                    ['text' => 'Aged', 'color' => 'yellow'],
                    ['text' => 'Sale', 'color' => 'red']
                ],
                'inStock' => true,
                'stockCount' => 18
            ],
            '6' => [
                'id' => '6',
                'name' => 'Spinach',
                'price' => 2.49,
                'originalPrice' => null,
                'rating' => 4.1,
                'reviews' => 43,
                'image' => '🥬',
                'store' => 'Downtown Store',
                'category' => 'Fruits & Vegetables',
                'description' => 'Fresh, leafy spinach packed with vitamins and minerals. Perfect for salads, smoothies, or cooking. Grown locally and harvested at peak freshness.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'Green Valley'],
                    ['key' => 'Weight', 'value' => '5 oz'],
                    ['key' => 'Type', 'value' => 'Baby Spinach'],
                    ['key' => 'Source', 'value' => 'Local Farm'],
                    ['key' => 'Storage', 'value' => 'Refrigerate'],
                    ['key' => 'Shelf Life', 'value' => '5-7 days']
                ],
                'badges' => [
                    ['text' => 'Fresh', 'color' => 'green'],
                    ['text' => 'Local', 'color' => 'blue']
                ],
                'inStock' => true,
                'stockCount' => 22
            ],
            '7' => [
                'id' => '7',
                'name' => 'Lipton Lemon Green Tea',
                'price' => 2.35,
                'originalPrice' => 3.00,
                'rating' => 4.8,
                'reviews' => 92,
                'image' => '🍵',
                'store' => 'Tea House',
                'category' => 'Beverages',
                'description' => 'Refreshing green tea with natural lemon flavor. Made from premium tea leaves and enriched with antioxidants. Perfect for a healthy lifestyle.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'Lipton'],
                    ['key' => 'Weight', 'value' => '100g'],
                    ['key' => 'Type', 'value' => 'Green Tea'],
                    ['key' => 'Flavor', 'value' => 'Lemon'],
                    ['key' => 'Storage', 'value' => 'Dry Place'],
                    ['key' => 'Shelf Life', 'value' => '2 years']
                ],
                'badges' => [
                    ['text' => '20% OFF', 'color' => 'orange'],
                    ['text' => 'Organic', 'color' => 'green']
                ],
                'inStock' => true,
                'stockCount' => 15
            ],
            '8' => [
                'id' => '8',
                'name' => 'Lay\'s Tomato Ketchup Chips',
                'price' => 4.40,
                'rating' => 4.8,
                'reviews' => 167,
                'image' => '🍟',
                'store' => 'Snack Central',
                'category' => 'Snacks',
                'description' => 'Crispy potato chips with tangy tomato ketchup flavor. Made from premium potatoes and natural seasonings. Perfect for snacking.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'Lay\'s'],
                    ['key' => 'Weight', 'value' => '150g'],
                    ['key' => 'Type', 'value' => 'Potato Chips'],
                    ['key' => 'Flavor', 'value' => 'Tomato Ketchup'],
                    ['key' => 'Storage', 'value' => 'Room Temperature'],
                    ['key' => 'Shelf Life', 'value' => '6 months']
                ],
                'badges' => [],
                'inStock' => true,
                'stockCount' => 30
            ],
            '9' => [
                'id' => '9',
                'name' => 'Arabian Beef Meat Kirkland Signature Roast',
                'price' => 24.00,
                'rating' => 4.8,
                'reviews' => 134,
                'image' => '🥩',
                'store' => 'Meat Master',
                'category' => 'Meat',
                'description' => 'Premium Arabian beef roast from Kirkland Signature. Tender, flavorful meat perfect for special occasions and family dinners.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'Kirkland Signature'],
                    ['key' => 'Weight', 'value' => '2 lbs'],
                    ['key' => 'Type', 'value' => 'Beef Roast'],
                    ['key' => 'Origin', 'value' => 'Arabian'],
                    ['key' => 'Storage', 'value' => 'Refrigerate'],
                    ['key' => 'Shelf Life', 'value' => '3-5 days']
                ],
                'badges' => [
                    ['text' => 'Best Sale', 'color' => 'red']
                ],
                'inStock' => true,
                'stockCount' => 8
            ],
            '10' => [
                'id' => '10',
                'name' => 'APLIFE Black Seed Honey',
                'price' => 30.25,
                'rating' => 4.8,
                'reviews' => 67,
                'image' => '🍯',
                'store' => 'Health Plus',
                'category' => 'Health',
                'description' => 'Pure black seed honey with natural health benefits. Rich in antioxidants and nutrients. Perfect for boosting immunity and overall wellness.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'APLIFE'],
                    ['key' => 'Weight', 'value' => '500g'],
                    ['key' => 'Type', 'value' => 'Black Seed Honey'],
                    ['key' => 'Source', 'value' => 'Natural'],
                    ['key' => 'Storage', 'value' => 'Room Temperature'],
                    ['key' => 'Shelf Life', 'value' => '2 years']
                ],
                'badges' => [
                    ['text' => 'Premium', 'color' => 'yellow']
                ],
                'inStock' => true,
                'stockCount' => 12
            ],
            '11' => [
                'id' => '11',
                'name' => 'Seoul Yopokki Spicy Korean Topokki',
                'price' => 0.40,
                'rating' => 4.8,
                'reviews' => 89,
                'image' => '🍜',
                'store' => 'Korean Delights',
                'category' => 'Snacks',
                'description' => 'Authentic Korean rice cake snack with spicy flavor. Made from premium rice flour and traditional Korean seasonings.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'Seoul'],
                    ['key' => 'Weight', 'value' => '80g'],
                    ['key' => 'Type', 'value' => 'Rice Cake'],
                    ['key' => 'Flavor', 'value' => 'Spicy'],
                    ['key' => 'Storage', 'value' => 'Room Temperature'],
                    ['key' => 'Shelf Life', 'value' => '1 year']
                ],
                'badges' => [],
                'inStock' => true,
                'stockCount' => 25
            ],
            '12' => [
                'id' => '12',
                'name' => 'Lemon Big imported from South Africa',
                'price' => 4.40,
                'rating' => 4.8,
                'reviews' => 92,
                'image' => '🍋',
                'store' => 'Citrus Corner',
                'category' => 'Fruits',
                'description' => 'Large, juicy lemons imported from South Africa. Perfect for cooking, baking, and making fresh lemonade. Rich in vitamin C.',
                'specifications' => [
                    ['key' => 'Brand', 'value' => 'FreshMart'],
                    ['key' => 'Weight', 'value' => '1 kg'],
                    ['key' => 'Type', 'value' => 'Lemon'],
                    ['key' => 'Origin', 'value' => 'South Africa'],
                    ['key' => 'Storage', 'value' => 'Refrigerate'],
                    ['key' => 'Shelf Life', 'value' => '2-3 weeks']
                ],
                'badges' => [
                    ['text' => 'Best Sale', 'color' => 'red'],
                    ['text' => 'Organic', 'color' => 'green']
                ],
                'inStock' => true,
                'stockCount' => 18
            ]
        ];

        // Mock reviews data
        $reviews = [
            '1' => [
                [
                    'id' => '1',
                    'user' => ['name' => 'Sarah Johnson'],
                    'rating' => 5,
                    'comment' => 'Excellent quality apples! Very fresh and sweet. Perfect for my morning smoothies.',
                    'date' => '2024-01-15',
                    'helpful' => 12,
                    'verified' => true
                ],
                [
                    'id' => '2',
                    'user' => ['name' => 'Mike Chen'],
                    'rating' => 4,
                    'comment' => 'Good apples, arrived fresh. The organic certification gives me peace of mind.',
                    'date' => '2024-01-10',
                    'helpful' => 8,
                    'verified' => true
                ],
                [
                    'id' => '3',
                    'user' => ['name' => 'Emily Davis'],
                    'rating' => 5,
                    'comment' => 'Amazing taste! These are the best organic apples I\'ve had in a while. Will definitely order again.',
                    'date' => '2024-01-08',
                    'helpful' => 15,
                    'verified' => false
                ]
            ],
            '2' => [
                [
                    'id' => '4',
                    'user' => ['name' => 'John Smith'],
                    'rating' => 4,
                    'comment' => 'Fresh milk with great taste. My family loves it for breakfast.',
                    'date' => '2024-01-12',
                    'helpful' => 6,
                    'verified' => true
                ],
                [
                    'id' => '5',
                    'user' => ['name' => 'Lisa Brown'],
                    'rating' => 5,
                    'comment' => 'Perfect milk for coffee and cereal. Very fresh and creamy.',
                    'date' => '2024-01-09',
                    'helpful' => 9,
                    'verified' => true
                ]
            ],
            '3' => [
                [
                    'id' => '6',
                    'user' => ['name' => 'David Wilson'],
                    'rating' => 5,
                    'comment' => 'Best bread I\'ve ever had! Fresh baked daily and no preservatives.',
                    'date' => '2024-01-14',
                    'helpful' => 11,
                    'verified' => true
                ],
                [
                    'id' => '7',
                    'user' => ['name' => 'Maria Garcia'],
                    'rating' => 4,
                    'comment' => 'Great quality bread. Perfect for sandwiches and toast.',
                    'date' => '2024-01-11',
                    'helpful' => 7,
                    'verified' => false
                ]
            ],
            '4' => [
                [
                    'id' => '8',
                    'user' => ['name' => 'Robert Taylor'],
                    'rating' => 4,
                    'comment' => 'Good quality chicken breast. Tender and flavorful.',
                    'date' => '2024-01-13',
                    'helpful' => 5,
                    'verified' => true
                ],
                [
                    'id' => '9',
                    'user' => ['name' => 'Jennifer Lee'],
                    'rating' => 5,
                    'comment' => 'Excellent chicken breast! Perfect for grilling.',
                    'date' => '2024-01-07',
                    'helpful' => 8,
                    'verified' => true
                ]
            ],
            '5' => [
                [
                    'id' => '10',
                    'user' => ['name' => 'Michael Johnson'],
                    'rating' => 5,
                    'comment' => 'Amazing cheddar cheese! Sharp and flavorful.',
                    'date' => '2024-01-16',
                    'helpful' => 10,
                    'verified' => true
                ],
                [
                    'id' => '11',
                    'user' => ['name' => 'Amanda White'],
                    'rating' => 4,
                    'comment' => 'Good quality cheese. Great for cooking and snacking.',
                    'date' => '2024-01-05',
                    'helpful' => 4,
                    'verified' => false
                ]
            ],
            '6' => [
                [
                    'id' => '12',
                    'user' => ['name' => 'Christopher Davis'],
                    'rating' => 4,
                    'comment' => 'Fresh spinach. Perfect for salads and smoothies.',
                    'date' => '2024-01-17',
                    'helpful' => 3,
                    'verified' => true
                ],
                [
                    'id' => '13',
                    'user' => ['name' => 'Jessica Martinez'],
                    'rating' => 5,
                    'comment' => 'Excellent spinach! Very fresh and clean.',
                    'date' => '2024-01-06',
                    'helpful' => 6,
                    'verified' => true
                ]
            ],
            '7' => [
                [
                    'id' => '14',
                    'user' => ['name' => 'Alex Thompson'],
                    'rating' => 5,
                    'comment' => 'Great green tea! Very refreshing and healthy.',
                    'date' => '2024-01-18',
                    'helpful' => 7,
                    'verified' => true
                ],
                [
                    'id' => '15',
                    'user' => ['name' => 'Sarah Wilson'],
                    'rating' => 4,
                    'comment' => 'Good quality tea with nice lemon flavor.',
                    'date' => '2024-01-15',
                    'helpful' => 4,
                    'verified' => false
                ]
            ],
            '8' => [
                [
                    'id' => '16',
                    'user' => ['name' => 'Mike Rodriguez'],
                    'rating' => 5,
                    'comment' => 'Love these chips! Perfect ketchup flavor.',
                    'date' => '2024-01-19',
                    'helpful' => 12,
                    'verified' => true
                ],
                [
                    'id' => '17',
                    'user' => ['name' => 'Lisa Chen'],
                    'rating' => 4,
                    'comment' => 'Good chips, great for snacking.',
                    'date' => '2024-01-16',
                    'helpful' => 6,
                    'verified' => true
                ]
            ],
            '9' => [
                [
                    'id' => '18',
                    'user' => ['name' => 'David Brown'],
                    'rating' => 5,
                    'comment' => 'Excellent beef roast! Very tender and flavorful.',
                    'date' => '2024-01-20',
                    'helpful' => 9,
                    'verified' => true
                ],
                [
                    'id' => '19',
                    'user' => ['name' => 'Maria Garcia'],
                    'rating' => 4,
                    'comment' => 'Good quality meat, perfect for special dinners.',
                    'date' => '2024-01-17',
                    'helpful' => 5,
                    'verified' => false
                ]
            ],
            '10' => [
                [
                    'id' => '20',
                    'user' => ['name' => 'John Smith'],
                    'rating' => 5,
                    'comment' => 'Amazing honey! Great for health benefits.',
                    'date' => '2024-01-21',
                    'helpful' => 8,
                    'verified' => true
                ],
                [
                    'id' => '21',
                    'user' => ['name' => 'Emma Davis'],
                    'rating' => 4,
                    'comment' => 'Good quality honey, worth the price.',
                    'date' => '2024-01-18',
                    'helpful' => 3,
                    'verified' => true
                ]
            ],
            '11' => [
                [
                    'id' => '22',
                    'user' => ['name' => 'James Lee'],
                    'rating' => 5,
                    'comment' => 'Authentic Korean flavor! Very spicy and delicious.',
                    'date' => '2024-01-22',
                    'helpful' => 11,
                    'verified' => true
                ],
                [
                    'id' => '23',
                    'user' => ['name' => 'Anna Kim'],
                    'rating' => 4,
                    'comment' => 'Good Korean snack, reminds me of home.',
                    'date' => '2024-01-19',
                    'helpful' => 7,
                    'verified' => false
                ]
            ],
            '12' => [
                [
                    'id' => '24',
                    'user' => ['name' => 'Tom Wilson'],
                    'rating' => 5,
                    'comment' => 'Fresh lemons! Perfect for cooking and baking.',
                    'date' => '2024-01-23',
                    'helpful' => 10,
                    'verified' => true
                ],
                [
                    'id' => '25',
                    'user' => ['name' => 'Rachel Green'],
                    'rating' => 4,
                    'comment' => 'Good quality lemons, very juicy.',
                    'date' => '2024-01-20',
                    'helpful' => 4,
                    'verified' => true
                ]
            ]
        ];

        // Check if product exists
        if (!isset($products[$id])) {
            abort(404, 'Product not found');
        }

        $product = $products[$id];
        $productReviews = $reviews[$id] ?? [];
        
        // Calculate average rating
        $totalRating = 0;
        $reviewCount = count($productReviews);
        
        if ($reviewCount > 0) {
            foreach ($productReviews as $review) {
                $totalRating += $review['rating'];
            }
            $averageRating = $totalRating / $reviewCount;
        } else {
            $averageRating = $product['rating']; // Use product's default rating
        }

        return Inertia::render('products/show', [
            'product' => $product,
            'reviews' => $productReviews,
            'averageRating' => round($averageRating, 1),
            'totalReviews' => $reviewCount
        ]);
    }
}