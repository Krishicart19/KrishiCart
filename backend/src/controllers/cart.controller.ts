import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';

export const CartController = {
  async getCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const cart = await CartService.getCart(userId);
      res.json(cart);
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  },

  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { productId, quantity } = req.body;
      const item = await CartService.addItem(userId, productId, quantity);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ error: 'Failed to add item to cart' });
    }
  },

  async updateQuantity(req: Request, res: Response): Promise<void> {
    try {
      const { userId, productId } = req.params;
      const { quantity } = req.body;
      const item = await CartService.updateQuantity(userId, productId, quantity);
      if (item === null && quantity > 0) {
        res.status(404).json({ error: 'Cart item not found' });
        return;
      }
      res.json(item || { message: 'Item removed from cart' });
    } catch (error) {
      console.error('Error updating cart:', error);
      res.status(500).json({ error: 'Failed to update cart' });
    }
  },

  async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const { userId, productId } = req.params;
      const removed = await CartService.removeItem(userId, productId);
      if (!removed) {
        res.status(404).json({ error: 'Cart item not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  },

  async clearCart(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      await CartService.clearCart(userId);
      res.status(204).send();
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  },
};
