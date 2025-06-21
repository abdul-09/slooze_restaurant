import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { MenuItem, Restaurant } from '../../types';
import { Link } from 'react-router-dom';

const MenuItems: React.FC = () => {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [restaurantId, setRestaurantId] = useState<number | ''>('');

  const { data: restaurants } = useQuery<Restaurant[]>('restaurants', () => apiService.getRestaurants());
  const { data: menuItems, isLoading } = useQuery<MenuItem[]>(
    ['menuItems', restaurantId],
    () => apiService.getMenuItems(restaurantId ? Number(restaurantId) : undefined)
  );

  const filtered = menuItems?.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Menu Items</h1>
          <p className="text-gray-500">Browse all menu items</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered"
          />
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value ? Number(e.target.value) : '')}
            className="input input-bordered"
          >
            <option value="">All Restaurants</option>
            {restaurants?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {user?.role === 'admin' && (
            <Link to="/menu-items/new" className="btn-primary">
              Add Menu Item
            </Link>
          )}
        </div>
      </div>
      {isLoading ? (
        <div>Loading menu items...</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => (
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
  );
};

export default MenuItems;