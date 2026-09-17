import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';

export const CategoryController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categories = await CategoryService.findAll();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const category = await CategoryService.findById(req.params.id);
      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const category = await CategoryService.create(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const category = await CategoryService.update(req.params.id, req.body);
      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await CategoryService.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  },
};
