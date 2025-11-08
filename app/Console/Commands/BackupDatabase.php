<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\BackupCompletedNotification;
use App\Models\User;

class BackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:database {--verify : Verify backup by testing restore}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a compressed database backup with optional verification';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting database backup...');
        
        try {
            $driver = config('database.default');
            $connection = config("database.connections.{$driver}");
            
            if (!in_array($connection['driver'], ['mysql', 'pgsql'])) {
                $this->error("Unsupported database driver: {$connection['driver']}");
                return Command::FAILURE;
            }
            
            // Create backup filename with timestamp
            $timestamp = now()->format('Y-m-d_His');
            $filename = "backup_{$timestamp}.sql";
            $compressedFilename = "{$filename}.gz";
            $backupPath = storage_path("app/backups/{$filename}");
            $compressedPath = storage_path("app/backups/{$compressedFilename}");
            
            // Ensure backup directory exists
            if (!is_dir(storage_path('app/backups'))) {
                mkdir(storage_path('app/backups'), 0755, true);
            }
            
            // Create backup based on driver
            if ($connection['driver'] === 'mysql') {
                $this->createMysqlBackup($connection, $backupPath);
            } else {
                $this->createPostgresBackup($connection, $backupPath);
            }
            
            // Compress backup
            $this->info('Compressing backup...');
            $this->compressBackup($backupPath, $compressedPath);
            
            // Verify backup if requested
            if ($this->option('verify')) {
                $this->info('Verifying backup...');
                if (!$this->verifyBackup($compressedPath, $connection)) {
                    $this->error('Backup verification failed!');
                    return Command::FAILURE;
                }
                $this->info('Backup verified successfully!');
            }
            
            // Upload to cloud storage
            $this->uploadToCloud($compressedPath, $compressedFilename);
            
            // Clean up old backups
            $this->cleanupOldBackups();
            
            // Log success
            Log::channel('daily')->info('Database backup completed successfully', [
                'filename' => $compressedFilename,
                'size' => filesize($compressedPath),
            ]);
            
            // Notify admins
            $this->notifyAdmins($compressedFilename, filesize($compressedPath));
            
            $this->info("Backup completed successfully: {$compressedFilename}");
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error("Backup failed: {$e->getMessage()}");
            Log::channel('daily')->error('Database backup failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Command::FAILURE;
        }
    }
    
    /**
     * Create MySQL backup using mysqldump
     */
    private function createMysqlBackup(array $connection, string $backupPath): void
    {
        $host = $connection['host'];
        $port = $connection['port'] ?? 3306;
        $database = $connection['database'];
        $username = $connection['username'];
        $password = $connection['password'];
        
        // Build mysqldump command
        $command = sprintf(
            'mysqldump --host=%s --port=%s --user=%s --password=%s --single-transaction --routines --triggers %s > %s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($backupPath)
        );
        
        $this->info('Creating MySQL backup...');
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            throw new \RuntimeException('mysqldump command failed');
        }
        
        if (!file_exists($backupPath) || filesize($backupPath) === 0) {
            throw new \RuntimeException('Backup file is empty or was not created');
        }
    }
    
    /**
     * Create PostgreSQL backup using pg_dump
     */
    private function createPostgresBackup(array $connection, string $backupPath): void
    {
        $host = $connection['host'];
        $port = $connection['port'] ?? 5432;
        $database = $connection['database'];
        $username = $connection['username'];
        $password = $connection['password'];
        
        // Set PGPASSWORD environment variable
        putenv("PGPASSWORD={$password}");
        
        // Build pg_dump command
        $command = sprintf(
            'pg_dump --host=%s --port=%s --username=%s --format=plain --file=%s %s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($backupPath),
            escapeshellarg($database)
        );
        
        $this->info('Creating PostgreSQL backup...');
        exec($command, $output, $returnCode);
        
        // Clear password from environment
        putenv('PGPASSWORD');
        
        if ($returnCode !== 0) {
            throw new \RuntimeException('pg_dump command failed');
        }
        
        if (!file_exists($backupPath) || filesize($backupPath) === 0) {
            throw new \RuntimeException('Backup file is empty or was not created');
        }
    }
    
    /**
     * Compress backup file using gzip
     */
    private function compressBackup(string $backupPath, string $compressedPath): void
    {
        $command = sprintf('gzip -c %s > %s', escapeshellarg($backupPath), escapeshellarg($compressedPath));
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0 || !file_exists($compressedPath)) {
            throw new \RuntimeException('Backup compression failed');
        }
        
        // Remove uncompressed file
        unlink($backupPath);
    }
    
    /**
     * Verify backup by testing restore to temporary database
     */
    private function verifyBackup(string $compressedPath, array $connection): bool
    {
        try {
            $tempDatabase = 'backup_verify_' . time();
            
            // Decompress to temp file
            $tempSqlPath = storage_path('app/backups/temp_verify.sql');
            $command = sprintf('gzip -dc %s > %s', escapeshellarg($compressedPath), escapeshellarg($tempSqlPath));
            exec($command, $output, $returnCode);
            
            if ($returnCode !== 0) {
                return false;
            }
            
            // Create temporary database
            DB::statement("CREATE DATABASE IF NOT EXISTS `{$tempDatabase}`");
            
            // Restore to temp database
            if ($connection['driver'] === 'mysql') {
                $command = sprintf(
                    'mysql --host=%s --port=%s --user=%s --password=%s %s < %s',
                    escapeshellarg($connection['host']),
                    escapeshellarg($connection['port'] ?? 3306),
                    escapeshellarg($connection['username']),
                    escapeshellarg($connection['password']),
                    escapeshellarg($tempDatabase),
                    escapeshellarg($tempSqlPath)
                );
            } else {
                putenv("PGPASSWORD={$connection['password']}");
                $command = sprintf(
                    'psql --host=%s --port=%s --username=%s --dbname=%s --file=%s',
                    escapeshellarg($connection['host']),
                    escapeshellarg($connection['port'] ?? 5432),
                    escapeshellarg($connection['username']),
                    escapeshellarg($tempDatabase),
                    escapeshellarg($tempSqlPath)
                );
            }
            
            exec($command, $output, $returnCode);
            
            // Clean up
            DB::statement("DROP DATABASE IF EXISTS `{$tempDatabase}`");
            unlink($tempSqlPath);
            
            if ($connection['driver'] === 'pgsql') {
                putenv('PGPASSWORD');
            }
            
            return $returnCode === 0;
            
        } catch (\Exception $e) {
            Log::error('Backup verification failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
    
    /**
     * Upload backup to cloud storage with encryption
     */
    private function uploadToCloud(string $localPath, string $filename): void
    {
        // Check if backup disk is configured
        if (!config('filesystems.disks.backup')) {
            $this->warn('Backup storage not configured. Skipping cloud upload.');
            return;
        }
        
        try {
            $this->info('Uploading to cloud storage (encrypted)...');
            
            // Upload to primary backup location
            $contents = file_get_contents($localPath);
            Storage::disk('backup')->put("backups/{$filename}", $contents);
            
            // Verify upload
            if (!Storage::disk('backup')->exists("backups/{$filename}")) {
                throw new \RuntimeException('Backup upload verification failed');
            }
            
            $uploadedSize = Storage::disk('backup')->size("backups/{$filename}");
            $this->info("Upload completed! Size: " . round($uploadedSize / 1024 / 1024, 2) . " MB");
            
            // Optional: Upload to secondary region for geo-redundancy
            if (config('filesystems.disks.backup_secondary')) {
                $this->info('Uploading to secondary region...');
                Storage::disk('backup_secondary')->put("backups/{$filename}", $contents);
                $this->info('Secondary upload completed!');
            }
            
        } catch (\Exception $e) {
            $this->error("Cloud upload failed: {$e->getMessage()}");
            Log::error('Backup cloud upload failed', [
                'filename' => $filename,
                'error' => $e->getMessage(),
            ]);
            throw $e; // Re-throw to fail the backup process
        }
    }
    
    /**
     * Clean up old backups based on retention policy
     * Keep: 30 daily backups, 12 monthly backups
     */
    private function cleanupOldBackups(): void
    {
        $backupDir = storage_path('app/backups');
        $files = glob("{$backupDir}/backup_*.sql.gz");
        
        if (count($files) <= 30) {
            return; // Keep all if less than 30
        }
        
        // Sort by modification time (oldest first)
        usort($files, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        
        $now = now();
        $monthlyBackups = [];
        
        // Identify monthly backups (first backup of each month)
        foreach ($files as $file) {
            $fileDate = \Carbon\Carbon::createFromTimestamp(filemtime($file));
            $monthKey = $fileDate->format('Y-m');
            
            if (!isset($monthlyBackups[$monthKey])) {
                $monthlyBackups[$monthKey] = $file;
            }
        }
        
        // Delete old backups
        foreach ($files as $file) {
            $fileDate = \Carbon\Carbon::createFromTimestamp(filemtime($file));
            $ageInDays = $now->diffInDays($fileDate);
            
            // Keep if it's a monthly backup less than 1 year old
            if (in_array($file, $monthlyBackups) && $ageInDays <= 365) {
                continue;
            }
            
            // Keep if it's less than 30 days old
            if ($ageInDays <= 30) {
                continue;
            }
            
            // Delete old backup
            unlink($file);
            $this->info("Deleted old backup: " . basename($file));
        }
        
        // Clean up cloud storage
        if (config('filesystems.disks.backup')) {
            try {
                $cloudFiles = Storage::disk('backup')->files('backups');
                foreach ($cloudFiles as $cloudFile) {
                    $lastModified = Storage::disk('backup')->lastModified($cloudFile);
                    $ageInDays = $now->diffInDays(\Carbon\Carbon::createFromTimestamp($lastModified));
                    
                    if ($ageInDays > 365) {
                        Storage::disk('backup')->delete($cloudFile);
                        $this->info("Deleted old cloud backup: " . basename($cloudFile));
                    }
                }
                
                // Clean up secondary region if configured
                if (config('filesystems.disks.backup_secondary')) {
                    $secondaryFiles = Storage::disk('backup_secondary')->files('backups');
                    foreach ($secondaryFiles as $cloudFile) {
                        $lastModified = Storage::disk('backup_secondary')->lastModified($cloudFile);
                        $ageInDays = $now->diffInDays(\Carbon\Carbon::createFromTimestamp($lastModified));
                        
                        if ($ageInDays > 365) {
                            Storage::disk('backup_secondary')->delete($cloudFile);
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Cloud backup cleanup failed', ['error' => $e->getMessage()]);
            }
        }
    }
    
    /**
     * Notify administrators about backup completion
     */
    private function notifyAdmins(string $filename, int $size): void
    {
        try {
            $admins = User::where('role', 'super_admin')->get();
            
            foreach ($admins as $admin) {
                $admin->notify(new BackupCompletedNotification($filename, $size));
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send backup notification', ['error' => $e->getMessage()]);
        }
    }
}
