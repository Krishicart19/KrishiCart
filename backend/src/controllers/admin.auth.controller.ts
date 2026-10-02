import { Request, Response } from 'express';
import { AdminAuthService } from '../services/admin.auth.service';
import { AdminRequest } from '../middleware/admin.middleware';

export const AdminAuthController = {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await AdminAuthService.login({ email, password });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ error: message });
    }
  },

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as AdminRequest).adminId;
      if (!adminId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const admin = await AdminAuthService.getProfile(adminId);
      if (!admin) {
        res.status(404).json({ error: 'Admin not found' });
        return;
      }

      res.json(admin);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  },

  async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      const admin = await AdminAuthService.createAdmin({ name, email, password, role });
      res.status(201).json(admin);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create admin';
      res.status(400).json({ error: message });
    }
  },

  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      // Create admin with default 'admin' role
      const admin = await AdminAuthService.createAdmin({ name, email, password, role: 'admin' });

      // Auto login after signup
      const result = await AdminAuthService.login({ email, password });
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      res.status(400).json({ error: message });
    }
  },
};
