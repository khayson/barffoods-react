# 🛒 BarfFoods - Multi-Store Grocery Platform

A modern, full-stack grocery delivery platform built with Laravel 11, React, and Inertia.js. Features multi-store support, real-time messaging, order tracking, and integrated shipping solutions.

## 🚀 Features

### Core Platform
- **Multi-Store Support** - Multiple grocery stores on one platform
- **User Management** - Customer and admin roles with authentication
- **Product Catalog** - Categories, products, reviews, and wishlists
- **Shopping Cart** - Anonymous and authenticated cart support
- **Order Management** - Complete order lifecycle with status tracking
- **Real-Time Messaging** - Customer support chat system
- **Payment Integration** - Stripe payment processing
- **Responsive Design** - Modern UI with dark/light mode support

### Delivery & Shipping
- **Local Express Delivery** - Zone-based pricing with ZIP code distance calculation
- **EasyPost Integration** - Professional shipping with real-time tracking
- **Multi-Carrier Support** - USPS, UPS, FedEx through EasyPost
- **Order Tracking** - Real-time shipment tracking with webhooks
- **Delivery Zones** - Smart pricing based on distance

### Admin Features
- **Order Management** - Complete order processing workflow
- **Product Management** - Inventory and catalog management
- **Customer Support** - Real-time messaging system
- **Analytics Dashboard** - Order and sales analytics
- **System Settings** - Store configuration and settings

## 🏗️ Architecture

### Backend (Laravel 11)
- **Framework**: Laravel 11 with PHP 8.2+
- **Database**: MySQL with Eloquent ORM
- **Authentication**: Laravel Sanctum
- **API**: RESTful APIs with Inertia.js
- **Jobs**: Queue system for background processing
- **Notifications**: Database and email notifications

### Frontend (React + Inertia.js)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: Inertia.js for server-side state
- **Icons**: Lucide React icons
- **UI Components**: Custom component library

### External Services
- **Stripe** - Payment processing
- **EasyPost** - Shipping and tracking
- **Laravel Echo** - Real-time features (Reverb/Pusher)

## 📦 Installation

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- MySQL 8.0+
- Redis (for queues and caching)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd barffoods
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure environment variables**
   ```env
   # Database
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=barffoods
   DB_USERNAME=root
   DB_PASSWORD=

   # Stripe
   STRIPE_KEY=pk_test_...
   STRIPE_SECRET=sk_test_...

   # EasyPost
   EASYPOST_API_KEY=...
   EASYPOST_WEBHOOK_SECRET=...

   # Queue
   QUEUE_CONNECTION=redis
   REDIS_HOST=127.0.0.1
   REDIS_PASSWORD=null
   REDIS_PORT=6379
   ```

6. **Database setup**
   ```bash
   php artisan migrate:fresh --seed
   ```

7. **Build frontend assets**
   ```bash
   npm run build
   ```

8. **Start the application**
   ```bash
   php artisan serve
   ```

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts (customers and admins)
- `stores` - Grocery store locations
- `products` - Product catalog
- `orders` - Customer orders
- `order_items` - Individual items in orders
- `cart_items` - Shopping cart items
- `notifications` - System notifications

### Delivery System
- `zip_codes` - US ZIP code coordinates
- `zip_code_distances` - Cached distance calculations
- `shipment_tracking_events` - EasyPost tracking events

### Messaging System
- `conversations` - Support conversations
- `messages` - Individual messages
- `conversation_participants` - Conversation members

## 🚚 Delivery System

### Local Express Delivery

The platform features a sophisticated ZIP code-based delivery system with zone-based pricing:

#### Zone-Based Pricing
| Zone | Distance | Price | Example |
|------|----------|-------|---------|
| **Local** | 0-5 miles | **$8.99** | Within same city |
| **Metro** | 5-15 miles | **$14.99** | Nearby suburbs |
| **Regional** | 15-30 miles | **$24.99** | Neighboring cities |
| **Extended** | 30+ miles | **$39.99** | Long distance |
| **Unknown** | Distance fails | **$12.99** | Fallback price |

#### How It Works
1. Customer enters ZIP code at checkout
2. System calculates distance from store location
3. Applies zone-based pricing automatically
4. Caches distance for future orders
5. Falls back gracefully if ZIP not found

#### Database Structure
```sql
-- ZIP code coordinates
CREATE TABLE zip_codes (
    id BIGINT PRIMARY KEY,
    zip_code VARCHAR(5) UNIQUE,
    city VARCHAR(100),
    state VARCHAR(2),
    county VARCHAR(100),
    latitude DECIMAL(10,7),
    longitude DECIMAL(11,7)
);

-- Cached distances
CREATE TABLE zip_code_distances (
    id BIGINT PRIMARY KEY,
    from_zip VARCHAR(5),
    to_zip VARCHAR(5),
    distance_miles DECIMAL(8,2),
    UNIQUE(from_zip, to_zip)
);
```

### EasyPost Integration

Professional shipping with real-time tracking:

#### Features
- **Multi-Carrier Support** - USPS, UPS, FedEx
- **Real-Time Tracking** - Webhook-based updates
- **Label Generation** - Automatic shipping labels
- **Rate Calculation** - Live shipping rates
- **Delivery Estimates** - Accurate delivery times

#### Tracking System
- Automatic status updates via webhooks
- Customer notifications for tracking events
- Admin alerts for delivered packages
- Scheduled sync jobs (every 6 hours)
- Comprehensive tracking history

## 🔧 Configuration

### Store Settings
Configure your store information in Admin → System Settings:
- Store name and address
- Contact information
- Business hours
- Delivery zones

### Shipping Configuration
- **EasyPost API Key** - For professional shipping
- **Webhook Secret** - For secure webhook validation
- **Default Store Address** - For distance calculations

### Payment Setup
- **Stripe Keys** - Test and production keys
- **Webhook Endpoints** - For payment confirmations

## 📊 Production Setup

### ZIP Code Database

For production, import the complete US ZIP code database:

#### Option 1: SimpleMaps (Recommended)
1. Download from [SimpleMaps US ZIP Database](https://simplemaps.com/data/us-zips)
2. Create import command:
   ```php
   php artisan make:command ImportUSZipCodes
   ```
3. Import the CSV file:
   ```bash
   php artisan import:zips uszips.csv
   ```

#### Option 2: GeoNames
1. Download from [GeoNames US ZIP Codes](http://download.geonames.org/export/zip/US.zip)
2. Import the TXT file with custom parser

### Queue Configuration
Set up Redis for background job processing:
```bash
# Install Redis
sudo apt install redis-server

# Start Redis
sudo systemctl start redis

# Configure Laravel
QUEUE_CONNECTION=redis
```

### Webhook Setup
Configure webhooks for external services:

#### EasyPost Webhooks
- URL: `https://yourdomain.com/api/webhooks/easypost`
- Events: `tracker.updated`
- Secret: Set in `.env` as `EASYPOST_WEBHOOK_SECRET`

#### Stripe Webhooks
- URL: `https://yourdomain.com/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

## 🧪 Testing

### Test Data
The system includes comprehensive test data:
- **33 US ZIP codes** - Major cities for testing
- **Sample stores** - Multiple grocery store locations
- **Test products** - Various categories and items
- **Demo users** - Admin and customer accounts

### Test Accounts
- **Admin**: admin@barffoods.com / 123password
- **Customer**: customer@barffoods.com / 123password

### Manual Testing
1. **Checkout Flow** - Test with different ZIP codes
2. **Distance Calculation** - Verify zone pricing
3. **EasyPost Integration** - Test shipping rates
4. **Payment Processing** - Use Stripe test cards
5. **Order Tracking** - Test webhook processing

## 📱 API Endpoints

### Customer APIs
- `GET /api/cart` - Get cart items
- `POST /api/cart/add` - Add item to cart
- `POST /api/checkout/session` - Create checkout session
- `GET /api/shipping/methods` - Get delivery options
- `GET /api/orders` - Get customer orders

### Admin APIs
- `GET /api/admin/orders` - Get all orders
- `PATCH /api/admin/orders/{id}` - Update order
- `POST /api/admin/orders/{id}/label` - Create shipping label
- `GET /api/admin/analytics` - Get analytics data

### Webhook Endpoints
- `POST /api/webhooks/easypost` - EasyPost tracking updates
- `POST /api/webhooks/stripe` - Stripe payment events

## 🔒 Security

### Authentication
- Laravel Sanctum for API authentication
- CSRF protection on all forms
- Rate limiting on API endpoints
- Secure session management

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Secure file uploads

### Webhook Security
- HMAC signature verification
- IP whitelisting (optional)
- Request validation
- Error logging

## 📈 Performance

### Optimization Features
- **Database Indexing** - Optimized queries
- **Caching** - Redis for sessions and cache
- **Queue Jobs** - Background processing
- **Asset Optimization** - Minified CSS/JS
- **Image Optimization** - Compressed product images

### Monitoring
- Laravel Telescope (development)
- Error logging
- Performance metrics
- Queue monitoring

## 🚀 Deployment

### Production Checklist
- [ ] Set production environment variables
- [ ] Configure SSL certificates
- [ ] Set up Redis for queues
- [ ] Import complete ZIP code database
- [ ] Configure webhook endpoints
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test payment processing
- [ ] Verify shipping integration

### Environment Variables
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_DATABASE=barffoods_prod
DB_USERNAME=your-username
DB_PASSWORD=your-password

# Stripe (Production)
STRIPE_KEY=pk_live_...
STRIPE_SECRET=sk_live_...

# EasyPost (Production)
EASYPOST_API_KEY=live_...
EASYPOST_WEBHOOK_SECRET=your-webhook-secret

# Queue
QUEUE_CONNECTION=redis
REDIS_HOST=your-redis-host
```

## 📚 Documentation

### Key Components
- **ShippingService** - Delivery calculation and EasyPost integration
- **TrackingService** - Order tracking and webhook processing
- **OrderStatusService** - Order lifecycle management
- **MessagingService** - Real-time chat system

### Database Models
- **Order** - Main order entity with relationships
- **ZipCode** - ZIP code coordinates and distance calculation
- **ShipmentTrackingEvent** - Tracking event history
- **Conversation** - Support chat conversations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test data for examples

---

**Built with ❤️ using Laravel, React, and modern web technologies.**
