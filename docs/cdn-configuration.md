# CDN Configuration Guide

## Overview

This document explains how to configure a Content Delivery Network (CDN) for static assets to improve performance and reduce server load.

## Benefits of Using a CDN

- **Faster Load Times**: Assets served from geographically closer servers
- **Reduced Server Load**: Static files served from CDN instead of your server
- **Better Caching**: CDN handles caching and compression automatically
- **Improved Reliability**: CDN provides redundancy and failover

## Recommended CDN Providers for Shared Hosting

### 1. Cloudflare (Free Tier Available)

**Best for**: Most shared hosting scenarios

**Setup Steps**:
1. Sign up at https://cloudflare.com
2. Add your domain
3. Update nameservers at your domain registrar
4. Enable "Auto Minify" for HTML, CSS, and JS
5. Enable "Brotli" compression
6. Set cache level to "Standard"

**Configuration**:
```env
# No code changes needed - Cloudflare proxies all traffic
ASSET_URL=https://yourdomain.com
```

### 2. BunnyCDN (Affordable)

**Best for**: High-traffic sites needing dedicated CDN

**Setup Steps**:
1. Sign up at https://bunny.net
2. Create a Pull Zone pointing to your domain
3. Configure origin URL
4. Get CDN URL (e.g., yourzone.b-cdn.net)

**Configuration**:
```env
# .env
ASSET_URL=https://yourzone.b-cdn.net

# config/app.php
'asset_url' => env('ASSET_URL'),
```

### 3. KeyCDN

**Best for**: Budget-conscious with pay-as-you-go pricing

**Setup Steps**:
1. Sign up at https://www.keycdn.com
2. Create a Pull Zone
3. Set origin URL to your domain
4. Get Zone URL

**Configuration**:
```env
ASSET_URL=https://yourzone-xxxxx.kxcdn.com
```

## Laravel Configuration

### Update Asset URLs

**config/app.php**:
```php
'asset_url' => env('ASSET_URL', null),
```

**Update .env**:
```env
# Production
ASSET_URL=https://your-cdn-url.com

# Local development (leave empty)
# ASSET_URL=
```

### Vite Configuration

The project is already configured for optimal asset delivery:

**vite.config.ts** includes:
- Code splitting for better caching
- Minification with esbuild
- CSS code splitting
- Optimized chunk file names with hashes
- Asset organization by type (images, fonts, css, js)

### Build Assets for Production

```bash
# Build optimized assets
npm run build

# This creates minified, hashed files in public/build/
```

## Shared Hosting Optimization

Since you're on shared hosting without Redis, here are additional optimizations:

### 1. Enable Gzip Compression

Add to `.htaccess` (if using Apache):

```apache
<IfModule mod_deflate.c>
    # Compress HTML, CSS, JavaScript, Text, XML and fonts
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/vnd.ms-fontobject
    AddOutputFilterByType DEFLATE application/x-font
    AddOutputFilterByType DEFLATE application/x-font-opentype
    AddOutputFilterByType DEFLATE application/x-font-otf
    AddOutputFilterByType DEFLATE application/x-font-truetype
    AddOutputFilterByType DEFLATE application/x-font-ttf
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE font/opentype
    AddOutputFilterByType DEFLATE font/otf
    AddOutputFilterByType DEFLATE font/ttf
    AddOutputFilterByType DEFLATE image/svg+xml
    AddOutputFilterByType DEFLATE image/x-icon
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/xml
</IfModule>
```

### 2. Browser Caching

Add to `.htaccess`:

```apache
<IfModule mod_expires.c>
    ExpiresActive On
    
    # Images
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # Video
    ExpiresByType video/mp4 "access plus 1 year"
    ExpiresByType video/mpeg "access plus 1 year"
    
    # CSS and JavaScript
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    
    # Fonts
    ExpiresByType font/ttf "access plus 1 year"
    ExpiresByType font/otf "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    
    # Default
    ExpiresDefault "access plus 2 days"
</IfModule>
```

### 3. Optimize Images

**Before uploading images**:
- Use WebP format when possible
- Compress images with tools like TinyPNG or ImageOptim
- Resize images to actual display size
- Use responsive images with srcset

**Recommended Image Sizes**:
- Product thumbnails: 300x300px
- Product detail: 800x800px
- Store images: 400x300px
- Hero images: 1920x600px

### 4. Lazy Loading

Images are already configured with `loading="lazy"` attribute in:
- ProductCard component
- Product detail pages
- Store listings
- Cart items

This defers loading of off-screen images until needed.

## Testing Performance

### Tools

1. **Google PageSpeed Insights**: https://pagespeed.web.dev/
2. **GTmetrix**: https://gtmetrix.com/
3. **WebPageTest**: https://www.webpagetest.org/

### Key Metrics to Monitor

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## Cloudflare Setup (Recommended for Shared Hosting)

### Step-by-Step Guide

1. **Sign Up**
   - Go to https://cloudflare.com
   - Create free account
   - Add your domain

2. **Update Nameservers**
   - Cloudflare will provide 2 nameservers
   - Update at your domain registrar
   - Wait for DNS propagation (up to 24 hours)

3. **Configure Settings**

   **Speed > Optimization**:
   - ✅ Auto Minify: HTML, CSS, JavaScript
   - ✅ Brotli compression
   - ✅ Early Hints
   - ✅ Rocket Loader (test carefully)

   **Caching > Configuration**:
   - Cache Level: Standard
   - Browser Cache TTL: 4 hours
   - Always Online: On

   **Page Rules** (optional):
   - Cache Everything for `/build/*`
   - Cache Everything for `/storage/*`

4. **SSL/TLS**
   - Set to "Full" or "Full (strict)"
   - Enable "Always Use HTTPS"

5. **Verify Setup**
   - Check site loads correctly
   - Test asset loading
   - Run PageSpeed Insights

## Troubleshooting

### Assets Not Loading from CDN

**Check**:
1. ASSET_URL is set correctly in .env
2. Assets are built with `npm run build`
3. CDN origin is pointing to your domain
4. CDN cache is cleared

**Solution**:
```bash
# Rebuild assets
npm run build

# Clear CDN cache (varies by provider)
# Cloudflare: Purge Everything in dashboard
# BunnyCDN: Purge cache in pull zone settings
```

### Mixed Content Warnings

**Issue**: HTTPS site loading HTTP assets

**Solution**:
```env
# Ensure ASSET_URL uses HTTPS
ASSET_URL=https://your-cdn-url.com

# Force HTTPS in production
APP_URL=https://yourdomain.com
```

### Slow Initial Load

**Possible Causes**:
1. Large JavaScript bundles
2. Unoptimized images
3. No caching headers

**Solutions**:
- Enable code splitting (already configured)
- Compress images before upload
- Add browser caching headers
- Use CDN

### Cache Not Updating

**Issue**: Old assets still showing after deployment

**Solution**:
```bash
# Assets have hash in filename, so this shouldn't happen
# If it does, clear CDN cache manually

# Cloudflare
# Dashboard > Caching > Purge Everything

# BunnyCDN
# Pull Zone > Purge Cache

# KeyCDN
# Zones > Purge Zone
```

## Monitoring

### Set Up Monitoring

1. **Uptime Monitoring**
   - UptimeRobot (free): https://uptimerobot.com
   - Pingdom (paid): https://www.pingdom.com

2. **Performance Monitoring**
   - Google Analytics: Page load times
   - Cloudflare Analytics: Bandwidth and requests

3. **Error Tracking**
   - Check Laravel logs regularly
   - Monitor 404 errors for missing assets

## Cost Estimates

### Free Options
- **Cloudflare**: Free tier includes CDN
- **Cost**: $0/month

### Paid Options
- **BunnyCDN**: ~$1/TB
- **KeyCDN**: ~$0.04/GB
- **AWS CloudFront**: ~$0.085/GB

**Estimated Monthly Cost** (for 100GB traffic):
- Cloudflare: $0
- BunnyCDN: $1
- KeyCDN: $4
- CloudFront: $8.50

## Best Practices

1. **Always use versioned assets** (already configured with Vite hashes)
2. **Compress images before upload**
3. **Use WebP format when possible**
4. **Enable lazy loading** (already implemented)
5. **Set long cache times for static assets**
6. **Use CDN for all static files**
7. **Monitor performance regularly**
8. **Clear CDN cache after deployments**

## Deployment Checklist

Before deploying to production:

- [ ] Build assets: `npm run build`
- [ ] Verify ASSET_URL in .env
- [ ] Test all pages load correctly
- [ ] Check browser console for errors
- [ ] Run PageSpeed Insights
- [ ] Verify images load from CDN
- [ ] Test on mobile devices
- [ ] Clear CDN cache if needed

---

**Document Version**: 1.0  
**Last Updated**: November 7, 2025  
**Next Review Date**: February 7, 2026
