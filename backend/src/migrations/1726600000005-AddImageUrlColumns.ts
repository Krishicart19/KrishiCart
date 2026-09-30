import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlColumns1726600000005 implements MigrationInterface {
  name = 'AddImageUrlColumns1726600000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)
    `);

    await queryRunner.query(`
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS image_url`);
    await queryRunner.query(`ALTER TABLE categories DROP COLUMN IF EXISTS image_url`);
  }
}
