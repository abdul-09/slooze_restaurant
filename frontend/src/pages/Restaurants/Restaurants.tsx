import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Search, Star, MapPin } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiService } from '../../services/api';
import { Restaurant } from '../../types';

const Restaurants: React.FC = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const { data: restaurants, isLoading, error } = useQuery<Restaurant[]>(
  'restaurants',
  () => apiService.getRestaurants(),
  {
    staleTime: 5 * 60 * 1000,
  }
);

  const filteredRestaurants = restaurants?.filter((restaurant) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch
  });

  const canManageRestaurants = user?.role === 'admin' || user?.role === 'manager';

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
        <div className="text-red-600 mb-4">Failed to load restaurants</div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and manage restaurants in your region
          </p>
        </div>
        {/* {canManageRestaurants && (
          <div className="mt-4 sm:mt-0">
            <Link
              to="/restaurants/new"
              className="btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Restaurant
            </Link>
          </div>
        )} */}
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
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Restaurants Grid */}
      {filteredRestaurants && filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-lg shadow overflow-hidden">
              {restaurant.image_url && (
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {restaurant.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="capitalize">{restaurant.region}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        <span>{restaurant.rating}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {restaurant.cuisine_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    to={`/restaurants/${restaurant.id}`}
                    className="btn-primary text-sm"
                  >
                    View Details
                  </Link>
                  {canManageRestaurants && (
                    <div className="flex space-x-2">
                      <Link
                        to={`/restaurants/${restaurant.id}/edit`}
                        className="btn-secondary text-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchTerm || regionFilter ? 'No restaurants found matching your criteria' : 'No restaurants available'}
          </div>
          {(searchTerm || regionFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRegionFilter('');
              }}
              className="btn-primary"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Restaurants; 