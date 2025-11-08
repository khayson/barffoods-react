# Logging Configuration Guide

## Overview

The application uses Laravel's logging system with custom channels for different types of events. Each channel has specific retention policies and notification settings.

## Log Channels

### Security Channel
**Purpose**: Authentication attempts, authorization failures, suspicious activity

**Usage**:
```php
Log::channel('security')->warning('Failed login attempt', [
    'email' => $email,
    'ip' => $request->ip(),
    'user_agent' => $request->userAgent(),
]);
```

**Configuration**:
- Retention: 90 days
- Slack notifications: Warning level and above
- Location: `storage/logs/security.log`

### Payment Channel
**Purpose**: Payment transactions, refunds, Stripe operations

**Usage**:
```php
Log::channel('payment')->info('Payment processed', [
    'order_id' => $order->id,
    'amount' => $amount,
    'stripe_payment_intent' => $paymentIntent->id,
]);

Log::channel('payment')->error('Payment failed', [
    'order_id' => $order->id,
    'error' => $exception->getMessage(),
]);
```

**Configuration**:
- Retention: 365 days (compliance requirement)
- Slack notifications: Error level and above
- Location: `storage/logs/payment.log`

### Shipping Channel
**Purpose**: EasyPost operations, rate calculations, label generation, tracking updates

**Usage**:
```php
Log::channel('shipping')->info('Shipping label generated', [
    'order_id' => $order->id,
    'tracking_number' => $trackingNumber,
]);

Log::channel('shipping')->error('Rate calculation failed', [
    'order_id' => $order->id,
    'error' => $exception->getMessage(),
]);
```

**Configuration**:
- Retention: 30 days
- Slack notifications: Error level and above
- Location: `storage/logs/shipping.log`

### Performance Channel
**Purpose**: Slow queries, API response times, performance metrics

**Usage**:
```php
Log::channel('performance')->warning('Slow query detected', [
    'query' => $query,
    'execution_time' => $time,
    'bindings' => $bindings,
]);
```

**Configuration**:
- Retention: 14 days
- No Slack notifications
- Location: `storage/logs/performance.log`

### Audit Channel
**Purpose**: Data changes, admin actions, compliance tracking

**Usage**:
```php
Log::channel('audit')->info('Product updated', [
    'user_id' => auth()->id(),
    'product_id' => $product->id,
    'old_values' => $oldValues,
    'new_values' => $newValues,
    'ip_address' => $request->ip(),
]);
```

**Configuration**:
- Retention: 2555 days (7 years for compliance)
- No Slack notifications
- Location: `storage/logs/audit.log`

### Critical Channel
**Purpose**: Application crashes, critical system errors

**Usage**:
```php
Log::channel('critical')->critical('Database connection lost', [
    'exception' => $exception->getMessage(),
    'trace' => $exception->getTraceAsString(),
]);
```

**Configuration**:
- Retention: 14 days (uses daily channel)
- Slack notifications: All critical messages
- Location: `storage/logs/laravel.log`

## Slack Notifications Setup

### 1. Create Slack Webhook

1. Go to your Slack workspace settings
2. Navigate to "Apps" → "Incoming Webhooks"
3. Create a new webhook for your desired channel
4. Copy the webhook URL

### 2. Configure Environment Variables

Add to your `.env` file:

```env
LOG_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
LOG_SLACK_USERNAME="E-Commerce App"
LOG_SLACK_EMOJI=":rotating_light:"
LOG_SLACK_LEVEL=critical
```

### 3. Test Slack Integration

```php
Log::channel('critical')->critical('Test notification');
```

## Log Rotation

Logs are automatically rotated daily and old logs are deleted based on retention policies:

- **Security**: 90 days
- **Payment**: 365 days
- **Shipping**: 30 days
- **Performance**: 14 days
- **Audit**: 2555 days (7 years)

## Environment Variables

All logging configuration can be customized via environment variables:

```env
# Main logging configuration
LOG_CHANNEL=stack
LOG_STACK=daily,slack
LOG_LEVEL=debug

# Slack notifications
LOG_SLACK_WEBHOOK_URL=
LOG_SLACK_USERNAME="E-Commerce App"
LOG_SLACK_EMOJI=":rotating_light:"
LOG_SLACK_LEVEL=critical

# Channel-specific retention
LOG_SECURITY_DAYS=90
LOG_PAYMENT_DAYS=365
LOG_SHIPPING_DAYS=30
LOG_PERFORMANCE_DAYS=14
LOG_AUDIT_DAYS=2555
```

## Best Practices

### 1. Use Appropriate Log Levels

- **debug**: Detailed debugging information
- **info**: Informational messages (successful operations)
- **warning**: Warning messages (recoverable issues)
- **error**: Error messages (failures that need attention)
- **critical**: Critical conditions (system failures)

### 2. Include Context

Always include relevant context data:

```php
Log::channel('payment')->error('Payment failed', [
    'order_id' => $order->id,
    'user_id' => $user->id,
    'amount' => $amount,
    'error' => $exception->getMessage(),
    'stripe_error_code' => $stripeError->code ?? null,
]);
```

### 3. Avoid Logging Sensitive Data

Never log:
- Credit card numbers
- Passwords
- API keys
- Personal identification numbers

### 4. Use Structured Logging

Use arrays for context data instead of string concatenation:

```php
// Good
Log::channel('security')->warning('Failed login', ['email' => $email]);

// Bad
Log::channel('security')->warning("Failed login for {$email}");
```

## Monitoring Log Files

### View Recent Logs

```bash
# Security logs
tail -f storage/logs/security.log

# Payment logs
tail -f storage/logs/payment.log

# All logs
tail -f storage/logs/laravel.log
```

### Search Logs

```bash
# Find all payment errors
grep "ERROR" storage/logs/payment.log

# Find specific order
grep "order_id.*12345" storage/logs/*.log
```

### Log File Sizes

Monitor log file sizes to ensure rotation is working:

```bash
du -h storage/logs/*.log
```

## Troubleshooting

### Logs Not Being Created

1. Check directory permissions:
   ```bash
   chmod -R 775 storage/logs
   ```

2. Verify log channel configuration in `config/logging.php`

3. Check `.env` file for correct `LOG_CHANNEL` setting

### Slack Notifications Not Working

1. Verify webhook URL is correct
2. Check `LOG_SLACK_LEVEL` is set appropriately
3. Test webhook manually:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test message"}' \
     YOUR_WEBHOOK_URL
   ```

### Log Files Growing Too Large

1. Verify retention days are set correctly
2. Check if log rotation is running (Laravel automatically rotates daily logs)
3. Consider archiving old logs to external storage

## Production Recommendations

1. **Set appropriate log levels**:
   ```env
   LOG_LEVEL=warning  # Don't log debug/info in production
   ```

2. **Enable Slack notifications**:
   ```env
   LOG_STACK=daily,slack
   LOG_SLACK_WEBHOOK_URL=your-webhook-url
   ```

3. **Monitor log file sizes** and set up alerts for unusual growth

4. **Archive old logs** to external storage (S3, etc.) before deletion

5. **Review logs regularly** for security incidents and performance issues
