<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Display the admin dashboard.
     */
    public function dashboard(): Response
    {
        return Inertia::render('admin/dashboard');
    }

    /**
     * Display the admin notifications page.
     */
    public function notifications(): Response
    {
        $notifications = Notification::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        $users = User::select('id', 'name', 'email', 'role')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/notifications', [
            'notifications' => $notifications,
            'users' => $users,
        ]);
    }
}
