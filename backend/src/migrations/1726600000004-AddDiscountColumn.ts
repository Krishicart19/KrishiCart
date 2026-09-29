import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountColumn1726600000004 implements MigrationInterface {
  name = 'AddDiscountColumn1726600000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add discount column (percentage 0-100)
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0
    `);

    // Add some sample discounts to existing products
    await queryRunner.query(`
      UPDATE products SET discount = 20 WHERE id = 'apple-kashmiri';
      UPDATE products SET discount = 15 WHERE id = 'mango-alphonso';
      UPDATE products SET discount = 10 WHERE id = 'tomato-seeds';
      UPDATE products SET discount = 25 WHERE id = 'drip-kit';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS discount`);
  }
}
