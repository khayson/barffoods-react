<?php

namespace App\Exceptions;

use App\Exceptions\Payment\PaymentException;
use App\Exceptions\Shipping\ShippingException;
use App\Exceptions\Order\OrderException;
use App\Exceptions\Inventory\InventoryException;
use App\Helpers\LogHelper;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ThrottleRequestsException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        PaymentException::class => 'critical',
        OrderException::class => 'error',
        ShippingException::class => 'warning',
        InventoryException::class => 'warning',
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        ValidationException::class,
        AuthenticationException::class,
        AuthorizationException::class,
        ModelNotFoundException::class,
        NotFoundHttpException::class,
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
        'new_password',
        'token',
        'secret',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            $this->logException($e);
        });

        // Payment exceptions
        $this->renderable(function (PaymentException $e, Request $request) {
            return $this->handlePaymentException($e, $request);
        });

        // Shipping exceptions
        $this->renderable(function (ShippingException $e, Request $request) {
            return $this->handleShippingException($e, $request);
        });

        // Order exceptions
        $this->renderable(function (OrderException $e, Request $request) {
            return $this->handleOrderException($e, $request);
        });

        // Inventory exceptions
        $this->renderable(function (InventoryException $e, Request $request) {
            return $this->handleInventoryException($e, $request);
        });

        // Throttle exceptions
        $this->renderable(function (ThrottleRequestsException $e, Request $request) {
            return $this->handleThrottleException($e, $request);
        });
    }

    /**
     * Log exception with context
     */
    protected function logException(Throwable $e): void
    {
        $context = [
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
            'url' => request()->fullUrl(),
            'method' => request()->method(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'user_id' => auth()->id(),
        ];

        // Log to appropriate channel based on exception type
        if ($e instanceof PaymentException) {
            LogHelper::payment('Payment exception occurred', $context, 'error');
        } elseif ($e instanceof ShippingException) {
            LogHelper::shipping('Shipping exception occurred', $context, 'error');
        } elseif ($e instanceof OrderException) {
            LogHelper::audit('order_exception', 'Order', $context);
        } else {
            LogHelper::exception($e, $context);
        }
    }

    /**
     * Handle payment exceptions
     */
    protected function handlePaymentException(PaymentException $e, Request $request)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Payment processing failed. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Payment error occurred',
                'error_code' => 'PAYMENT_ERROR',
                'timestamp' => now()->toIso8601String(),
            ], 500);
        }

        return back()->withErrors([
            'payment' => 'Payment processing failed. Please try again or contact support.',
        ])->withInput();
    }

    /**
     * Handle shipping exceptions
     */
    protected function handleShippingException(ShippingException $e, Request $request)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Shipping calculation failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Shipping error occurred',
                'error_code' => 'SHIPPING_ERROR',
                'timestamp' => now()->toIso8601String(),
            ], 500);
        }

        return back()->withErrors([
            'shipping' => 'Unable to calculate shipping. Please try again.',
        ])->withInput();
    }

    /**
     * Handle order exceptions
     */
    protected function handleOrderException(OrderException $e, Request $request)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Order processing failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Order error occurred',
                'error_code' => 'ORDER_ERROR',
                'timestamp' => now()->toIso8601String(),
            ], 500);
        }

        return back()->withErrors([
            'order' => 'Unable to process your order. Please try again.',
        ])->withInput();
    }

    /**
     * Handle inventory exceptions
     */
    protected function handleInventoryException(InventoryException $e, Request $request)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_code' => 'INVENTORY_ERROR',
                'timestamp' => now()->toIso8601String(),
            ], 400);
        }

        return back()->withErrors([
            'inventory' => $e->getMessage(),
        ])->withInput();
    }

    /**
     * Handle throttle exceptions
     */
    protected function handleThrottleException(ThrottleRequestsException $e, Request $request)
    {
        $retryAfter = $e->getHeaders()['Retry-After'] ?? 60;

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Too many requests. Please try again later.',
                'error_code' => 'RATE_LIMIT_EXCEEDED',
                'retry_after' => $retryAfter,
                'timestamp' => now()->toIso8601String(),
            ], 429, [
                'Retry-After' => $retryAfter,
                'X-RateLimit-Limit' => $e->getHeaders()['X-RateLimit-Limit'] ?? null,
                'X-RateLimit-Remaining' => 0,
            ]);
        }

        return back()->withErrors([
            'rate_limit' => "Too many requests. Please wait {$retryAfter} seconds and try again.",
        ]);
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Handle stale model exceptions (optimistic locking conflicts)
        if ($e instanceof StaleModelException) {
            LogHelper::logException($e, [
                'message' => 'Optimistic locking conflict detected',
                'user_id' => $request->user()?->id,
                'url' => $request->fullUrl(),
            ]);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'The resource has been modified by another process. Please refresh and try again.',
                    'error_code' => 'STALE_MODEL',
                ], 409);
            }

            return back()->withErrors([
                'error' => 'The resource has been modified by another process. Please refresh and try again.',
            ])->withInput();
        }

        // Handle authentication exceptions
        if ($e instanceof AuthenticationException) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'error_code' => 'UNAUTHENTICATED',
                ], 401);
            }
            return redirect()->route('login');
        }

        // Handle authorization exceptions
        if ($e instanceof AuthorizationException) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'This action is unauthorized.',
                    'error_code' => 'UNAUTHORIZED',
                ], 403);
            }
            abort(403, 'This action is unauthorized.');
        }

        // Handle model not found exceptions
        if ($e instanceof ModelNotFoundException) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Resource not found.',
                    'error_code' => 'NOT_FOUND',
                ], 404);
            }
            abort(404, 'Resource not found.');
        }

        // Handle validation exceptions
        if ($e instanceof ValidationException) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $e->errors(),
                    'error_code' => 'VALIDATION_ERROR',
                ], 422);
            }
        }

        return parent::render($request, $e);
    }

    /**
     * Get the default context variables for logging.
     */
    protected function context(): array
    {
        return array_merge(parent::context(), [
            'user_id' => auth()->id(),
            'user_email' => auth()->user()?->email,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'url' => request()->fullUrl(),
            'method' => request()->method(),
        ]);
    }
}
