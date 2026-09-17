# KrishiCart Backend API

Express.js + TypeORM + PostgreSQL backend for the KrishiCart mobile application.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pgAdmin (optional, for database management)

## Setup Instructions

### 1. Create Database

Open pgAdmin or psql and create a new database:

```sql
CREATE DATABASE krishicart;
```

### 2. Configure Environment

Update the database credentials in `src/config/database.ts` or set environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_NAME=krishicart
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations

This will create all tables and seed initial data:

```bash
npm run db:setup
```

Or run migrations manually:

```bash
npm run migration:run
```

### 5. Start the Server

```bash
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:id` | Get category by ID |
| GET | `/api/products` | List all products |
| GET | `/api/products?category=seeds` | Filter products by category |
| GET | `/api/products/search?q=tomato` | Search products |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/cart/:userId` | Get user's cart |
| POST | `/api/cart/:userId/items` | Add item to cart |
| PUT | `/api/cart/:userId/items/:productId` | Update cart item quantity |
| DELETE | `/api/cart/:userId/items/:productId` | Remove item from cart |

## Project Structure

```
src/
├── config/
│   └── database.ts         # TypeORM data source configuration
├── controllers/
│   ├── category.controller.ts
│   ├── product.controller.ts
│   └── cart.controller.ts
├── entities/
│   ├── Category.ts
│   ├── Product.ts
│   └── CartItem.ts
├── migrations/
│   ├── 1726600000000-CreateTables.ts
│   └── 1726600000001-SeedData.ts
├── routes/
│   ├── index.ts
│   ├── category.routes.ts
│   ├── product.routes.ts
│   └── cart.routes.ts
├── scripts/
│   └── setup-db.ts         # Database setup script
├── services/
│   ├── category.service.ts
│   ├── product.service.ts
│   └── cart.service.ts
└── index.ts                # Express app entry point
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run dev` | Start with hot reload |
| `npm run db:setup` | Run migrations and seed data |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:show` | Show migration status |
