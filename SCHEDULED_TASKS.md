# Scheduled Tasks & Commands

This document lists all scheduled tasks and manual commands available in the application for Tasks 1-7 of the System Error Proofing implementation.

## 🕐 Scheduled Tasks (Automatic)

All tasks are configured in `routes/console.php` and run automatically via Laravel's scheduler.

### Payment Processing (Task 5)

| Task | Schedule | Command | Description |
|------|----------|---------|-------------|
| Payment Timeouts | Every 15 minutes | `payments:check-timeouts` | Detects stuck payment operations and notifies users |
| Idempotency Cleanup | Daily at 2:00 AM | Auto cleanup | Removes expired payment idempotency records |

### Security & Abuse Prevention (Task 7)

| Task | Schedule | Command | Description |
|------|----------|---------|-------------|
| Abuse Detection | Every hour | `security:detect-abuse` | Detects and blocks abusive IP addresses |
| IP Block Cleanup | Daily at 3:00 AM | Auto cleanup | Removes expired IP blocks |
| Login Attempt Cleanup | Weekly (Sunday 4:00 AM) | Auto cleanup | Removes login attempts older than 30 days |

### Shipping Integration (Task 6)

| Task | Schedule | Command | Description |
|------|----------|---------|-------------|
| Order Tracking Sync | Every 6 hours | Job dispatch | Syncs tracking updates from EasyPost |

### Maintenance

| Task | Schedule | Command | Description |
|------|----------|---------|-------------|
| Audit Log Cleanup | Weekly (Monday 5:00 AM) | Auto cleanup | Removes audit logs older than 90 days |
| Notification Cleanup | Daily at 6:00 AM | Auto cleanup | Removes read notifications older than 30 days |

---

## 🔧 Manual Commands

These commands can be run manually via `php artisan <command>`.

### Payment Commands (Task 5)

```bash
# Check for payment timeouts (with custom timeout threshold)
php artisan payments:check-timeouts --timeout=15

# Clean up expired idempotency records manually
php artisan tinker
>>> App\Models\PaymentIdempotency::cleanup();
```

### Security Commands (Task 7)

```bash
# Detect abuse patterns (dry-run mode - shows what would be blocked)
php artisan security:detect-abuse --dry-run

# Detect and block abusive IPs
php artisan security:detect-abuse

# Manually block an IP
php artisan tinker
>>> App\Models\BlockedIp::blockIp('192.168.1.100', 'Manual block', 'Suspicious activity', 24);

# Manually unblock an IP
php artisan tinker
>>> App\Models\BlockedIp::unblockIp('192.168.1.100');

# Check if IP is blocked
php artisan tinker
>>> App\Models\BlockedIp::isBlocked('192.168.1.100');

# Clean up expired blocks manually
php artisan tinker
>>> App\Models\BlockedIp::cleanup();
```

### Shipping Commands (Task 6)

```bash
# Manually dispatch retry job for failed shipping label
php artisan tinker
>>> App\Jobs\RetryShippingLabelJob::dispatch($orderId, $rateId);

# Manually sync order tracking
php artisan tinker
>>> App\Jobs\SyncOrderTrackingJob::dispatch();
```

### Payment Refund Commands (Task 5)

```bash
# Manually process refund for failed order
php artisan tinker
>>> App\Jobs\ProcessRefundJob::dispatch($orderId, 'Order failed', true);
```

---

## 🚀 Setting Up the Scheduler

To enable automatic task execution, you need to add a single cron entry to your server:

### Linux/Mac (crontab)

```bash
# Edit crontab
crontab -e

# Add this line:
* * * * * cd /path/to/your/project && php artisan schedule:run >> /dev/null 2>&1
```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create a new task
3. Set trigger: Daily, repeat every 1 minute
4. Set action: Run program
   - Program: `php`
   - Arguments: `artisan schedule:run`
   - Start in: `C:\path\to\your\project`

### Docker

Add to your `docker-compose.yml`:

```yaml
scheduler:
  image: your-app-image
  command: php artisan schedule:work
  volumes:
    - .:/var/www/html
```

Or use a separate container with cron:

```dockerfile
FROM php:8.2-cli
COPY . /app
WORKDIR /app
RUN echo "* * * * * php /app/artisan schedule:run >> /dev/null 2>&1" | crontab -
CMD ["cron", "-f"]
```

---

## 📊 Monitoring Scheduled Tasks

### View Scheduled Tasks

```bash
# List all scheduled tasks
php artisan schedule:list
```

### Test Scheduled Tasks

```bash
# Run scheduler manually (useful for testing)
php artisan schedule:run

# Run a specific scheduled command
php artisan payments:check-timeouts
php artisan security:detect-abuse --dry-run
```

### Check Task Logs

All scheduled tasks log their execution:

```bash
# View payment timeout logs
tail -f storage/logs/laravel.log | grep "payment_timeout"

# View abuse detection logs
tail -f storage/logs/laravel.log | grep "IP blocked"

# View all security logs
tail -f storage/logs/security.log
```

---

## 🔍 Task Details

### Payment Timeout Checker

**Command:** `payments:check-timeouts`

**What it does:**
- Finds payment operations stuck in "pending" status for more than 15 minutes
- Marks them as failed
- Notifies users via email and database notification
- Logs all timeout events

**Options:**
- `--timeout=X` - Set custom timeout threshold in minutes (default: 15)

**Example:**
```bash
php artisan payments:check-timeouts --timeout=30
```

---

### Abuse Pattern Detector

**Command:** `security:detect-abuse`

**What it does:**
- Scans for IPs with 10+ failed login attempts in 1 hour → blocks for 24 hours
- Scans for IPs with 5+ failed payment attempts in 1 hour → blocks for 48 hours
- Logs all blocks with reason and violation count
- Sends security alerts

**Options:**
- `--dry-run` - Show what would be blocked without actually blocking

**Example:**
```bash
# See what would be blocked
php artisan security:detect-abuse --dry-run

# Actually block the IPs
php artisan security:detect-abuse
```

---

## 🛠️ Troubleshooting

### Scheduler Not Running

**Check if cron is working:**
```bash
# Linux/Mac
grep CRON /var/log/syslog

# Or check Laravel logs
tail -f storage/logs/laravel.log
```

**Test manually:**
```bash
php artisan schedule:run
```

### Tasks Not Executing

**Check task list:**
```bash
php artisan schedule:list
```

**Check for overlapping:**
- Tasks use `withoutOverlapping()` to prevent concurrent execution
- If a task is stuck, it may block new executions
- Check for long-running processes

**Clear cache:**
```bash
php artisan cache:clear
php artisan config:clear
```

### High Memory Usage

If scheduled tasks consume too much memory:

```bash
# Add memory limit to cron
* * * * * cd /path/to/project && php -d memory_limit=512M artisan schedule:run
```

---

## 📈 Performance Optimization

### Queue Workers

For better performance, run scheduled jobs through queues:

```bash
# Start queue worker
php artisan queue:work --tries=3 --timeout=90

# Or use Supervisor (recommended for production)
```

### Database Optimization

```bash
# Optimize tables after cleanup tasks
php artisan db:optimize

# Or add to scheduled tasks
Schedule::command('db:optimize')->weekly();
```

---

## 🔐 Security Considerations

1. **Scheduler runs as web server user** - Ensure proper file permissions
2. **Sensitive data in logs** - Rotate logs regularly
3. **Failed job handling** - Monitor failed jobs queue
4. **Resource limits** - Set appropriate timeouts and memory limits

---

## 📝 Adding New Scheduled Tasks

To add a new scheduled task, edit `routes/console.php`:

```php
// Command-based task
Schedule::command('your:command')
    ->hourly()
    ->name('your-task-name')
    ->withoutOverlapping()
    ->onOneServer();

// Closure-based task
Schedule::call(function () {
    // Your code here
})->daily()
    ->name('your-closure-task')
    ->onOneServer();

// Job-based task
Schedule::job(new YourJob)
    ->everyFiveMinutes()
    ->name('your-job-task')
    ->withoutOverlapping()
    ->onOneServer();
```

---

## 📞 Support

For issues or questions about scheduled tasks:
1. Check logs in `storage/logs/`
2. Run tasks manually to debug
3. Use `--dry-run` flags where available
4. Review this documentation

---

**Last Updated:** November 6, 2025
**Laravel Version:** 11.x
**Tasks Covered:** 1-7 (System Error Proofing)
