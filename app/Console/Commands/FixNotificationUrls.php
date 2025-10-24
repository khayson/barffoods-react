<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Notification;

class FixNotificationUrls extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:fix-urls';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix old notification URLs to use query parameters instead of route parameters';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing notification URLs...');

        $notifications = Notification::all();
        $updated = 0;

        foreach ($notifications as $notification) {
            $data = $notification->data;
            
            // Get the user to determine role
            $user = \App\Models\User::find($notification->notifiable_id);
            
            // Check if action_url exists and contains old formats
            if (isset($data['action_url']) && $user) {
                $updated_this = false;
                
                // Fix admin messaging URLs (old format without ?open=)
                if (str_contains($data['action_url'], '/admin/messaging/') &&
                    !str_contains($data['action_url'], '?open=')) {
                    
                    if (preg_match('#/admin/messaging/(\d+)$#', $data['action_url'], $matches)) {
                        $conversationId = $matches[1];
                        
                        // Choose correct URL based on user role
                        if ($user->role === 'customer') {
                            $data['action_url'] = "/dashboard?open={$conversationId}";
                        } else {
                            $data['action_url'] = "/admin/messaging?open={$conversationId}";
                        }
                        $updated_this = true;
                    }
                }
                
                // Fix admin messaging URLs that were already updated but for wrong role
                if (str_contains($data['action_url'], '/admin/messaging?open=') && $user->role === 'customer') {
                    if (preg_match('#/admin/messaging\?open=(\d+)$#', $data['action_url'], $matches)) {
                        $conversationId = $matches[1];
                        $data['action_url'] = "/dashboard?open={$conversationId}";
                        $updated_this = true;
                        $this->warn("Fixed role mismatch: customer had admin URL");
                    }
                }
                
                // Fix customer messaging URLs (old format)
                if (str_contains($data['action_url'], '/customer/messaging/')) {
                    if (preg_match('#/customer/messaging/(\d+)$#', $data['action_url'], $matches)) {
                        $conversationId = $matches[1];
                        $data['action_url'] = "/dashboard?open={$conversationId}";
                        $updated_this = true;
                    }
                }
                
                if ($updated_this) {
                    $notification->update(['data' => $data]);
                    $updated++;
                    $this->line("Updated notification {$notification->id}: {$data['action_url']}");
                }
            }
        }

        $this->info("\n✅ Fixed {$updated} notification(s)!");
        
        return 0;
    }
}


