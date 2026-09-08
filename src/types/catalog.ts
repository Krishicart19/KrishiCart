export type Category = {
  id: string;
  name: string;
  icon: string;
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
};

export type CartItem = Product & {
  quantity: number;
};

