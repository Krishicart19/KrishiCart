import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './config/database';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'KrishiCart API',
    version: '1.0.0',
    endpoints: {
      categories: '/api/categories',
      products: '/api/products',
      search: '/api/products/search?q=query',
      cart: '/api/cart/:userId',
    },
  });
});

app.use('/api', routes);

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
