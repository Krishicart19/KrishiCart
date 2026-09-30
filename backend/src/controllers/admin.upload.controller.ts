import { Request, Response } from 'express';
import fs from 'fs';
import cloudinary from '../config/cloudinary';
import { AdminProductService } from '../services/admin.product.service';

export const AdminUploadController = {
  async uploadProductImage(req: Request, res: Response): Promise<void> {
    try {
      const { id: productId } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const product = await AdminProductService.findById(productId);
      if (!product) {
        fs.unlinkSync(file.path);
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'krishicart/products',
        public_id: `${productId}-${Date.now()}`,
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      });

      fs.unlinkSync(file.path);

      const isPrimary = req.body.isPrimary === 'true';
      const image = await AdminProductService.addImage(productId, result.secure_url, isPrimary);

      res.status(201).json({
        message: 'Image uploaded successfully',
        image,
        cloudinaryId: result.public_id,
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to upload image' });
    }
  },

  async deleteProductImage(req: Request, res: Response): Promise<void> {
    try {
      const { imageId } = req.params;

      const deleted = await AdminProductService.removeImage(parseInt(imageId));

      if (!deleted) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete image' });
    }
  },

  async uploadCategoryImage(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'krishicart/categories',
        public_id: `category-${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      });

      fs.unlinkSync(file.path);

      res.status(201).json({
        message: 'Image uploaded successfully',
        url: result.secure_url,
        cloudinaryId: result.public_id,
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to upload image' });
    }
  },
};
