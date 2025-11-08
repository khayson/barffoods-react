# Laravel Scheduler Setup Guide

## Overview

The Laravel scheduler handles automated tasks like processing queued jobs, cleaning up old data, monitoring system health, and running backups. This guide explains how to set up and monitor the scheduler.

## Scheduled Tasks

### Queue Processing
- **Frequency**: Every minute
- **Purpose**: Process queued jobs (refunds, notifications, emails)
- **Command**: `queue:work --stop-when-empty --max-time=50`
- **Notes**: Runs in background, prevents overlapping

### Order Tracking Sync
- **Frequency**: Every 6 hours
- **Purpose**: Sync order tracking information from EasyPost
- **Job**: `SyncOrderTrackingJob`

### Database Backups
- **Daily Backup**: 2:00 AM every day
- **Monthly Backup**: 3:00 AM on the 1st of each month
- **Command**: `backup:database --verify`
- **Features**: 
  - Automatic verification
  - Admin notifications on failure
  - Compressed and encrypted

### Data Cleanup Tasks

#### Anonymous Carts Cleanup
- **Frequency**: Daily
- **Purpose**: Delete anonymous carts older than 7 days
- **Retention**: 7 days

#### Payment Idempotency Cleanup
- **Frequency**: Daily
- **Purpose**: Delete expired idempotency records older than 30 days
- **Retention**: 30 days

#### Session Cleanup
- **Frequency**: Daily
- **Purpose**: Remove expired sessions
- **Command**: `session:gc`

### Monitoring Tasks

#### Failed Jobs Monitor
- **Frequency**: Every hour
- **Purpose**: Alert admins when failed jobs exceed 10
- **Action**: Creates system notification for super admins

#### Failed Refunds Retry
- **Frequency**: Every 3 hours
- **Purpose**: Automatically retry failed refund jobs
- **Scope**: Failed jobs from last 24 hours
- **Max Retries**: 3 attempts

## Setup Instructions

### 1. Add Cron Entry (Linux/Mac)

Add this single cron entry to run the Laravel scheduler:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

**Steps:**
1. Open crontab editor:
   ```bash
   crontab -e
   ```

2. Add the cron entry (replace `/path-to-your-project` with your actual path):
   ```bash
   * * * * * cd /var/www/barffoods && php artisan schedule:run >> /dev/null 2>&1
   ```

3. Save and exit

### 2. Windows Task Scheduler Setup

For Windows servers, create a scheduled task:

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Laravel Scheduler"
4. Trigger: Daily, repeat every 1 minute
5. Action: Start a program
   - Program: `C:\php\php.exe`
   - Arguments: `artisan schedule:run`
   - Start in: `C:\xampp\htdocs\barffoods`

### 3. Verify Scheduler is Running

Check if the scheduler is working:

```bash
php artisan schedule:list
```

This shows all scheduled tasks and their next run time.

### 4. Test Scheduler Manually

Run the scheduler manually to test:

```bash
php artisan schedule:run
```

Check the output to see which tasks ran.

## Monitoring

### Check Scheduler Logs

View scheduler activity in logs:

```bash
tail -f storage/logs/laravel.log | grep -i "schedule"
```

### Monitor Queue Processing

Check queue status:

```bash
php artisan queue:monitor
```

View failed jobs:

```bash
php artisan queue:failed
```

### Check Backup Status

Verify backups are running:

```bash
ls -lh storage/backups/
```

## Troubleshooting

### Scheduler Not Running

**Problem**: Tasks aren't executing

**Solutions**:
1. Verify cron entry is correct
2. Check cron is running: `sudo service cron status`
3. Check PHP path: `which php`
4. Check file permissions: `chmod -R 775 storage`
5. Check logs: `tail -f storage/logs/laravel.log`

### Queue Jobs Not Processing

**Problem**: Queued jobs stay pending

**Solutions**:
1. Check if queue worker is running: `ps aux | grep queue:work`
2. Manually process queue: `php artisan queue:work --stop-when-empty`
3. Check database connection
4. Check failed jobs: `php artisan queue:failed`

### Failed Jobs Accumulating

**Problem**: Many jobs in failed_jobs table

**Solutions**:
1. Review failed job details: `php artisan queue:failed`
2. Retry specific job: `php artisan queue:retry {id}`
3. Retry all failed jobs: `php artisan queue:retry all`
4. Clear old failed jobs: `php artisan queue:flush`

### Backups Not Running

**Problem**: No backup files created

**Solutions**:
1. Check backup command exists: `php artisan backup:database --help`
2. Check storage permissions: `chmod -R 775 storage/backups`
3. Check disk space: `df -h`
4. Run manually: `php artisan backup:database --verify`
5. Check logs for errors

## Production Recommendations

### 1. Use Supervisor for Queue Workers

Instead of relying solely on the scheduler, use Supervisor to keep a queue worker always running:

**Install Supervisor** (Ubuntu/Debian):
```bash
sudo apt-get install supervisor
```

**Create config** (`/etc/supervisor/conf.d/laravel-worker.conf`):
```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/barffoods/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/barffoods/storage/logs/worker.log
stopwaitsecs=3600
```

**Start Supervisor**:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

### 2. Monitor with Laravel Horizon (Optional)

For advanced queue monitoring, consider Laravel Horizon:

```bash
composer require laravel/horizon
php artisan horizon:install
php artisan horizon
```

### 3. Set Up Alerts

Configure alerts for critical failures:

1. **Email Alerts**: Configure in `.env`
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USERNAME=your-username
   MAIL_PASSWORD=your-password
   ```

2. **Slack Alerts**: Add webhook URL
   ```env
   LOG_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### 4. Regular Maintenance

Schedule these manual checks:

- **Weekly**: Review failed jobs and error logs
- **Monthly**: Verify backups can be restored
- **Quarterly**: Test disaster recovery procedures
- **Annually**: Review and optimize scheduled tasks

## Environment Variables

Required environment variables for scheduler:

```env
# Queue Configuration
QUEUE_CONNECTION=database

# Backup Configuration
AWS_BACKUP_ACCESS_KEY_ID=your-key
AWS_BACKUP_SECRET_ACCESS_KEY=your-secret
AWS_BACKUP_REGION=us-east-1
AWS_BACKUP_BUCKET=your-backup-bucket

# Notification Configuration
MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=noreply@barffoods.com
LOG_SLACK_WEBHOOK_URL=your-slack-webhook
```

## Performance Optimization

### Queue Worker Optimization

For high-traffic sites:

```bash
# Multiple workers
php artisan queue:work --queue=high,default,low --sleep=3 --tries=3

# Separate workers for different queues
php artisan queue:work --queue=high --sleep=1 --tries=3
php artisan queue:work --queue=default --sleep=3 --tries=3
php artisan queue:work --queue=low --sleep=5 --tries=3
```

### Scheduler Optimization

Adjust task frequencies based on your needs:

- High traffic: Process queue every 30 seconds
- Low traffic: Process queue every 5 minutes
- Adjust cleanup frequencies based on data volume

## Security Considerations

1. **Backup Encryption**: Ensure backups are encrypted
2. **Secure Credentials**: Use environment variables, never hardcode
3. **Access Control**: Restrict cron user permissions
4. **Log Rotation**: Prevent logs from filling disk
5. **Failed Job Cleanup**: Regularly review and clean failed jobs

## Useful Commands

```bash
# List all scheduled tasks
php artisan schedule:list

# Run scheduler manually
php artisan schedule:run

# Test specific scheduled task
php artisan schedule:test

# View queue status
php artisan queue:monitor

# Process queue manually
php artisan queue:work --stop-when-empty

# View failed jobs
php artisan queue:failed

# Retry failed job
php artisan queue:retry {id}

# Retry all failed jobs
php artisan queue:retry all

# Clear failed jobs
php artisan queue:flush

# Run backup manually
php artisan backup:database --verify
```

## Conclusion

The Laravel scheduler automates critical maintenance tasks, ensuring your application runs smoothly. Proper setup and monitoring of the scheduler is essential for production environments.

For issues or questions, check the logs first, then consult this guide's troubleshooting section.
