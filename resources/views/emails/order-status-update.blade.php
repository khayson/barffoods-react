<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Update</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 14px;
        }
        .status-confirmed { background-color: #d4edda; color: #155724; }
        .status-processing { background-color: #fff3cd; color: #856404; }
        .status-shipped { background-color: #cce5ff; color: #004085; }
        .status-delivered { background-color: #d1ecf1; color: #0c5460; }
        .order-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Order Status Update</h1>
        <p>Hello {{ $order->user->name }},</p>
        <p>Your order status has been updated!</p>
    </div>

    <div class="order-details">
        <h2>Order Information</h2>
        <p><strong>Order Number:</strong> #{{ $order->order_number }}</p>
        <p><strong>Previous Status:</strong> {{ $statusLabels[$oldStatus] ?? ucfirst($oldStatus) }}</p>
        <p><strong>Current Status:</strong> 
            <span class="status-badge status-{{ $newStatus }}">
                {{ $statusLabels[$newStatus] ?? ucfirst($newStatus) }}
            </span>
        </p>
        <p><strong>Order Date:</strong> {{ $order->created_at->format('F j, Y') }}</p>
        <p><strong>Total Amount:</strong> ${{ number_format($order->total_amount, 2) }}</p>
    </div>

    @if($newStatus === 'shipped')
        <div class="order-details">
            <h3>Shipping Information</h3>
            @if($order->tracking_code)
                <p><strong>Tracking Code:</strong> {{ $order->tracking_code }}</p>
            @endif
            @if($order->carrier)
                <p><strong>Carrier:</strong> {{ $order->carrier }}</p>
            @endif
            @if($order->delivery_address)
                <p><strong>Delivery Address:</strong> {{ $order->delivery_address }}</p>
            @endif
        </div>
    @endif

    @if($newStatus === 'delivered')
        <div class="order-details">
            <h3>Delivery Complete</h3>
            <p>Your order has been successfully delivered! Thank you for your business.</p>
            <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
        </div>
    @endif

    <div class="footer">
        <p>Thank you for choosing our service!</p>
        <p>If you have any questions about your order, please contact our customer service team.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
