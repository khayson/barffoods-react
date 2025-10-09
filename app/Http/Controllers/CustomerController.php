<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Display the customer dashboard.
     */
    public function dashboard(): Response
    {
        return Inertia::render('customer/dashboard');
    }
}
