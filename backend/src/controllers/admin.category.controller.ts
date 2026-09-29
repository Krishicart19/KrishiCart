import { Request, Response } from 'express';
import { AdminCategoryService } from '../services/admin.category.service';

export const AdminCategoryController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categories = await AdminCategoryService.findAll();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const category = await AdminCategoryService.findById(req.params.id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { id, name, icon } = req.body;

      if (!id || !name) {
        res.status(400).json({ error: 'ID and name are required' });
        return;
      }

      const category = await AdminCategoryService.create({ id, name, icon });
      res.status(201).json(category);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      res.status(400).json({ error: message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { name, icon } = req.body;

      const category = await AdminCategoryService.update(req.params.id, { name, icon });

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.json(category);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update category';
      res.status(400).json({ error: message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await AdminCategoryService.delete(req.params.id);

      if (!deleted) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      res.status(400).json({ error: message });
    }
  },

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminCategoryService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  },
};
