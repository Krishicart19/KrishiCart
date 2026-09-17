import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';

export const ProductController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.query.category as string | undefined;
      const products = await ProductService.findAll(categoryId);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductService.findById(req.params.id);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  },

  async search(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.json([]);
        return;
      }
      const products = await ProductService.search(query);
      res.json(products);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductService.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductService.update(req.params.id, req.body);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await ProductService.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  },
};
