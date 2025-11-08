@echo off
REM Laravel Scheduler Setup Script for Windows
REM This script helps test the Laravel scheduler on Windows systems

echo =========================================
echo Laravel Scheduler Setup (Windows)
echo =========================================
echo.

REM Check if artisan exists
if not exist "artisan" (
    echo Error: artisan file not found. Are you in the Laravel project root?
    pause
    exit /b 1
)

echo [OK] Laravel project detected
echo.

REM Check PHP version
echo PHP Version:
php -v
echo.

REM Test scheduler
echo Testing scheduler...
php artisan schedule:list
echo.

echo =========================================
echo Setup Instructions
echo =========================================
echo.
echo To run the scheduler on Windows, you have two options:
echo.
echo OPTION 1: Manual Testing (Development)
echo Run this command to test the scheduler:
echo   php artisan schedule:run
echo.
echo OPTION 2: Windows Task Scheduler (Production)
echo 1. Open Task Scheduler
echo 2. Create Basic Task
echo 3. Name: "Laravel Scheduler"
echo 4. Trigger: Daily, repeat every 1 minute
echo 5. Action: Start a program
echo    - Program: C:\php\php.exe (or your PHP path)
echo    - Arguments: artisan schedule:run
echo    - Start in: %CD%
echo.
echo OPTION 3: Keep Queue Worker Running
echo Open a new terminal and run:
echo   php artisan queue:work
echo.
echo This will process queued jobs (refunds, notifications, etc.)
echo Keep this terminal open while developing.
echo.
echo =========================================
echo Quick Start (Development)
echo =========================================
echo.
echo Run these commands in separate terminals:
echo.
echo Terminal 1 - Development Server:
echo   php artisan serve
echo.
echo Terminal 2 - Queue Worker:
echo   php artisan queue:work
echo.
echo Terminal 3 - Scheduler (optional):
echo   while (1) { php artisan schedule:run; sleep 60 }
echo.
echo =========================================
echo.
echo For more information, see docs/scheduler-setup.md
echo.
pause
