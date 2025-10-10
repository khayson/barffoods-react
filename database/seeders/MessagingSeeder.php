<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\ConversationParticipant;

class MessagingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing users from the database
        $admin = User::where('role', 'super_admin')->first();
        $customers = User::where('role', 'customer')->where('is_active', true)->get();

        // Check if we have the required users
        if (!$admin) {
            $this->command->error('No admin user found. Please run SuperAdminSeeder first.');
            return;
        }

        if ($customers->count() < 2) {
            $this->command->error('Need at least 2 customer users. Please create more customer users first.');
            return;
        }

        $customer1 = $customers->first();
        $customer2 = $customers->skip(1)->first();

        // Create test conversations
        $conversations = [
            [
                'subject' => 'Order Issue',
                'status' => 'open',
                'priority' => 'high',
                'customer' => $customer1,
                'messages' => [
                    ['content' => 'Hi, I have an issue with my recent order #12345. The items arrived damaged.', 'user' => $customer1],
                    ['content' => 'I\'m sorry to hear about the damaged items. Let me look into this for you right away.', 'user' => $admin],
                ]
            ],
            [
                'subject' => 'Product Question',
                'status' => 'in_progress',
                'priority' => 'medium',
                'customer' => $customer2,
                'messages' => [
                    ['content' => 'Hello, I\'m looking for information about your organic vegetables. Do you have any seasonal availability?', 'user' => $customer2],
                    ['content' => 'Yes, we have a great selection of organic vegetables! Let me send you our seasonal availability chart.', 'user' => $admin],
                    ['content' => 'That would be perfect, thank you!', 'user' => $customer2],
                ]
            ],
            [
                'subject' => 'Delivery Problem',
                'status' => 'open',
                'priority' => 'urgent',
                'customer' => $customer1,
                'messages' => [
                    ['content' => 'URGENT: My delivery was scheduled for today but I haven\'t received it yet. This is for a party tonight!', 'user' => $customer1],
                ]
            ],
            [
                'subject' => 'Account Help',
                'status' => 'resolved',
                'priority' => 'low',
                'customer' => $customer2,
                'messages' => [
                    ['content' => 'I can\'t log into my account. Can you help me reset my password?', 'user' => $customer2],
                    ['content' => 'Of course! I\'ve sent you a password reset link to your email address.', 'user' => $admin],
                    ['content' => 'Perfect, I got it and was able to reset my password. Thank you!', 'user' => $customer2],
                    ['content' => 'You\'re welcome! Is there anything else I can help you with?', 'user' => $admin],
                ]
            ],
        ];

        foreach ($conversations as $convData) {
            // Create conversation
            $conversation = Conversation::create([
                'subject' => $convData['subject'],
                'status' => $convData['status'],
                'priority' => $convData['priority'],
                'assigned_to' => $admin->id,
                'last_message_at' => now(),
            ]);

            // Add participants
            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $convData['customer']->id,
                'role' => 'customer',
                'joined_at' => now(),
                'is_active' => true,
            ]);

            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $admin->id,
                'role' => 'admin',
                'joined_at' => now(),
                'is_active' => true,
            ]);

            // Create messages
            foreach ($convData['messages'] as $index => $msgData) {
                $message = Message::create([
                    'conversation_id' => $conversation->id,
                    'user_id' => $msgData['user']->id,
                    'content' => $msgData['content'],
                    'type' => 'text',
                    'is_read' => true,
                    'read_at' => now(),
                ]);

                // Mark message as read by the other participant
                $otherParticipant = $msgData['user']->id === $admin->id ? $convData['customer'] : $admin;
                $message->markAsReadBy($otherParticipant->id);
            }
        }

        $this->command->info('Messaging test data seeded successfully!');
        $this->command->info("Created conversations for admin: {$admin->name} ({$admin->email})");
        $this->command->info("Used customers: {$customer1->name} ({$customer1->email}) and {$customer2->name} ({$customer2->email})");
    }
}
