# Restaurant Management Frontend

A modern React TypeScript frontend for the restaurant management system with role-based access control, real-time cart management, and comprehensive order tracking.

## Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with automatic token refresh
- **Role-based access control** (Admin, Manager, Member)
- **Regional access control** for managers
- **Password reset functionality**

### 🏪 Restaurant Management
- **Browse restaurants** with search and filtering
- **Restaurant details** with menu items
- **Add/Edit restaurants** (Admin/Manager only)
- **Regional restaurant management**

### 🍽️ Menu Management
- **Browse menu items** by restaurant
- **Add/Edit menu items** (Admin/Manager only)
- **Category-based organization**
- **Image support for menu items**

### 🛒 Shopping Cart
- **Add items to cart** with quantity control
- **Real-time cart updates**
- **Special instructions** for each item
- **Cart persistence** across sessions

### 📦 Order Management
- **Place orders** with payment method selection
- **Order tracking** with status updates
- **Order history** for all users
- **Order management** for staff

### 👥 User Management
- **User registration** with role assignment
- **User profile management**
- **User administration** (Admin/Manager only)
- **Regional user management**

## Tech Stack

- **React 19** with TypeScript
- **React Router v6** for navigation
- **React Query** for server state management
- **Zustand** for client state management
- **React Hook Form** for form handling
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for HTTP requests
- **React Hot Toast** for notifications

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_PAYPAL_CLIENT_ID='Your paypal client id'
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   └── Layout/         # Layout and navigation
├── pages/              # Page components
│   ├── Auth/           # Authentication pages
│   ├── Dashboard/      # Dashboard pages
│   ├── Restaurants/    # Restaurant management
│   ├── MenuItems/      # Menu item management
│   ├── Cart/           # Shopping cart
│   ├── Orders/         # Order management
│   └── Users/          # User management
├── services/           # API services
├── stores/             # State management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## API Integration

The frontend integrates with the Django REST API backend:

- **Base URL**: `http://localhost:8000/api/v1`
- **Authentication**: JWT tokens
- **Error Handling**: Automatic token refresh and error notifications
- **Caching**: React Query for efficient data caching

## Role-Based Features

### 👑 Admin
- Full access to all features
- User management across all regions
- Restaurant management across all regions
- Order management and analytics

### 👨‍💼 Manager
- Regional restaurant management
- Order management for their region
- Menu item management

### 👤 Member
- Browse restaurants and menu items
- Add items to cart
- Create and track orders
- Manage personal profile

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Tailwind CSS** for styling

### State Management

- **Zustand** for global state (auth, cart)
- **React Query** for server state
- **React Hook Form** for form state

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Setup

Set the `REACT_APP_API_URL` environment variable to your production API URL.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
