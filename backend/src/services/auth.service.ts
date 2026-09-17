import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

const JWT_SECRET = process.env.JWT_SECRET || 'krishicart-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

const userRepository = () => AppDataSource.getRepository(User);

export interface SignUpData {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  pinCode: string;
  address: string;
}

export interface SignInData {
  mobileNumber: string;
  password: string;
}

export interface AuthResponse {
  user: Partial<User>;
  token: string;
}

export const AuthService = {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    const repo = userRepository();

    const existingUser = await repo.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const user = repo.create(data);
    await repo.save(user);

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return { user: user.toJSON(), token };
  },

  async signIn(data: SignInData): Promise<AuthResponse> {
    const repo = userRepository();

    const user = await repo.findOne({ where: { mobileNumber: data.mobileNumber } });
    if (!user) {
      throw new Error('Invalid mobile number or password');
    }

    const isValidPassword = await user.comparePassword(data.password);
    if (!isValidPassword) {
      throw new Error('Invalid mobile number or password');
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return { user: user.toJSON(), token };
  },

  async getProfile(userId: string): Promise<Partial<User> | null> {
    const repo = userRepository();
    const user = await repo.findOne({ where: { id: userId } });
    return user ? user.toJSON() : null;
  },

  async updateProfile(userId: string, data: Partial<SignUpData>): Promise<Partial<User> | null> {
    const repo = userRepository();

    const user = await repo.findOne({ where: { id: userId } });
    if (!user) return null;

    if (data.fullName) user.fullName = data.fullName;
    if (data.mobileNumber) user.mobileNumber = data.mobileNumber;
    if (data.pinCode) user.pinCode = data.pinCode;
    if (data.address) user.address = data.address;
    if (data.password) user.password = data.password;

    await repo.save(user);
    return user.toJSON();
  },

  verifyToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      return decoded;
    } catch {
      return null;
    }
  },
};
