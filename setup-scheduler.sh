#!/bin/bash

# Laravel Scheduler Setup Script
# This script helps set up the Laravel scheduler on Linux/Mac systems

echo "========================================="
echo "Laravel Scheduler Setup"
echo "========================================="
echo ""

# Get the current directory
CURRENT_DIR=$(pwd)

echo "Current directory: $CURRENT_DIR"
echo ""

# Check if we're in a Laravel project
if [ ! -f "artisan" ]; then
    echo "Error: artisan file not found. Are you in the Laravel project root?"
    exit 1
fi

echo "✓ Laravel project detected"
echo ""

# Check PHP version
PHP_VERSION=$(php -v | head -n 1)
echo "PHP Version: $PHP_VERSION"
echo ""

# Test scheduler
echo "Testing scheduler..."
php artisan schedule:list
echo ""

# Ask if user wants to add cron entry
read -p "Do you want to add the cron entry? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create cron entry
    CRON_ENTRY="* * * * * cd $CURRENT_DIR && php artisan schedule:run >> /dev/null 2>&1"
    
    echo "Adding cron entry:"
    echo "$CRON_ENTRY"
    echo ""
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    
    echo "✓ Cron entry added successfully!"
    echo ""
    echo "Current crontab:"
    crontab -l
else
    echo "Skipping cron entry. You can add it manually:"
    echo "* * * * * cd $CURRENT_DIR && php artisan schedule:run >> /dev/null 2>&1"
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Verify scheduler is running: php artisan schedule:list"
echo "2. Check logs: tail -f storage/logs/laravel.log"
echo "3. Monitor queue: php artisan queue:monitor"
echo ""
echo "For production, consider setting up Supervisor for queue workers."
echo "See docs/scheduler-setup.md for more information."
echo ""
