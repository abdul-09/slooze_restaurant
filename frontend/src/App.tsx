import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RoleRoute from './components/Auth/RoleRoute';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Restaurants from './pages/Restaurants/Restaurants';
import RestaurantDetail from './pages/Restaurants/RestaurantDetail';
import MenuItems from './pages/MenuItems/MenuItems';
import MenuItemDetail from './pages/MenuItems/MenuItemDetail';
import Cart from './pages/Cart/Cart';
import Orders from './pages/Orders/Orders';
import OrderDetail from './pages/Orders/OrderDetail';
import Users from './pages/Users/Users';
import UserDetail from './pages/Users/UserDetail';
import Profile from './pages/Profile/Profile';

// Stores
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isAuthenticated, getCurrentUser, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      getCurrentUser();
    }
  }, [isAuthenticated, getCurrentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
    <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
            <Route path="/reset-password/:uid/:token" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/dashboard" />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              
              {/* Dashboard */}
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Restaurants */}
              <Route path="restaurants" element={<Restaurants />} />
              <Route path="restaurants/:id" element={<RestaurantDetail />} />
              
              {/* Menu Items */}
              <Route path="menu-items" element={<MenuItems />} />
              <Route path="menu-items/:id" element={<MenuItemDetail />} />
              
              {/* Cart */}
              <Route path="cart" element={<Cart />} />
              
              {/* Orders */}
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              
              {/* Profile */}
              <Route path="profile" element={<Profile />} />
              
              {/* Admin/Manager Only Routes */}
              <Route path="users" element={
                <RoleRoute allowedRoles={['admin', 'manager']}>
                  <Users />
                </RoleRoute>
              } />
              <Route path="users/:id" element={
                <RoleRoute allowedRoles={['admin', 'manager']}>
                  <UserDetail />
                </RoleRoute>
              } />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
    </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
