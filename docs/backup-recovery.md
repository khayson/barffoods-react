# Database Backup and Recovery Procedures

## Overview

This document outlines the procedures for database backup and recovery operations. Our backup system creates encrypted, compressed backups stored both locally and in geographically separate cloud storage locations.

## Backup System

### Backup Schedule

- **Daily Backups**: Run at 2:00 AM with verification
- **Monthly Backups**: Run on the 1st of each month at 3:00 AM
- **Retention Policy**:
  - Daily backups: 30 days
  - Monthly backups: 1 year

### Backup Locations

1. **Local Storage**: `storage/app/backups/`
2. **Primary Cloud Storage**: AWS S3 (or compatible) with AES-256 encryption
3. **Secondary Cloud Storage** (optional): Different geographic region for disaster recovery

### Backup Verification

All scheduled backups include automatic verification by:
1. Decompressing the backup file
2. Creating a temporary database
3. Restoring the backup to the temporary database
4. Verifying the restore completed successfully
5. Cleaning up the temporary database

## Manual Backup

### Create a Manual Backup

```bash
# Basic backup
php artisan backup:database

# Backup with verification
php artisan backup:database --verify
```

### Backup File Naming

Backups are named with timestamps: `backup_YYYY-MM-DD_HHmmss.sql.gz`

Example: `backup_2025-11-07_020000.sql.gz`

## Recovery Procedures

### Pre-Recovery Checklist

Before performing a recovery:

1. ✅ Identify the backup file to restore
2. ✅ Verify backup file integrity
3. ✅ Notify all users of planned downtime
4. ✅ Put application in maintenance mode
5. ✅ Create a backup of current database state
6. ✅ Document the reason for recovery

### Step-by-Step Recovery Process

#### 1. Enable Maintenance Mode

```bash
php artisan down --message="Database recovery in progress"
```

#### 2. Backup Current Database State

```bash
# Create a pre-recovery backup
php artisan backup:database --verify
```

#### 3. Download Backup from Cloud Storage (if needed)

```bash
# Using AWS CLI
aws s3 cp s3://your-backup-bucket/backups/backup_YYYY-MM-DD_HHmmss.sql.gz ./storage/app/backups/

# Or use Laravel Tinker
php artisan tinker
>>> Storage::disk('backup')->download('backups/backup_YYYY-MM-DD_HHmmss.sql.gz', 'storage/app/backups/backup_YYYY-MM-DD_HHmmss.sql.gz');
```

#### 4. Decompress the Backup

```bash
# Windows (using gzip)
gzip -d storage/app/backups/backup_YYYY-MM-DD_HHmmss.sql.gz

# This creates: storage/app/backups/backup_YYYY-MM-DD_HHmmss.sql
```

#### 5. Restore the Database

**For MySQL:**

```bash
mysql --host=127.0.0.1 --port=3306 --user=root --password=yourpassword database_name < storage/app/backups/backup_YYYY-MM-DD_HHmmss.sql
```

**For PostgreSQL:**

```bash
set PGPASSWORD=yourpassword
psql --host=127.0.0.1 --port=5432 --username=postgres --dbname=database_name --file=storage/app/backups/backup_YYYY-MM-DD_HHmmss.sql
```

#### 6. Verify Database Integrity

```bash
# Run migrations to ensure schema is up to date
php artisan migrate:status

# Test database connectivity
php artisan tinker
>>> DB::connection()->getPdo();
>>> \App\Models\User::count();
```

#### 7. Run Application Tests

```bash
# Run critical tests
php artisan test --filter=CriticalTest

# Or run full test suite
php artisan test
```

#### 8. Disable Maintenance Mode

```bash
php artisan up
```

#### 9. Monitor Application

- Check application logs: `storage/logs/laravel.log`
- Monitor error rates in admin dashboard
- Verify critical functionality (login, checkout, orders)

### Recovery Time Objectives (RTO)

- **Small Database** (<1GB): 15-30 minutes
- **Medium Database** (1-10GB): 30-60 minutes
- **Large Database** (>10GB): 1-3 hours

### Recovery Point Objectives (RPO)

- **Maximum Data Loss**: 24 hours (daily backup schedule)
- **Typical Data Loss**: <6 hours (if recovery from most recent backup)

## Disaster Recovery Scenarios

### Scenario 1: Corrupted Database

**Symptoms**: Database errors, data inconsistencies, application crashes

**Recovery Steps**:
1. Follow standard recovery procedure above
2. Restore from most recent verified backup
3. Investigate root cause of corruption

### Scenario 2: Accidental Data Deletion

**Symptoms**: Missing records, user reports of lost data

**Recovery Steps**:
1. Identify the time of deletion
2. Select backup from before deletion occurred
3. Consider partial restore if only specific tables affected
4. Use database tools to extract specific records if needed

### Scenario 3: Complete Server Failure

**Symptoms**: Server unreachable, hardware failure

**Recovery Steps**:
1. Provision new server infrastructure
2. Install application dependencies
3. Download backup from cloud storage
4. Follow standard recovery procedure
5. Update DNS/load balancer to point to new server

### Scenario 4: Ransomware/Security Breach

**Symptoms**: Encrypted files, unauthorized access, data tampering

**Recovery Steps**:
1. Isolate affected systems immediately
2. Assess extent of compromise
3. Provision clean infrastructure
4. Restore from backup BEFORE breach occurred
5. Implement additional security measures
6. Conduct security audit

## Partial Recovery

### Restore Specific Tables

```bash
# Extract specific table from backup
mysql --host=127.0.0.1 --user=root --password=yourpassword database_name < backup.sql --tables users orders

# Or use mysqldump to extract specific tables
mysqldump --host=127.0.0.1 --user=root --password=yourpassword database_name users orders > specific_tables.sql
```

### Point-in-Time Recovery

For point-in-time recovery, you'll need:
1. Most recent full backup before the target time
2. Binary logs (if enabled) from backup time to target time

```bash
# Restore full backup first
mysql database_name < backup.sql

# Then apply binary logs up to specific point
mysqlbinlog --stop-datetime="2025-11-07 14:30:00" binlog.000001 | mysql database_name
```

## Testing Recovery Procedures

### Quarterly Recovery Tests

**Schedule**: First week of each quarter (January, April, July, October)

**Test Procedure**:

1. **Week Before Test**:
   - Notify team of scheduled test
   - Prepare staging environment
   - Document current production state

2. **Test Day**:
   - Download most recent backup
   - Restore to staging environment
   - Verify data integrity
   - Run application tests
   - Document recovery time
   - Note any issues encountered

3. **Post-Test**:
   - Update recovery documentation
   - Address any issues found
   - Report results to stakeholders

### Test Checklist

- [ ] Backup file downloads successfully
- [ ] Decompression works without errors
- [ ] Database restore completes successfully
- [ ] Application connects to restored database
- [ ] Critical data is present and accurate
- [ ] Application functionality works correctly
- [ ] Recovery time is within RTO
- [ ] Documentation is accurate and complete

## Rollback Procedures

If recovery fails or causes issues:

### Immediate Rollback

```bash
# 1. Enable maintenance mode
php artisan down

# 2. Restore pre-recovery backup
mysql database_name < storage/app/backups/pre_recovery_backup.sql

# 3. Verify restoration
php artisan tinker
>>> DB::connection()->getPdo();

# 4. Disable maintenance mode
php artisan up
```

### Rollback Checklist

- [ ] Pre-recovery backup exists
- [ ] Rollback procedure tested in staging
- [ ] Team notified of rollback
- [ ] Root cause documented
- [ ] Alternative recovery plan prepared

## Backup Monitoring

### Daily Checks

- Verify backup completion notifications
- Check backup file sizes (should be consistent)
- Review backup logs for errors

### Weekly Checks

- Verify cloud storage uploads
- Check available storage space
- Review retention policy compliance

### Monthly Checks

- Test backup restoration in staging
- Verify encryption is working
- Review and update documentation
- Check backup costs and optimize if needed

## Troubleshooting

### Backup Fails to Create

**Possible Causes**:
- Insufficient disk space
- Database connection issues
- mysqldump/pg_dump not installed
- Permission issues

**Solutions**:
```bash
# Check disk space
df -h

# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();

# Verify mysqldump is installed
mysqldump --version

# Check permissions
ls -la storage/app/backups/
```

### Backup Verification Fails

**Possible Causes**:
- Corrupted backup file
- Insufficient resources for temp database
- SQL syntax errors

**Solutions**:
- Try decompressing manually to check file integrity
- Increase available memory/disk space
- Review backup logs for specific errors

### Cloud Upload Fails

**Possible Causes**:
- Invalid AWS credentials
- Network connectivity issues
- Insufficient S3 permissions
- Bucket doesn't exist

**Solutions**:
```bash
# Test AWS credentials
aws s3 ls s3://your-backup-bucket/

# Check Laravel configuration
php artisan tinker
>>> config('filesystems.disks.backup');

# Verify network connectivity
ping s3.amazonaws.com
```

### Recovery Takes Too Long

**Solutions**:
- Use parallel restore if database supports it
- Disable foreign key checks during restore
- Increase database buffer pool size
- Consider using binary backup tools (Percona XtraBackup)

## Contact Information

### Emergency Contacts

- **Database Administrator**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **System Administrator**: [Contact Info]
- **On-Call Engineer**: [Contact Info]

### Escalation Path

1. **Level 1**: On-call engineer attempts recovery
2. **Level 2**: Database administrator consulted
3. **Level 3**: Senior DevOps team engaged
4. **Level 4**: External vendor support (if applicable)

## Appendix

### Useful Commands

```bash
# List all backups
ls -lh storage/app/backups/

# Check backup file size
du -h storage/app/backups/backup_*.sql.gz

# List cloud backups
aws s3 ls s3://your-backup-bucket/backups/

# Download specific backup
aws s3 cp s3://your-backup-bucket/backups/backup_YYYY-MM-DD_HHmmss.sql.gz ./

# Test database connection
php artisan db:show

# View backup schedule
php artisan schedule:list
```

### Configuration Files

- Backup command: `app/Console/Commands/BackupDatabase.php`
- Backup schedule: `routes/console.php`
- Storage config: `config/filesystems.php`
- Database config: `config/database.php`

### Related Documentation

- [Laravel Database Documentation](https://laravel.com/docs/database)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [MySQL Backup Documentation](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)

---

**Document Version**: 1.0  
**Last Updated**: November 7, 2025  
**Next Review Date**: February 7, 2026
