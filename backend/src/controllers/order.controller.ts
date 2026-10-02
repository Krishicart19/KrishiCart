import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';

// UPI Configuration
const UPI_CONFIG = {
  upiId: '8971167050-2@ybl',
  businessName: 'KrishiCart',
  currency: 'INR',
};

export const OrderController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, userName, userMobile, deliveryAddress, pinCode, totalAmount, paymentMethod, items } = req.body;

      if (!userId || !userName || !userMobile || !deliveryAddress || !pinCode || !totalAmount || !items?.length) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const order = await OrderService.create({
        userId,
        userName,
        userMobile,
        deliveryAddress,
        pinCode,
        totalAmount: parseFloat(totalAmount),
        paymentMethod: paymentMethod || 'UPI',
        items,
      });

      // For COD orders, no payment details needed
      if (paymentMethod === 'COD') {
        res.status(201).json({
          order,
          payment: null,
        });
        return;
      }

      // Generate UPI payment link for UPI orders - simplified for better bank compatibility
      const amount = Number(order.totalAmount).toFixed(2);
      const upiLink = `upi://pay?pa=${UPI_CONFIG.upiId}&am=${amount}`;

      res.status(201).json({
        order,
        payment: {
          upiId: UPI_CONFIG.upiId,
          businessName: UPI_CONFIG.businessName,
          amount: Number(order.totalAmount),
          transactionNote: order.upiTransactionNote,
          upiLink,
        },
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const order = await OrderService.findById(id);

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  },

  async getByUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const orders = await OrderService.findByUserId(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  },

  async markPaymentSubmitted(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const order = await OrderService.markPaymentSubmitted(id);

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order' });
    }
  },

  async getUPIConfig(req: Request, res: Response): Promise<void> {
    res.json({
      upiId: UPI_CONFIG.upiId,
      businessName: UPI_CONFIG.businessName,
    });
  },

  async getSavedAddresses(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const addresses = await OrderService.getSavedAddresses(userId);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch saved addresses' });
    }
  },
};

// Admin Order Controller
export const AdminOrderController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { paymentStatus, orderStatus } = req.query;
      const orders = await OrderService.findAll({
        paymentStatus: paymentStatus as any,
        orderStatus: orderStatus as any,
      });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  },

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const order = await OrderService.verifyPayment(id);

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify payment' });
    }
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { orderStatus } = req.body;

      const order = await OrderService.updateOrderStatus(id, orderStatus);

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  },

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await OrderService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  },
};
