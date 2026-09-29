import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { Admin } from '../entities/Admin';

const JWT_SECRET = process.env.JWT_SECRET || 'krishicart-admin-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

const adminRepository = () => AppDataSource.getRepository(Admin);

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  admin: Partial<Admin>;
  token: string;
}

export const AdminAuthService = {
  async login(data: AdminLoginData): Promise<AdminAuthResponse> {
    const repo = adminRepository();

    const admin = await repo.findOne({ where: { email: data.email } });
    if (!admin) {
      throw new Error('Invalid email or password');
    }

    if (!admin.isActive) {
      throw new Error('Account is deactivated');
    }

    const isValidPassword = await admin.comparePassword(data.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { admin: admin.toJSON(), token };
  },

  async getProfile(adminId: string): Promise<Partial<Admin> | null> {
    const repo = adminRepository();
    const admin = await repo.findOne({ where: { id: adminId } });
    return admin ? admin.toJSON() : null;
  },

  async createAdmin(data: { name: string; email: string; password: string; role?: string }): Promise<Partial<Admin>> {
    const repo = adminRepository();

    const existing = await repo.findOne({ where: { email: data.email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    const admin = repo.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: (data.role as any) || 'admin',
    });

    await repo.save(admin);
    return admin.toJSON();
  },

  verifyToken(token: string): { adminId: string; email: string; role: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; email: string; role: string };
      return decoded;
    } catch {
      return null;
    }
  },
};
