import React from 'react';
import { useQuery } from 'react-query';
import { 
  Users, 
  Building2, 
  Package, 
  DollarSign, 
  TrendingUp,
  MapPin,
  Utensils,
  ShoppingCart
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiService } from '../../services/api';
import { DashboardStats } from '../../types';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery<DashboardStats>(
    ['dashboard-stats', user?.role],
    async () => {
      if (!user?.role) return null;
      return await apiService.getDashboard(user.role);
    },
    { enabled: !!user?.role }
  );

  const getWelcomeMessage = () => {
    const time = new Date().getHours();
    let greeting = 'Good morning';
    if (time >= 12 && time < 17) greeting = 'Good afternoon';
    else if (time >= 17) greeting = 'Good evening';
    return `${greeting}, ${user?.first_name}!`;
  };

  const getRoleDescription = () => {
    switch (user?.role) {
      case 'admin':
        return 'You have full access to manage all restaurants, users, and orders across all regions.';
      case 'manager':
        return `You can manage restaurants and orders in the ${user.region} region.`;
      case 'member':
        return 'You can browse restaurants, place orders, and track your order history.';
      default:
        return '';
    }
  };

  const getStatsCards = () => {
    if (user?.role === 'admin') {
      return [
        {
          title: 'Total Users',
          value: stats?.total_users || 0,
          icon: Users,
          color: 'bg-blue-500',
          change: '+12%',
          changeType: 'positive',
        },
        {
          title: 'Total Restaurants',
          value: stats?.total_restaurants || 0,
          icon: Building2,
          color: 'bg-green-500',
          change: '+5%',
          changeType: 'positive',
        },
        {
          title: 'Total Orders',
          value: stats?.total_orders || 0,
          icon: Package,
          color: 'bg-yellow-500',
          change: '+8%',
          changeType: 'positive',
        },
        {
          title: 'Total Revenue',
          value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
          icon: DollarSign,
          color: 'bg-purple-500',
          change: '+15%',
          changeType: 'positive',
        },
      ];
    } else if (user?.role === 'manager') {
      return [
        {
          title: 'Region',
          value: stats?.region || '',
          icon: MapPin,
          color: 'bg-blue-500',
          change: '',
          changeType: 'neutral',
        },
        {
          title: 'Restaurants',
          value: stats?.total_restaurants || 0,
          icon: Building2,
          color: 'bg-green-500',
          change: '+3%',
          changeType: 'positive',
        },
        {
          title: 'Orders',
          value: stats?.total_orders || 0,
          icon: Package,
          color: 'bg-yellow-500',
          change: '+6%',
          changeType: 'positive',
        },
        {
          title: 'Revenue',
          value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
          icon: DollarSign,
          color: 'bg-purple-500',
          change: '+12%',
          changeType: 'positive',
        },
      ];
    } else {
      return [
        {
          title: 'Total Orders',
          value: stats?.total_orders || 0,
          icon: Package,
          color: 'bg-blue-500',
          change: '',
          changeType: 'neutral',
        },
        {
          title: 'Total Spent',
          value: `$${(stats?.total_spent || 0).toLocaleString()}`,
          icon: DollarSign,
          color: 'bg-green-500',
          change: '',
          changeType: 'neutral',
        },
      ];
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
        <p className="mt-1 text-sm text-gray-500">{getRoleDescription()}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsCards().map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center justify-center h-12 w-12 rounded-md ${stat.color} text-white`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      {stat.change && (
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'positive' ? 'text-green-600' : 
                          stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                          <span className="sr-only">
                            {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                          </span>
                          {stat.change}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quick Actions
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Coming Soon
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.role === 'admin' && (
              <>
                <button className="btn-primary opacity-75 cursor-not-allowed" disabled>
                  <Users className="h-5 w-5 mr-2" />
                  Manage Users
                </button>
                <button className="btn-primary opacity-75 cursor-not-allowed" disabled>
                  <Building2 className="h-5 w-5 mr-2" />
                  Add Restaurant
                </button>
                <button className="btn-primary opacity-75 cursor-not-allowed" disabled>
                  <Package className="h-5 w-5 mr-2" />
                  View Orders
                </button>
              </>
            )}
            {user?.role === 'manager' && (
              <>
                <button className="btn-primary opacity-75 cursor-not-allowed" disabled>
                  <Building2 className="h-5 w-5 mr-2" />
                  Manage Restaurants
                </button>
                <button className="btn-primary opacity-75 cursor-not-allowed" disabled>
                  <Package className="h-5 w-5 mr-2" />
                  View Orders
                </button>
                <button className="btn-primary opacity-75 cursor-not-allowed" disabled>
                  <Utensils className="h-5 w-5 mr-2" />
                  Manage Menu
                </button>
              </>
            )}
            {user?.role === 'member' && (
              <>
                <button className="btn-primary opacity-75 cursor-not-allowed" disabled>
                  <Building2 className="h-5 w-5 mr-2" />
                  Browse Restaurants
                </button>
                <button className="btn-primary opacity-75 cursor-not-allowed" disabled>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  View Cart
                </button>
                <button className="btn-primary opacity-75 cursor-not-allowed" disabled>
                  <Package className="h-5 w-5 mr-2" />
                  My Orders
                </button>
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-500 italic">
            These quick action features are currently in development and will be available soon.
          </p>
        </div>
      </div>

      {/* Recent Activity (from stats.recent_orders) */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {stats?.recent_orders && stats.recent_orders.length > 0 ? (
              stats.recent_orders.map((order: any) => (
                <div key={order.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Package className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Order #{order.id} - {order.restaurant__name || order["restaurant__name"]}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.customer__first_name ? `By ${order.customer__first_name}` : ''} | Status: {order.status} | ${order.total_amount}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No recent activity.</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Restaurants (from stats.top_restaurants) */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Top Restaurants
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats?.top_restaurants && stats.top_restaurants.length > 0 ? (
              stats.top_restaurants.map((rest: any) => (
                <div key={rest.id} className="bg-gray-50 p-4 rounded shadow flex flex-col items-center">
                  <Building2 className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="font-semibold text-gray-900">{rest.name}</div>
                  <div className="text-sm text-gray-500">Orders: {rest.order_count}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No data.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 