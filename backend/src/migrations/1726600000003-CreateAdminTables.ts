import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminTables1726600000003 implements MigrationInterface {
  name = 'CreateAdminTables1726600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create admins table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)
    `);

    // Add stock column to products table
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0
    `);

    // Create product_images table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_product_images_product
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Seed default owner account (password: admin123)
    await queryRunner.query(`
      INSERT INTO admins (name, email, password, role) VALUES
      ('Owner', 'owner@krishicart.com', '$2a$10$rQnM1v8V8V8V8V8V8V8V8.8V8V8V8V8V8V8V8V8V8V8V8V8V8V8', 'owner')
      ON CONFLICT (email) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS product_images`);
    await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS stock`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_admins_email`);
    await queryRunner.query(`DROP TABLE IF EXISTS admins`);
  }
}
