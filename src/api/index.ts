import { Platform } from 'react-native';
import { Category, Product, ProductImage } from '../types/catalog';

// Use your computer's IP for mobile devices, localhost for web
const API_BASE = Platform.OS === 'web'
  ? 'http://localhost:3001/api'
  : 'http://192.168.0.106:3001/api';

type APIProductImage = {
  id: number;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
};

type APIProduct = {
  id: string;
  categoryId: string;
  name: string;
  unit: string;
  price: string | number;
  rating: string | number;
  emoji: string;
  color: string;
  description: string;
  discount?: number;
  imageUrl?: string;
  images?: APIProductImage[];
  variants?: string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  pinCode: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

export type SignUpData = {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  pinCode: string;
  address: string;
};

export type SignInData = {
  mobileNumber: string;
  password: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

const mapProduct = (p: APIProduct): Product => ({
  id: p.id,
  categoryId: p.categoryId,
  name: p.name,
  unit: p.unit,
  price: Number(p.price),
  rating: Number(p.rating),
  emoji: p.emoji,
  color: p.color,
  description: p.description,
  discount: p.discount || 0,
  imageUrl: p.imageUrl,
  images: p.images,
  variants: p.variants,
});

export const api = {
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  async getProducts(categoryId?: string): Promise<Product[]> {
    const url = categoryId && categoryId !== 'all'
      ? `${API_BASE}/products?category=${categoryId}`
      : `${API_BASE}/products`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data: APIProduct[] = await response.json();
    return data.map(mapProduct);
  },

  async getProduct(id: string): Promise<Product> {
    const response = await fetch(`${API_BASE}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    const data: APIProduct = await response.json();
    return mapProduct(data);
  },

  async searchProducts(query: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    const data: APIProduct[] = await response.json();
    return data.map(mapProduct);
  },

  async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Sign up failed');
    return result;
  },

  async signIn(data: SignInData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Sign in failed');
    return result;
  },

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to fetch profile');
    return result;
  },

  async updateProfile(token: string, data: Partial<SignUpData>): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update profile');
    return result;
  },

  // Orders
  async getUPIConfig(): Promise<{ upiId: string; businessName: string }> {
    const response = await fetch(`${API_BASE}/orders/upi-config`);
    if (!response.ok) throw new Error('Failed to fetch UPI config');
    return response.json();
  },

  async createOrder(data: CreateOrderData): Promise<CreateOrderResponse> {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to create order');
    return result;
  },

  async getOrder(id: number): Promise<Order> {
    const response = await fetch(`${API_BASE}/orders/${id}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const response = await fetch(`${API_BASE}/orders/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  async markPaymentSubmitted(orderId: number): Promise<Order> {
    const response = await fetch(`${API_BASE}/orders/${orderId}/payment-submitted`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to update order');
    return response.json();
  },

  async getSavedAddresses(userId: string): Promise<SavedAddress[]> {
    const response = await fetch(`${API_BASE}/orders/addresses/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch saved addresses');
    return response.json();
  },
};

export type SavedAddress = {
  userName: string;
  userMobile: string;
  deliveryAddress: string;
  pinCode: string;
};

export type OrderItem = {
  id: number;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  unit?: string;
  selectedVariants?: string;
};

export type Order = {
  id: number;
  userId: string;
  userName: string;
  userMobile: string;
  deliveryAddress: string;
  pinCode: string;
  totalAmount: number;
  paymentMethod: 'UPI' | 'COD';
  paymentStatus: 'pending' | 'submitted' | 'verified' | 'failed';
  orderStatus: 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  upiTransactionNote: string;
  createdAt: string;
  items: OrderItem[];
};

export type CreateOrderData = {
  userId: string;
  userName: string;
  userMobile: string;
  deliveryAddress: string;
  pinCode: string;
  totalAmount: number;
  paymentMethod: 'UPI' | 'COD';
  items: {
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
    unit?: string;
    selectedVariants?: string;
  }[];
};

export type CreateOrderResponse = {
  order: Order;
  payment: {
    upiId: string;
    businessName: string;
    amount: number;
    transactionNote: string;
    upiLink: string;
  } | null;
};

export const getApiUrl = (): string => API_BASE;
