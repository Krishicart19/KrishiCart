export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type ProductImage = {
  id: number;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  unit: string;
  price: number;
  rating: number;
  emoji: string;
  color: string;
  description: string;
  discount?: number;
  imageUrl?: string;
  images?: ProductImage[];
  variants?: string;
};

export type CartItem = Product & {
  quantity: number;
};

