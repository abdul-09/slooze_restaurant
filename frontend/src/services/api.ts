import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Restaurant, 
  MenuItem, 
  Cart, 
  Order, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL!;

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/jwt/refresh/`, {
                refresh: refreshToken,
              });

              const { access } = response.data;
              localStorage.setItem('access_token', access);

              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/jwt/create/', credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/users/', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/users/me/');
    return response.data;
  }

  async refreshToken(refresh: string): Promise<{ access: string }> {
    const response: AxiosResponse<{ access: string }> = await this.api.post('/auth/jwt/refresh/', { refresh });
    return response.data;
  }

  async resetPassword(email: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post('/auth/password/reset/', { email });
    return response.data;
  }

  async confirmPasswordReset(uid: string, token: string, new_password: string, re_new_password: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post('/auth/password/reset/confirm/', {
      uid,
      token,
      new_password,
      re_new_password,
    });
    return response.data;
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.api.get('/users/');
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/users/${id}/`);
    return response.data;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.patch(`/users/${id}/`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/users/${id}/`);
  }

  // Restaurant endpoints
  async getRestaurants(): Promise<Restaurant[]> {
    const response: AxiosResponse<Restaurant[]> = await this.api.get('/restaurants/');
    return response.data;
  }

  async getRestaurant(id: number): Promise<Restaurant> {
    const response: AxiosResponse<Restaurant> = await this.api.get(`/restaurants/${id}/`);
    return response.data;
  }

  async createRestaurant(data: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<Restaurant> {
    const response: AxiosResponse<Restaurant> = await this.api.post('/restaurants/', data);
    return response.data;
  }

  async updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant> {
    const response: AxiosResponse<Restaurant> = await this.api.patch(`/restaurants/${id}/`, data);
    return response.data;
  }

  async deleteRestaurant(id: number): Promise<void> {
    await this.api.delete(`/restaurants/${id}/`);
  }

  // Menu item endpoints
  async getMenuItems(restaurantId?: number): Promise<MenuItem[]> {
    const params = restaurantId ? { restaurant_id: restaurantId } : {};
    const response: AxiosResponse<MenuItem[]> = await this.api.get('/menu-items/', { params });
    return response.data;
  }

  async getMenuItem(id: number): Promise<MenuItem> {
    const response: AxiosResponse<MenuItem> = await this.api.get(`/menu-items/${id}/`);
    return response.data;
  }

  async createMenuItem(data: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    const response: AxiosResponse<MenuItem> = await this.api.post('/menu-items/', data);
    return response.data;
  }

  async updateMenuItem(id: number, data: Partial<MenuItem>): Promise<MenuItem> {
    const response: AxiosResponse<MenuItem> = await this.api.patch(`/menu-items/${id}/`, data);
    return response.data;
  }

  async deleteMenuItem(id: number): Promise<void> {
    await this.api.delete(`/menu-items/${id}/`);
  }

  // Cart endpoints
  async getCart(): Promise<Cart> {
    const response: AxiosResponse<Cart> = await this.api.get('/cart/current/');
    return response.data;
  }

  async addToCart(menuItemId: number, quantity: number, specialInstructions?: string): Promise<Cart> {
    // First get the cart to get its ID
    const cart = await this.getCart();
    const response: AxiosResponse<Cart> = await this.api.post(`/cart/${cart.id}/add_item/`, {
      menu_item_id: menuItemId,
      quantity,
      special_instructions: specialInstructions || '',
    });
    return response.data;
  }

  async removeFromCart(cartId: number, cartItemId: number): Promise<Cart> {
    const response: AxiosResponse<Cart> = await this.api.post(`/cart/${cartId}/remove_item/`, { cart_item_id: cartItemId });
    return response.data;
  }

  async updateCartItemQuantity(cartId: number, cartItemId: number, quantity: number): Promise<Cart> {
    const response: AxiosResponse<Cart> = await this.api.post(`/cart/${cartId}/update_quantity/`, {
      cart_item_id: cartItemId,
      quantity: quantity,
    });
    return response.data;
  }

  async checkout(paymentMethod: string, specialInstructions?: string): Promise<Order> {
    // First get the cart to get its ID
    const cart = await this.getCart();
    const response: AxiosResponse<Order> = await this.api.post(`/cart/${cart.id}/checkout/`, {
      payment_method: paymentMethod,
      special_instructions: specialInstructions || '',
    });
    return response.data;
  }

  // Order endpoints
  async getOrders(): Promise<Order[]> {
    const response: AxiosResponse<Order[]> = await this.api.get('/orders/');
    return response.data;
  }

  async getOrder(id: number): Promise<Order> {
    const response: AxiosResponse<Order> = await this.api.get(`/orders/${id}/`);
    return response.data;
  }

  async placeOrder(id: number): Promise<Order> {
    const response: AxiosResponse<Order> = await this.api.post(`/orders/${id}/place/`);
    return response.data;
  }

  async cancelOrder(id: number): Promise<Order> {
    const response: AxiosResponse<Order> = await this.api.post(`/orders/${id}/cancel/`);
    return response.data;
  }

  async updateOrderPayment(id: number, paymentMethod: string): Promise<Order> {
    const response: AxiosResponse<Order> = await this.api.post(`/orders/${id}/update_payment/`, {
      payment_method: paymentMethod,
    });
    return response.data;
  }

  async completePaypalPayment(orderID: string): Promise<any> {
    const response = await this.api.post('/payments/paypal/complete/', { orderID });
    return response.data;
  }

  async getDashboard(role: string): Promise<any> {
    let url = '/dashboard/member/';
    if (role === 'admin') url = '/dashboard/admin/';
    else if (role === 'manager') url = '/dashboard/manager/';
    const response = await this.api.get(url);
    return response.data;
  }
}

// Create a single instance and export it consistently
const apiService = new ApiService();

// Bind all methods to ensure proper 'this' context
const boundApiService = {
  ...apiService,
  getRestaurants: apiService.getRestaurants.bind(apiService),
  getRestaurant: apiService.getRestaurant.bind(apiService),
  createRestaurant: apiService.createRestaurant.bind(apiService),
  updateRestaurant: apiService.updateRestaurant.bind(apiService),
  deleteRestaurant: apiService.deleteRestaurant.bind(apiService),
  getMenuItems: apiService.getMenuItems.bind(apiService),
  getMenuItem: apiService.getMenuItem.bind(apiService),
  createMenuItem: apiService.createMenuItem.bind(apiService),
  updateMenuItem: apiService.updateMenuItem.bind(apiService),
  deleteMenuItem: apiService.deleteMenuItem.bind(apiService),
  getCart: apiService.getCart.bind(apiService),
  addToCart: apiService.addToCart.bind(apiService),
  removeFromCart: apiService.removeFromCart.bind(apiService),
  updateCartItemQuantity: apiService.updateCartItemQuantity.bind(apiService),
  checkout: apiService.checkout.bind(apiService),
  getOrders: apiService.getOrders.bind(apiService),
  getOrder: apiService.getOrder.bind(apiService),
  placeOrder: apiService.placeOrder.bind(apiService),
  cancelOrder: apiService.cancelOrder.bind(apiService),
  updateOrderPayment: apiService.updateOrderPayment.bind(apiService),
  completePaypalPayment: apiService.completePaypalPayment.bind(apiService),
  getDashboard: apiService.getDashboard.bind(apiService),
  login: apiService.login.bind(apiService),
  register: apiService.register.bind(apiService),
  getCurrentUser: apiService.getCurrentUser.bind(apiService),
  refreshToken: apiService.refreshToken.bind(apiService),
  resetPassword: apiService.resetPassword.bind(apiService),
  confirmPasswordReset: apiService.confirmPasswordReset.bind(apiService),
  getUsers: apiService.getUsers.bind(apiService),
  getUser: apiService.getUser.bind(apiService),
  updateUser: apiService.updateUser.bind(apiService),
  deleteUser: apiService.deleteUser.bind(apiService),
};

export { boundApiService as apiService };
export default boundApiService;