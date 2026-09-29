import { Request, Response } from 'express';
import { AdminProductService } from '../services/admin.product.service';

export const AdminProductController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId, search, page, limit } = req.query;

      const result = await AdminProductService.findAll({
        categoryId: categoryId as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const product = await AdminProductService.findById(req.params.id);

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { id, categoryId, name, unit, price, rating, emoji, color, description, stock, discount } = req.body;

      if (!id || !categoryId || !name || price === undefined) {
        res.status(400).json({ error: 'ID, categoryId, name, and price are required' });
        return;
      }

      const product = await AdminProductService.create({
        id,
        categoryId,
        name,
        unit,
        price: parseFloat(price),
        rating: rating ? parseFloat(rating) : undefined,
        emoji,
        color,
        description,
        stock: stock ? parseInt(stock) : 0,
        discount: discount ? parseInt(discount) : 0,
      });

      res.status(201).json(product);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create product';
      res.status(400).json({ error: message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId, name, unit, price, rating, emoji, color, description, stock, discount } = req.body;

      const updateData: any = {};
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (name !== undefined) updateData.name = name;
      if (unit !== undefined) updateData.unit = unit;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (rating !== undefined) updateData.rating = parseFloat(rating);
      if (emoji !== undefined) updateData.emoji = emoji;
      if (color !== undefined) updateData.color = color;
      if (description !== undefined) updateData.description = description;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (discount !== undefined) updateData.discount = parseInt(discount);

      const product = await AdminProductService.update(req.params.id, updateData);

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product';
      res.status(400).json({ error: message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await AdminProductService.delete(req.params.id);

      if (!deleted) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  },

  async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const { stock } = req.body;

      if (stock === undefined || stock < 0) {
        res.status(400).json({ error: 'Valid stock value is required' });
        return;
      }

      const product = await AdminProductService.updateStock(req.params.id, parseInt(stock));

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update stock' });
    }
  },

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminProductService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  },
};
