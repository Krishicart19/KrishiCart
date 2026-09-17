import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import { CartItem } from '../entities/CartItem';
import { User } from '../entities/User';
import { CreateTables1726600000000 } from '../migrations/1726600000000-CreateTables';
import { SeedData1726600000001 } from '../migrations/1726600000001-SeedData';
import { CreateUsersTable1726600000002 } from '../migrations/1726600000002-CreateUsersTable';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Shambu@3',
  database: process.env.DB_NAME || 'krishicart',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [Category, Product, CartItem, User],
  migrations: [CreateTables1726600000000, SeedData1726600000001, CreateUsersTable1726600000002],
  migrationsTableName: 'typeorm_migrations',
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};
