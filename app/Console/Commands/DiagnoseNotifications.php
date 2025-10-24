<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DiagnoseNotifications extends Command
{
    protected $signature = 'notifications:diagnose';
    protected $description = 'Diagnose notification assignment issues';

    public function handle()
    {
        $this->info('=== Notification Diagnostics ===');
        $this->newLine();

        // All users
        $this->info('All users in system:');
        $users = DB::table('users')->get(['id', 'name', 'email', 'role']);
        foreach ($users as $user) {
            $this->line("  ID: {$user->id} | {$user->name} | {$user->email} | Role: {$user->role}");
        }
        $this->newLine();

        // Total notifications
        $total = DB::table('notifications')->count();
        $this->info("Total notifications: {$total}");
        $this->newLine();

        // Notifications by user
        $this->info('Notifications by user:');
        $byUser = DB::table('notifications')
            ->select('notifiable_id', DB::raw('count(*) as count'))
            ->groupBy('notifiable_id')
            ->get();

        foreach ($byUser as $row) {
            $user = DB::table('users')->where('id', $row->notifiable_id)->first();
            $userName = $user ? "{$user->name} ({$user->role})" : 'Unknown';
            $this->line("  User ID {$row->notifiable_id} ({$userName}): {$row->count} notifications");
        }
        $this->newLine();

        // Recent notifications
        $this->info('Recent 5 notifications:');
        $recent = DB::table('notifications')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($recent as $notification) {
            $user = DB::table('users')->where('id', $notification->notifiable_id)->first();
            $userName = $user ? "{$user->name} ({$user->role})" : 'Unknown';
            $data = json_decode($notification->data, true);
            $title = $data['title'] ?? 'No title';
            $actionUrl = $data['action_url'] ?? 'No URL';
            
            $this->line("  - {$title}");
            $this->line("    For: User ID {$notification->notifiable_id} ({$userName})");
            $this->line("    Type: {$notification->type}");
            $this->line("    Action URL: {$actionUrl}");
            $this->line("    Created: {$notification->created_at}");
            $this->newLine();
        }

        return 0;
    }
}

