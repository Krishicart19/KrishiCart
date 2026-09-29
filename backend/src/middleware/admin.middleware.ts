import { Request, Response, NextFunction } from 'express';
import { AdminAuthService } from '../services/admin.auth.service';

export interface AdminRequest extends Request {
  adminId?: string;
  adminEmail?: string;
  adminRole?: string;
}

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authentication required' });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = AdminAuthService.verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired admin token' });
    return;
  }

  (req as AdminRequest).adminId = decoded.adminId;
  (req as AdminRequest).adminEmail = decoded.email;
  (req as AdminRequest).adminRole = decoded.role;
  next();
};

export const ownerOnlyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const adminReq = req as AdminRequest;

  if (adminReq.adminRole !== 'owner') {
    res.status(403).json({ error: 'Owner access required' });
    return;
  }

  next();
};
