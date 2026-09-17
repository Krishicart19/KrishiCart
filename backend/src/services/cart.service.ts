import { AppDataSource } from '../config/database';
import { CartItem } from '../entities/CartItem';

const cartRepository = () => AppDataSource.getRepository(CartItem);

export const CartService = {
  async getCart(userId: string): Promise<CartItem[]> {
    return cartRepository().find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  },

  async addItem(userId: string, productId: string, quantity: number = 1): Promise<CartItem> {
    const repo = cartRepository();
    const existing = await repo.findOne({ where: { userId, productId } });

    if (existing) {
      existing.quantity += quantity;
      return repo.save(existing);
    }

    const item = repo.create({ userId, productId, quantity });
    return repo.save(item);
  },

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<CartItem | null> {
    const repo = cartRepository();
    const item = await repo.findOne({ where: { userId, productId } });

    if (!item) return null;

    if (quantity <= 0) {
      await repo.delete({ userId, productId });
      return null;
    }

    item.quantity = quantity;
    return repo.save(item);
  },

  async removeItem(userId: string, productId: string): Promise<boolean> {
    const result = await cartRepository().delete({ userId, productId });
    return (result.affected ?? 0) > 0;
  },

  async clearCart(userId: string): Promise<boolean> {
    const result = await cartRepository().delete({ userId });
    return (result.affected ?? 0) > 0;
  },
};
