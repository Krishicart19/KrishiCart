import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import { CartItem } from '../entities/CartItem';
import { User } from '../entities/User';
import { Admin } from '../entities/Admin';
import { ProductImage } from '../entities/ProductImage';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { CreateTables1726600000000 } from '../migrations/1726600000000-CreateTables';
import { SeedData1726600000001 } from '../migrations/1726600000001-SeedData';
import { CreateUsersTable1726600000002 } from '../migrations/1726600000002-CreateUsersTable';
import { CreateAdminTables1726600000003 } from '../migrations/1726600000003-CreateAdminTables';
import { AddDiscountColumn1726600000004 } from '../migrations/1726600000004-AddDiscountColumn';
import { AddImageUrlColumns1726600000005 } from '../migrations/1726600000005-AddImageUrlColumns';
import { AddSizesColumn1726600000006 } from '../migrations/1726600000006-AddSizesColumn';
import { CreateOrdersTables1726600000007 } from '../migrations/1726600000007-CreateOrdersTables';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Kira@67050',
  database: process.env.DB_NAME || 'krishicart',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [Category, Product, CartItem, User, Admin, ProductImage, Order, OrderItem],
  migrations: [CreateTables1726600000000, SeedData1726600000001, CreateUsersTable1726600000002, CreateAdminTables1726600000003, AddDiscountColumn1726600000004, AddImageUrlColumns1726600000005, AddSizesColumn1726600000006, CreateOrdersTables1726600000007],
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
