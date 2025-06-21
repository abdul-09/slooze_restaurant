import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../stores/orderStore';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

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

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder: order, isLoading, error, fetchOrder, cancelOrder } = useOrderStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (id) {
      fetchOrder(Number(id));
    }
    // eslint-disable-next-line
  }, [id]);

  const handleCancel = async () => {
    if (order && order.id) {
      await cancelOrder(order.id);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse max-w-2xl mx-auto p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-red-600 mb-4">Failed to load order details.</div>
        <button onClick={() => navigate('/orders')} className="btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          <span className="ml-1 capitalize">{order.status}</span>
        </span>
      </div>
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Restaurant</h4>
            <p className="text-sm text-gray-600">{order.restaurant.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Payment Method</h4>
            <p className="text-sm text-gray-600 capitalize">{order.payment_method}</p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">Total Amount</h4>
          <p className="text-lg font-semibold text-gray-900">${Number(order.total_amount).toFixed(2)}</p>
        </div>
        {order.special_instructions && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Special Instructions</h4>
            <p className="text-sm text-gray-600">{order.special_instructions}</p>
          </div>
        )}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.menu_item.name}
                </span>
                <span className="text-gray-900">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="text-sm text-gray-500">
            <p>Created: {new Date(order.created_at).toLocaleString()}</p>
            {order.placed_at && <p>Placed: {new Date(order.placed_at).toLocaleString()}</p>}
            {order.cancelled_at && <p>Cancelled: {new Date(order.cancelled_at).toLocaleString()}</p>}
          </div>
        </div>
        <div className="flex justify-between mt-6 gap-2">
          <button onClick={() => navigate('/orders')} className="btn-secondary">
            Back to Orders
          </button>
          <Link to="/restaurants" className="btn-primary">
            Browse Restaurants
          </Link>
          {user && (user.role === 'admin' || user.role === 'manager') && order.status === 'pending' && (
            <button onClick={handleCancel} className="btn-danger">
              Cancel Order
            </button>
          )}
          {user && user.role === 'admin' && (
            <button className="btn-warning" disabled>
              Modify Payment Method
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail; 