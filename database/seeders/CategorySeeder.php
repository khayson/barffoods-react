<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Fruits & Vegetables',
                'icon' => '🥬',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Dairy & Eggs',
                'icon' => '🥛',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Meat & Seafood',
                'icon' => '🥩',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Bakery',
                'icon' => '🍞',
                'sort_order' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'Beverages',
                'icon' => '🥤',
                'sort_order' => 5,
                'is_active' => true,
            ],
            [
                'name' => 'Snacks',
                'icon' => '🍿',
                'sort_order' => 6,
                'is_active' => true,
            ],
            [
                'name' => 'Pantry Essentials',
                'icon' => '🥫',
                'sort_order' => 7,
                'is_active' => true,
            ],
            [
                'name' => 'Frozen Foods',
                'icon' => '🧊',
                'sort_order' => 8,
                'is_active' => true,
            ],
            [
                'name' => 'Health & Wellness',
                'icon' => '💊',
                'sort_order' => 9,
                'is_active' => true,
            ],
            [
                'name' => 'Household',
                'icon' => '🧽',
                'sort_order' => 10,
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
