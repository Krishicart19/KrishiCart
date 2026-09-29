import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Admin } from '../entities/Admin';

async function createAdmin() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const adminRepo = AppDataSource.getRepository(Admin);

    // Check if admin already exists
    const existing = await adminRepo.findOne({ where: { email: 'owner@krishicart.com' } });

    if (existing) {
      console.log('Admin already exists:', existing.email);
      // Update password if needed
      existing.password = 'admin123';
      await adminRepo.save(existing);
      console.log('Password updated to: admin123');
    } else {
      // Create new admin
      const admin = adminRepo.create({
        name: 'Owner',
        email: 'owner@krishicart.com',
        password: 'admin123',
        role: 'owner',
      });
      await adminRepo.save(admin);
      console.log('Admin created successfully!');
      console.log('Email: owner@krishicart.com');
      console.log('Password: admin123');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
