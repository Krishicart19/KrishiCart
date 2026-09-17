import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Initialize connection
    console.log('📡 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully\n');

    // Run migrations
    console.log('📦 Running migrations...');
    const migrations = await AppDataSource.runMigrations();

    if (migrations.length === 0) {
      console.log('ℹ️  No pending migrations to run\n');
    } else {
      console.log(`✅ Executed ${migrations.length} migration(s):`);
      migrations.forEach((m) => console.log(`   - ${m.name}`));
      console.log();
    }

    // Verify data
    const categoryCount = await AppDataSource.query('SELECT COUNT(*) FROM categories');
    const productCount = await AppDataSource.query('SELECT COUNT(*) FROM products');

    console.log('📊 Database summary:');
    console.log(`   - Categories: ${categoryCount[0].count}`);
    console.log(`   - Products: ${productCount[0].count}`);
    console.log();

    console.log('🎉 Database setup completed successfully!');
    console.log('\nYou can now start the server with: npm start\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
