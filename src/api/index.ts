import { Category, Product } from '../types/catalog';

const API_BASE = 'http://localhost:3001/api';

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
};

export const getApiUrl = (): string => API_BASE;
