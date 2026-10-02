import axios from 'axios';

const API_BASE = '/api/admin';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export type Admin = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  icon?: string;
  products?: Product[];
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  unit?: string;
  price: number;
  rating?: number;
  emoji?: string;
  color?: string;
  description?: string;
  stock?: number;
  discount?: number;
  imageUrl?: string;
  variants?: string;
  category?: Category;
  images?: ProductImage[];
};

export type ProductImage = {
  id: number;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type DashboardStats = {
  products: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
  };
  categories: number;
  users: number;
};

export const adminApi = {
  // Auth
  async login(email: string, password: string) {
    const { data } = await api.post<{ admin: Admin; token: string }>('/auth/login', { email, password });
    return data;
  },

  async signup(name: string, email: string, password: string) {
    const { data } = await api.post<{ admin: Admin; token: string }>('/auth/signup', { name, email, password });
    return data;
  },

  async getProfile() {
    const { data } = await api.get<Admin>('/auth/profile');
    return data;
  },

  // Dashboard
  async getDashboardStats() {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
    return data;
  },

  // Products
  async getProducts(params?: { categoryId?: string; search?: string; page?: number; limit?: number }) {
    const { data } = await api.get<{ products: Product[]; pagination: any }>('/products', { params });
    return data;
  },

  async getProduct(id: string) {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  async createProduct(product: Omit<Product, 'category' | 'images'>) {
    const { data } = await api.post<Product>('/products', product);
    return data;
  },

  async updateProduct(id: string, product: Partial<Product>) {
    const { data } = await api.put<Product>(`/products/${id}`, product);
    return data;
  },

  async deleteProduct(id: string) {
    await api.delete(`/products/${id}`);
  },

  async updateStock(id: string, stock: number) {
    const { data } = await api.patch<Product>(`/products/${id}/stock`, { stock });
    return data;
  },

  async uploadProductImage(productId: string, file: File, isPrimary: boolean = false) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('isPrimary', String(isPrimary));
    const { data } = await api.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteProductImage(imageId: number) {
    await api.delete(`/images/${imageId}`);
  },

  // Categories
  async getCategories() {
    const { data } = await api.get<Category[]>('/categories');
    return data;
  },

  async getCategory(id: string) {
    const { data } = await api.get<Category>(`/categories/${id}`);
    return data;
  },

  async createCategory(category: Category) {
    const { data } = await api.post<Category>('/categories', category);
    return data;
  },

  async updateCategory(id: string, category: Partial<Category>) {
    const { data } = await api.put<Category>(`/categories/${id}`, category);
    return data;
  },

  async deleteCategory(id: string) {
    await api.delete(`/categories/${id}`);
  },

  async getCategoryStats() {
    const { data } = await api.get('/categories/stats');
    return data;
  },
};

export default adminApi;
