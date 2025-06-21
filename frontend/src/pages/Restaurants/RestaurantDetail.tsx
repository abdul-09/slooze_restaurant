import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Restaurant, MenuItem } from '../../types';

const RestaurantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: restaurant, isLoading, error } = useQuery<Restaurant>(
    ['restaurant', id],
    () => apiService.getRestaurant(Number(id)),
    { enabled: !!id }
  );

  const { data: menuItems, isLoading: loadingMenu } = useQuery<MenuItem[]>(
    ['menuItems', id],
    () => apiService.getMenuItems(Number(id)),
    { enabled: !!id }
  );

  if (isLoading) return <div>Loading restaurant...</div>;
  if (error || !restaurant) return <div>Restaurant not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row gap-6">
        {restaurant.image_url && (
          <img src={restaurant.image_url} alt={restaurant.name} className="w-40 h-40 object-cover rounded" />
        )}
        <div>
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <div className="text-gray-600 mb-2">{restaurant.cuisine_type}</div>
          <div className="text-sm text-gray-500 mb-2">Region: {restaurant.region}</div>
          <div className="text-yellow-500 font-semibold mb-2">Rating: {restaurant.rating}</div>
          <p className="text-gray-700">{restaurant.description}</p>
          {user?.role === 'admin' && (
            <div className="mt-4 flex gap-2">
              <button
                className="btn-primary"
                onClick={() => navigate(`/restaurants/${restaurant.id}/edit`)}
              >
                Edit
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  if (window.confirm('Delete this restaurant?')) {
                    apiService.deleteRestaurant(restaurant.id).then(() => navigate('/restaurants'));
                  }
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Menu Items</h2>
        {loadingMenu ? (
          <div>Loading menu...</div>
        ) : menuItems && menuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item) => (
              <Link
                to={`/menu-items/${item.id}`}
                key={item.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-4">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-gray-500 text-sm">{item.category?.name}</div>
                    <div className="text-green-600 font-semibold">${item.price}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div>No menu items found.</div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetail;