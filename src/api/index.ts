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
};

export const getApiUrl = (): string => API_BASE;
