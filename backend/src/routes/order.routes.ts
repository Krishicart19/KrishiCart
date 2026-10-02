import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();

// Get UPI configuration
router.get('/upi-config', OrderController.getUPIConfig);

// Create new order
router.post('/', OrderController.create);

// Get order by ID
router.get('/:id', OrderController.getById);

// Get orders by user ID
router.get('/user/:userId', OrderController.getByUser);

// Get saved addresses for a user
router.get('/addresses/:userId', OrderController.getSavedAddresses);

// Mark payment as submitted (customer clicked pay)
router.put('/:id/payment-submitted', OrderController.markPaymentSubmitted);

export default router;
