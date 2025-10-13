<?php

namespace App\Observers;

use App\Models\Order;
use App\Notifications\OrderConfirmationNotification;
use App\Notifications\OrderStatusUpdateNotification;
use App\Notifications\OrderShippedNotification;
use App\Notifications\NewOrderAdminNotification;

class OrderObserver
{
    /**
     * Handle the Order "created" event.
     */
    public function created(Order $order): void
    {
        try {
            // Send order confirmation email to customer
            $order->user->notify(new OrderConfirmationNotification($order));
        } catch (\Exception $e) {
            \Log::error('Failed to send order confirmation email', [
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'error' => $e->getMessage(),
            ]);
        }
        
        try {
            // Send notification to all admin users (super_admin and admin roles)
            $adminUsers = \App\Models\User::whereIn('role', ['admin', 'super_admin'])->get();
            foreach ($adminUsers as $admin) {
                $admin->notify(new NewOrderAdminNotification($order));
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send admin notification', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        // Check if status changed
        if ($order->isDirty('status')) {
            $oldStatus = $order->getOriginal('status');
            $newStatus = $order->status;

            try {
                // Send status update notification
                $order->user->notify(new OrderStatusUpdateNotification($order, $oldStatus, $newStatus));
            } catch (\Exception $e) {
                \Log::error('Failed to send status update notification', [
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Check if tracking information was added (order shipped)
        if ($order->isDirty('tracking_code') && $order->tracking_code) {
            try {
                $order->user->notify(new OrderShippedNotification($order));
            } catch (\Exception $e) {
                \Log::error('Failed to send shipping notification', [
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Handle the Order "deleted" event.
     */
    public function deleted(Order $order): void
    {
        //
    }

    /**
     * Handle the Order "restored" event.
     */
    public function restored(Order $order): void
    {
        //
    }

    /**
     * Handle the Order "force deleted" event.
     */
    public function forceDeleted(Order $order): void
    {
        //
    }
}
