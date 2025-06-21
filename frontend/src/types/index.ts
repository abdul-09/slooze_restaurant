export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'member';
  region: 'india' | 'america' | 'global';
  is_active: boolean;
}

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisine_type: string;
  region: 'india' | 'america';
  rating: string;
  image_url?: string;
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: Category;
  is_available: boolean;
  restaurant: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  menu_item: MenuItem;
  quantity: number;
  special_instructions: string;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: number;
  customer: number;
  items: CartItem[];
  total: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  menu_item: MenuItem;
  quantity: number;
  price: number;
  special_instructions: string;
  subtotal: number;
}

export interface Order {
  id: number;
  customer: number;
  restaurant: Restaurant;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_method: 'cash' | 'card' | 'paypal';
  total_amount: number;
  special_instructions: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  placed_at?: string;
  cancelled_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  re_password: string;
  first_name: string;
  last_name: string;
  region: 'india' | 'america';
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FormError {
  field: string;
  message: string;
}

export interface DashboardStats {
  total_users?: number;
  total_restaurants?: number;
  total_orders?: number;
  total_revenue?: number;
  region?: string;
  total_spent?: number;
  recent_orders?: Array<{
    id: number;
    customer__first_name?: string;
    restaurant__name: string;
    status: string;
    created_at: string;
    total_amount: number;
  }>;
  top_restaurants?: Array<{
    id: number;
    name: string;
    order_count: number;
  }>;
}