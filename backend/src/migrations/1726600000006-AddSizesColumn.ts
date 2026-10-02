import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSizesColumn1726600000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS variants TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products DROP COLUMN IF EXISTS variants
    `);
  }
}
