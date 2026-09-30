import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { AdminAuthController } from '../controllers/admin.auth.controller';
import { AdminProductController } from '../controllers/admin.product.controller';
import { AdminCategoryController } from '../controllers/admin.category.controller';
import { AdminUploadController } from '../controllers/admin.upload.controller';
import { adminAuthMiddleware, ownerOnlyMiddleware } from '../middleware/admin.middleware';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Public routes
router.post('/auth/login', AdminAuthController.login);

// Protected routes
router.use(adminAuthMiddleware);

// Auth
router.get('/auth/profile', AdminAuthController.getProfile);
router.post('/auth/create', ownerOnlyMiddleware, AdminAuthController.createAdmin);

// Dashboard
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { AdminProductService } = await import('../services/admin.product.service');
    const { AdminCategoryService } = await import('../services/admin.category.service');
    const { AppDataSource } = await import('../config/database');

    const productStats = await AdminProductService.getStats();
    const categoryStats = await AdminCategoryService.getStats();
    const totalUsers = await AppDataSource.getRepository('User').count();

    res.json({
      products: productStats,
      categories: categoryStats.totalCategories,
      users: totalUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Products
router.get('/products', AdminProductController.getAll);
router.get('/products/stats', AdminProductController.getStats);
router.get('/products/:id', AdminProductController.getById);
router.post('/products', AdminProductController.create);
router.put('/products/:id', AdminProductController.update);
router.delete('/products/:id', AdminProductController.delete);
router.patch('/products/:id/stock', AdminProductController.updateStock);

// Product Images
router.post('/products/:id/images', upload.single('image'), AdminUploadController.uploadProductImage);
router.delete('/images/:imageId', AdminUploadController.deleteProductImage);

// Categories
router.get('/categories', AdminCategoryController.getAll);
router.get('/categories/stats', AdminCategoryController.getStats);
router.get('/categories/:id', AdminCategoryController.getById);
router.post('/categories', AdminCategoryController.create);
router.put('/categories/:id', AdminCategoryController.update);
router.delete('/categories/:id', AdminCategoryController.delete);

// Category Images
router.post('/upload/category-image', upload.single('image'), AdminUploadController.uploadCategoryImage);

export default router;
