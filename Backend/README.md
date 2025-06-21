# Restaurant Management Backend API

A robust Django REST API backend for the restaurant management system with role-based access control, JWT authentication, and comprehensive order management.

## 🏗️ Architecture

### Tech Stack
- **Django 5.0.6** - Web framework
- **Django REST Framework 3.15.1** - API framework
- **Django REST Framework Simple JWT 5.3.1** - JWT authentication
- **Djoser 2.2.2** - Authentication endpoints
- **PostgreSQL/SQLite** - Database
- **Cloudinary** - Image storage
- **PayPal SDK** - Payment processing
- **Gunicorn** - WSGI server
- **Whitenoise** - Static file serving

### Project Structure
```
Backend/
├── api/                    # Main application
│   ├── models.py          # Database models
│   ├── views.py           # API views and endpoints
│   ├── serializers.py     # Data serialization
│   ├── permissions.py     # Custom permissions
│   ├── urls.py            # URL routing
│   ├── admin.py           # Django admin configuration
│   ├── paypal.py          # PayPal integration
│   └── migrations/        # Database migrations
├── restaurant/            # Django project settings
│   ├── settings.py        # Main settings
│   ├── urls.py            # Root URL configuration
│   └── wsgi.py            # WSGI configuration
├── media/                 # User uploaded files
├── static/                # Static files
├── templates/             # HTML templates
├── requirements.txt       # Python dependencies
├── manage.py             # Django management script
└── build.sh              # Deployment script
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip
- Virtual environment (recommended)
- PostgreSQL (for production) or SQLite (for development)

### Local Development Setup

1. **Clone the repository and navigate to backend:**
   ```bash
   cd Backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the Backend directory:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   DATABASE_URL=sqlite:///db.sqlite3

   PAYPAL_CLIENT_ID=your-paypal-client-id
   PAYPAL_CLIENT_SECRET=your-paypal-client-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   ```

5. **Run database migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create a superuser:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

8. **Access the API:**
   - API Base URL: `http://localhost:8000/api/v1/`
   - Admin Panel: `http://localhost:8000/admin/`


## 📚 API Documentation

### Authentication Endpoints

#### JWT Authentication
- `POST /api/v1/auth/jwt/create/` - Login and get tokens
- `POST /api/v1/auth/jwt/refresh/` - Refresh access token
- `POST /api/v1/auth/jwt/verify/` - Verify token

#### User Management
- `POST /api/v1/auth/users/` - Register new user
- `GET /api/v1/auth/users/me/` - Get current user profile
- `PATCH /api/v1/auth/users/me/` - Update user profile
- `POST /api/v1/auth/password/reset/` - Request password reset
- `POST /api/v1/auth/password/reset/confirm/` - Confirm password reset

### Core API Endpoints

#### Users
- `GET /api/v1/users/` - List users (Admin only (BETA))
- `GET /api/v1/users/{id}/` - Get user details
- `PATCH /api/v1/users/{id}/` - Update user
- `DELETE /api/v1/users/{id}/` - Delete user

#### Restaurants
- `GET /api/v1/restaurants/` - List restaurants
- `POST /api/v1/restaurants/` - Create restaurant (Admin only (BETA))
- `GET /api/v1/restaurants/{id}/` - Get restaurant details
- `PATCH /api/v1/restaurants/{id}/` - Update restaurant
- `DELETE /api/v1/restaurants/{id}/` - Delete restaurant

#### Menu Items
- `GET /api/v1/menu-items/` - List menu items
- `POST /api/v1/menu-items/` - Create menu item (Admin/Manager only(BETA))
- `GET /api/v1/menu-items/{id}/` - Get menu item details
- `PATCH /api/v1/menu-items/{id}/` - Update menu item
- `DELETE /api/v1/menu-items/{id}/` - Delete menu item

#### Cart Management
- `GET /api/v1/cart/current/` - Get current user's cart
- `POST /api/v1/cart/{id}/add_item/` - Add item to cart
- `POST /api/v1/cart/{id}/remove_item/` - Remove item from cart
- `POST /api/v1/cart/{id}/update_quantity/` - Update item quantity
- `POST /api/v1/cart/{id}/checkout/` - Checkout cart (Admin/Manager only)

#### Orders
- `GET /api/v1/orders/` - List orders
- `GET /api/v1/orders/{id}/` - Get order details
- `POST /api/v1/orders/{id}/update_status/` - Update order status
- `POST /api/v1/orders/{id}/cancel/` - Cancel order
- `POST /api/v1/orders/{id}/update_payment/` - Update payment method

#### Dashboard
- `GET /api/v1/dashboard/admin/` - Admin dashboard stats
- `GET /api/v1/dashboard/manager/` - Manager dashboard stats
- `GET /api/v1/dashboard/member/` - Member dashboard stats

#### Payments
- `POST /api/v1/payments/paypal/complete/` - Complete PayPal payment

### Request/Response Examples

#### Login
```bash
POST /api/v1/auth/jwt/create/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Create Restaurant
```bash
POST /api/v1/restaurants/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Pizza Palace",
  "description": "Best pizza in town",
  "cuisine_type": "Italian",
  "region": "america",
  "rating": "4.5"
}
```

## 🔐 Role-Based Access Control

### Admin Role
- Full access to all features
- User management across all regions
- Restaurant management across all regions
- Order management and analytics
- System configuration

### Manager Role
- Regional restaurant management
- Order management for their region
- Menu item management
- Limited user management (same region (BETA))

### Member Role
- Browse restaurants and menu items
- Add items to cart
- Create and track orders
- Manage personal profile

## 🗄️ Database Models

### User Model
- Email-based authentication
- Role-based permissions (admin, manager, member)
- Regional access control
- Profile information

### Restaurant Model
- Name, description, cuisine type
- Regional classification
- Rating system
- Image support via Cloudinary

### MenuItem Model
- Restaurant association
- Category classification
- Pricing and availability
- Image support

### Cart & Order Models
- Shopping cart functionality
- Order status tracking
- Payment method support
- Special instructions

## 🔧 Configuration

### Environment Variables
- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode (True/False)
- `DATABASE_URL` - Database connection string
- `CLOUDINARY_*` - Cloudinary configuration (BETA)
- `PAYPAL_*` - PayPal API credentials
- `EMAIL_*` - Email configuration

### Database Configuration
- **Development**: SQLite (default)
- **Production**: PostgreSQL (recommended)

### Static Files
- Served via Whitenoise
- Cloudinary for media files - Currentlu using urlfield, to be updated soon
- CDN support for production

## 🚀 Deployment

### Production link

```

```




## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Regional data isolation
- CORS configuration
- Input validation and sanitization
- SQL injection protection
- XSS protection

## 📝 Logging

- Application logs in `debug.log`
- Error tracking and monitoring
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation
- Review the code comments
- Contact the development team

## 🔗 Related Links

- [Frontend Repository](../frontend/README.md)
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [JWT Documentation](https://django-rest-framework-simplejwt.readthedocs.io/)
