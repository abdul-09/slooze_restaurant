import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Search, Filter, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiService } from '../../services/api';
import { Order } from '../../types';

const Orders: React.FC = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: orders, isLoading, error } = useQuery<Order[]>(
    'orders',
    () => apiService.getOrders(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load orders</div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
          <Package className="h-full w-full" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-500 mb-6">
          {searchTerm || statusFilter ? 'No orders match your criteria' : 'You haven\'t placed any orders yet'}
        </p>
        {(searchTerm || statusFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
            }}
            className="btn-primary"
          >
            Clear filters
          </button>
        )}
        {!searchTerm && !statusFilter && (
          <Link to="/restaurants" className="btn-primary">
            Browse Restaurants
          </Link>
        )}
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toString().includes(searchTerm) ||
                         order.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
      case 'preparing':
      case 'ready':
        return <Package className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          {user?.role === 'member' ? 'Track your order history' : 'Manage and track orders'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input pl-10"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders && filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${Number(order.total_amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Restaurant</h4>
                    <p className="text-sm text-gray-600">{order.restaurant.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Payment Method</h4>
                    <p className="text-sm text-gray-600 capitalize">{order.payment_method}</p>
                  </div>
                </div>

                {order.special_instructions && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Special Instructions</h4>
                    <p className="text-sm text-gray-600">{order.special_instructions}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.menu_item.name}
                        </span>
                        <span className="text-gray-900">${Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    <p>Created: {new Date(order.created_at).toLocaleString()}</p>
                    {order.placed_at && (
                      <p>Placed: {new Date(order.placed_at).toLocaleString()}</p>
                    )}
                    {order.cancelled_at && (
                      <p>Cancelled: {new Date(order.cancelled_at).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Link
                      to={`/orders/${order.id}`}
                      className="btn-primary text-sm"
                    >
                      View Details
                    </Link>
                    {user && (user.role === 'admin' || user.role === 'manager') && order.status === 'pending' && (
                      <button className="btn-danger" disabled>
                        Cancel
                      </button>
                    )}
                    {user && user.role === 'admin' && (
                      <button className="btn-warning" disabled>
                        Modify Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <Package className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter ? 'No orders match your criteria' : 'You haven\'t placed any orders yet'}
          </p>
          {(searchTerm || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="btn-primary"
            >
              Clear filters
            </button>
          )}
          {!searchTerm && !statusFilter && (
            <Link to="/restaurants" className="btn-primary">
              Browse Restaurants
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders; 