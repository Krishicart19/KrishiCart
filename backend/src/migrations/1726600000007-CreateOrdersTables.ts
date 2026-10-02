import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTables1726600000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(200) NOT NULL,
        user_mobile VARCHAR(15) NOT NULL,
        delivery_address TEXT NOT NULL,
        pin_code VARCHAR(10) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(20) DEFAULT 'UPI',
        payment_status VARCHAR(20) DEFAULT 'pending',
        order_status VARCHAR(20) DEFAULT 'placed',
        upi_transaction_note VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        product_image VARCHAR(500),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        unit VARCHAR(100),
        selected_variants TEXT
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS order_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders`);
  }
}
