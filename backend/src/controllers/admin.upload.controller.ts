import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AdminProductService } from '../services/admin.product.service';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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

      const imageUrl = `/uploads/${file.filename}`;
      const isPrimary = req.body.isPrimary === 'true';

      const image = await AdminProductService.addImage(productId, imageUrl, isPrimary);

      res.status(201).json({
        message: 'Image uploaded successfully',
        image,
      });
    } catch (error) {
      if (req.file) {
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
};
