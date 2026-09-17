import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export const AuthController = {
  async signUp(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, mobileNumber, password, pinCode, address } = req.body;

      if (!fullName || !email || !mobileNumber || !password || !pinCode || !address) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      const result = await AuthService.signUp({
        fullName,
        email,
        mobileNumber,
        password,
        pinCode,
        address,
      });

      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      res.status(400).json({ error: message });
    }
  },

  async signIn(req: Request, res: Response): Promise<void> {
    try {
      const { mobileNumber, password } = req.body;

      if (!mobileNumber || !password) {
        res.status(400).json({ error: 'Mobile number and password are required' });
        return;
      }

      const result = await AuthService.signIn({ mobileNumber, password });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      res.status(401).json({ error: message });
    }
  },

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const user = await AuthService.getProfile(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { fullName, mobileNumber, pinCode, address, password } = req.body;

      const user = await AuthService.updateProfile(userId, {
        fullName,
        mobileNumber,
        pinCode,
        address,
        password,
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },
};
