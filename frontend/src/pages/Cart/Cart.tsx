// src/components/Cart/Cart.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { apiService } from '../../services/api';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart: currentCart, getCart, checkout, isLoading, removeFromCart, updateQuantity } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    getCart();
  }, [getCart]);

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error('Quantity must be at least 1');
      return;
    }
    try {
      await updateQuantity(cartItemId, newQuantity);
      toast.success('Quantity updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      await removeFromCart(cartItemId);
      toast.success('Item removed from cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove item from cart');
    }
  };

  const handleCheckout = async () => {
    if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    setPaymentMethod('card');
    try {
      await checkout(paymentMethod, specialInstructions);
      toast.success('Order placed successfully!');
      navigate('/order-success');
    } catch (error: any) {
      toast.error(error.message || 'Checkout failed. Please try again.');
    }
  };

  // PayPal integration
  const handlePaypalApprove = async (data: any, actions: any) => {
    try {
      await apiService.completePaypalPayment(data.orderID);
      toast.success('PayPal payment successful! Order placed.');
      getCart(); // Refresh cart
      navigate('/order-success');
    } catch (error: any) {
      toast.error(error.message || 'PayPal payment failed.');
    }
  };

  const canPlaceOrder = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Cart</h1>

      {!currentCart || currentCart.items.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">Your cart is empty.</p>
          <button
            onClick={() => navigate('/restaurants')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-3">Items</h2>
            {currentCart.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-4 border-b last:border-b-0">
                <div className="flex items-center space-x-4">
                  <img src={item.menu_item.image_url || 'https://via.placeholder.com/80'} alt={item.menu_item.name} className="w-20 h-20 object-cover rounded-md" />
                  <div>
                    <h3 className="font-semibold text-lg">{item.menu_item.name}</h3>
                    <p className="text-gray-600">${Number(item.menu_item.price).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    {item.special_instructions && (
                      <p className="text-sm text-gray-500 italic">Instructions: {item.special_instructions}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 py-1 border-x">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Remove item"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-3">Order Summary</h2>
            <div>
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Subtotal ({currentCart.items.length} items)</span>
                <span>${currentCart.total ? Number(currentCart.total).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Delivery</span>
                <span>$0.00</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-medium text-gray-900">
                  <span>Total</span>
                  <span>${Number(currentCart.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Conditional Checkout Button based on user role */}
            {canPlaceOrder ? (
              <>
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="btn-primary w-full mt-4"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Proceed to Checkout (Cash)'
                  )}
                </button>
                <div className="my-4 text-center text-gray-500">or</div>
                {/* PayPal Button */}
                <PayPalScriptProvider options={{ clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID!, currency: "USD" }}>
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{
                        amount: {
                          value: Number(currentCart.total).toFixed(2),
                          currency_code: "USD",
                        },
                      }],
                    });
                  }}
                  onApprove={handlePaypalApprove}
                />
              </PayPalScriptProvider>
              </>
            ) : (
              <div className="text-yellow-600 font-medium text-center mt-4">
                Only managers and admins can place orders.
                Notify the Manager when you want to place an order.
                You can add or remove items from your cart.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;