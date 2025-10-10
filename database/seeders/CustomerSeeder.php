<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\CustomerProfile;
use Illuminate\Support\Facades\Hash;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            [
                'name' => 'John Customer',
                'email' => 'customer1@example.com',
                'phone' => '+1234567890',
                'password' => 'password',
                'profile' => [
                    'date_of_birth' => '1990-05-15',
                    'gender' => 'male',
                    'dietary_preferences' => ['vegetarian', 'organic'],
                    'allergies' => ['nuts'],
                    'notification_preferences' => [
                        'email' => true,
                        'sms' => true,
                        'push' => true,
                    ],
                ],
            ],
            [
                'name' => 'Jane Customer',
                'email' => 'customer2@example.com',
                'phone' => '+1234567891',
                'password' => 'password',
                'profile' => [
                    'date_of_birth' => '1985-08-22',
                    'gender' => 'female',
                    'dietary_preferences' => ['vegan', 'gluten-free'],
                    'allergies' => ['dairy', 'soy'],
                    'notification_preferences' => [
                        'email' => true,
                        'sms' => false,
                        'push' => true,
                    ],
                ],
            ],
            [
                'name' => 'Bob Customer',
                'email' => 'customer3@example.com',
                'phone' => '+1234567892',
                'password' => 'password',
                'profile' => [
                    'date_of_birth' => '1992-12-10',
                    'gender' => 'male',
                    'dietary_preferences' => ['keto'],
                    'allergies' => [],
                    'notification_preferences' => [
                        'email' => true,
                        'sms' => true,
                        'push' => false,
                    ],
                ],
            ],
            [
                'name' => 'Alice Customer',
                'email' => 'customer4@example.com',
                'phone' => '+1234567893',
                'password' => 'password',
                'profile' => [
                    'date_of_birth' => '1988-03-25',
                    'gender' => 'female',
                    'dietary_preferences' => ['paleo', 'organic'],
                    'allergies' => ['shellfish'],
                    'notification_preferences' => [
                        'email' => false,
                        'sms' => true,
                        'push' => true,
                    ],
                ],
            ],
            [
                'name' => 'Mike Customer',
                'email' => 'customer5@example.com',
                'phone' => '+1234567894',
                'password' => 'password',
                'profile' => [
                    'date_of_birth' => '1995-07-18',
                    'gender' => 'male',
                    'dietary_preferences' => [],
                    'allergies' => [],
                    'notification_preferences' => [
                        'email' => true,
                        'sms' => true,
                        'push' => true,
                    ],
                ],
            ],
        ];

        foreach ($customers as $customerData) {
            // Check if customer already exists
            $existingCustomer = User::where('email', $customerData['email'])->first();
            
            if ($existingCustomer) {
                $this->command->info("Customer {$customerData['name']} already exists, skipping...");
                continue;
            }

            // Create customer user
            $customer = User::create([
                'name' => $customerData['name'],
                'email' => $customerData['email'],
                'phone' => $customerData['phone'],
                'password' => Hash::make($customerData['password']),
                'role' => 'customer',
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            // Create customer profile
            CustomerProfile::create([
                'user_id' => $customer->id,
                'date_of_birth' => $customerData['profile']['date_of_birth'],
                'gender' => $customerData['profile']['gender'],
                'dietary_preferences' => $customerData['profile']['dietary_preferences'],
                'allergies' => $customerData['profile']['allergies'],
                'notification_preferences' => $customerData['profile']['notification_preferences'],
            ]);

            $this->command->info("Created customer: {$customer->name} ({$customer->email})");
        }

        $this->command->info('Customer seeding completed successfully!');
        $this->command->info('Total customers: ' . User::where('role', 'customer')->count());
    }
}
