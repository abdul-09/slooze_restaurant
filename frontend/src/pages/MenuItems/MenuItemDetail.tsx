import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { MenuItem } from '../../types';
import { Minus, Plus, ShoppingCart } from 'lucide-react';

const MenuItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { addToCart, isLoading: isAddingToCart} = useCartStore();
  const navigate = useNavigate();
  // const queryClient = useQueryClient();

  // Local state for cart interaction
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch menu item
  const { data: item, isLoading, error } = useQuery<MenuItem>(
    ['menuItem', id],
    () => apiService.getMenuItem(Number(id)),
    { enabled: !!id }
  );

  const handleAddToCart = async () => {
    if (!item) return;
    
    try {
      await addToCart(item, quantity, specialInstructions);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      // Reset form
      setQuantity(1);
      setSpecialInstructions('');
    } catch (error) {
      alert('Failed to add item to cart. Please try again.');
    }
  };

  // Quantity handlers
  const decreaseQuantity = () => setQuantity(Math.max(1, quantity - 1));
  const increaseQuantity = () => setQuantity(quantity + 1);
  
  if (isLoading) return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-40 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );

  if (error || !item) return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-red-600">Failed to load menu item.</div>
      <button 
        onClick={() => navigate('/menu-items')}
        className="mt-4 text-blue-600 hover:underline"
      >
        Back to Menu Items
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          Item added to cart successfully!
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Image Section */}
        <div className="md:w-1/3">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="w-full h-48 md:h-64 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 md:h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <div className="text-gray-600 mb-2">{item.category?.name}</div>
          <div className="text-green-600 font-semibold text-xl mb-2">${item.price}</div>
          <p className="text-gray-700 mb-4">{item.description}</p>
          
          <div className="text-sm text-gray-500 mb-4">
            Restaurant:{' '}
            <Link to={`/restaurants/${item.restaurant}`} className="underline">
              View Restaurant
            </Link>
          </div>

          {/* Admin Actions */}
          {user?.role === 'admin' && (
            <div className="flex gap-2 mb-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => navigate(`/menu-items/${item.id}/edit`)}
              >
                Edit
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => {
                  if (window.confirm('Delete this menu item?')) {
                    apiService.deleteMenuItem(item.id).then(() => navigate('/menu-items'));
                  }
                }}
              >
                Delete
              </button>
            </div>
          )}

          {/* Add to Cart Section (for non-admin users) */}
          {user && user.role !== 'admin' && (
            <div className="space-y-4 border-t pt-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <label className="font-medium">Quantity:</label>
                <div className="flex items-center border rounded">
                  <button
                    onClick={decreaseQuantity}
                    className="px-3 py-1 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-1 border-x">{quantity}</span>
                  <button
                    onClick={increaseQuantity}
                    className="px-3 py-1 hover:bg-gray-100"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block font-medium mb-2">
                  Special Instructions:
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests?"
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>

              {/* Add to Cart Button */}
              <button
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                <ShoppingCart size={20} />
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetail;