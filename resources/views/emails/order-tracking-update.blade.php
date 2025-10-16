<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Tracking Update - {{ $order->order_number }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin: 10px 0;
        }
        .status-delivered { background-color: #d4edda; color: #155724; }
        .status-in-transit { background-color: #cce5ff; color: #004085; }
        .status-out-for-delivery { background-color: #fff3cd; color: #856404; }
        .status-pre-transit { background-color: #f8d7da; color: #721c24; }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .info-item {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        .info-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 16px;
            font-weight: 600;
            color: #333;
        }
        .tracking-code {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 2px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .timeline {
            margin: 20px 0;
        }
        .timeline-item {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 6px;
        }
        .timeline-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 18px;
        }
        .timeline-icon.current {
            background-color: #28a745;
            color: white;
        }
        .timeline-icon.past {
            background-color: #6c757d;
            color: white;
        }
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Order Tracking Update</h1>
            <p>Order #{{ $order->order_number }}</p>
        </div>
        
        <div class="content">
            <h2>Hello {{ $user->name }}!</h2>
            <p>Your order has been updated with new tracking information:</p>
            
            <div class="status-badge status-{{ str_replace('_', '-', $trackingEvent->status) }}">
                {{ ucwords(str_replace('_', ' ', $trackingEvent->status)) }}
            </div>
            
            <div class="tracking-code">
                {{ $trackingEvent->tracking_code }}
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Status Message</div>
                    <div class="info-value">{{ $trackingEvent->message }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Time</div>
                    <div class="info-value">{{ $trackingEvent->occurred_at->format('M d, Y \a\t g:i A') }}</div>
                </div>
                @if($trackingEvent->location)
                <div class="info-item">
                    <div class="info-label">Location</div>
                    <div class="info-value">{{ $trackingEvent->location }}</div>
                </div>
                @endif
                @if($trackingEvent->carrier)
                <div class="info-item">
                    <div class="info-label">Carrier</div>
                    <div class="info-value">{{ $trackingEvent->carrier }}</div>
                </div>
                @endif
            </div>
            
            @if($trackingEvents && count($trackingEvents) > 1)
            <h3>Tracking History</h3>
            <div class="timeline">
                @foreach($trackingEvents as $index => $event)
                <div class="timeline-item">
                    <div class="timeline-icon {{ $index === 0 ? 'current' : 'past' }}">
                        @if($event->status === 'delivered')
                            ✅
                        @elseif($event->status === 'out_for_delivery')
                            🚚
                        @elseif($event->status === 'in_transit')
                            📦
                        @else
                            📋
                        @endif
                    </div>
                    <div>
                        <div style="font-weight: 600;">{{ ucwords(str_replace('_', ' ', $event->status)) }}</div>
                        <div style="font-size: 14px; color: #6c757d;">{{ $event->message }}</div>
                        <div style="font-size: 12px; color: #6c757d;">{{ $event->occurred_at->format('M d, Y \a\t g:i A') }}</div>
                    </div>
                </div>
                @endforeach
            </div>
            @endif
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ route('orders.show', $order->id) }}" class="cta-button">
                    View Full Order Details
                </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
                You can track your package in real-time by clicking the button above or visiting our website.
            </p>
        </div>
        
        <div class="footer">
            <p>Thank you for choosing our service!</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
