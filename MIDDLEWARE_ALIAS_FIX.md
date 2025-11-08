# Middleware Alias Registration Fix

## Problem

Getting error when accessing `/admin/dashboard`:
```
Target class [role] does not exist.
```

## Root Cause

In `bootstrap/app.php`, there were **TWO separate** `$middleware->alias()` calls:

```php
// First call - role-based middleware
$middleware->alias([
    'role' => CheckRole::class,
    'admin' => EnsureUserIsAdmin::class,
    'customer' => EnsureUserIsCustomer::class,
]);

// Second call - throttle middleware  
$middleware->alias([
    'throttle.auth' => \Illuminate\Routing\Middleware\ThrottleRequests::class . ':auth',
    'throttle.payment' => \Illuminate\Routing\Middleware\ThrottleRequests::class . ':payment',
    'throttle.api' => \Illuminate\Routing\Middleware\ThrottleRequests::class . ':api',
]);
```

**The second `alias()` call was overwriting the first one**, so only the throttle middleware aliases were registered, not the role-based ones.

## Solution

Combined both `alias()` calls into a single call:

```php
// Register middleware aliases
$middleware->alias([
    // Role-based middleware
    'role' => CheckRole::class,
    'admin' => EnsureUserIsAdmin::class,
    'customer' => EnsureUserIsCustomer::class,
    // Custom rate limiters
    'throttle.auth' => \Illuminate\Routing\Middleware\ThrottleRequests::class . ':auth',
    'throttle.payment' => \Illuminate\Routing\Middleware\ThrottleRequests::class . ':payment',
    'throttle.api' => \Illuminate\Routing\Middleware\ThrottleRequests::class . ':api',
]);
```

## Verification

Before fix:
```php
Array
(
    [throttle.auth] => ...
    [throttle.payment] => ...
    [throttle.api] => ...
    // ❌ role, admin, customer missing!
)
```

After fix:
```php
Array
(
    [role] => App\Http\Middleware\CheckRole
    [admin] => App\Http\Middleware\EnsureUserIsAdmin
    [customer] => App\Http\Middleware\EnsureUserIsCustomer
    [throttle.auth] => ...
    [throttle.payment] => ...
    [throttle.api] => ...
    // ✅ All aliases registered!
)
```

## Files Modified

- `bootstrap/app.php` - Combined middleware alias registrations

## Commands Run

```bash
php artisan optimize:clear
```

## Status

✅ **FIXED** - Admin dashboard and all role-protected routes now work correctly.

## Impact

All routes using these middleware now work:
- ✅ `middleware(['role:super_admin'])` 
- ✅ `middleware(['admin'])`
- ✅ `middleware(['customer'])`
- ✅ All admin routes
- ✅ All customer-only routes

## Lesson Learned

In Laravel 11, calling `$middleware->alias()` multiple times **overwrites** previous aliases instead of merging them. Always combine all middleware aliases into a single `alias()` call.
