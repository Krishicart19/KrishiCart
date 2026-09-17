import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTables1726600000000 implements MigrationInterface {
  name = 'CreateTables1726600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10)
      )
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        category_id VARCHAR(50) NOT NULL,
        name VARCHAR(200) NOT NULL,
        unit VARCHAR(100),
        price DECIMAL(10, 2) NOT NULL,
        rating DECIMAL(2, 1) DEFAULT 0,
        emoji VARCHAR(10),
        color VARCHAR(20),
        description TEXT
      )
    `);

    // Create cart_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100),
        product_id VARCHAR(50) NOT NULL,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add foreign key: products -> categories (if not exists)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_category'
        ) THEN
          ALTER TABLE products
          ADD CONSTRAINT fk_products_category
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
        END IF;
      END $$
    `);

    // Add foreign key: cart_items -> products (if not exists)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_cart_items_product'
        ) THEN
          ALTER TABLE cart_items
          ADD CONSTRAINT fk_cart_items_product
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS fk_cart_items_product`);
    await queryRunner.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_category`);
    await queryRunner.query(`DROP TABLE IF EXISTS cart_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS products`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories`);
  }
}
