import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';

const router = Router();

router.get('/:userId', CartController.getCart);
router.post('/:userId/items', CartController.addItem);
router.put('/:userId/items/:productId', CartController.updateQuantity);
router.delete('/:userId/items/:productId', CartController.removeItem);
router.delete('/:userId', CartController.clearCart);

export default router;
