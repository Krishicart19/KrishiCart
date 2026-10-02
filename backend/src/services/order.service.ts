import { AppDataSource } from '../config/database';
import { Order, PaymentMethod, PaymentStatus, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';

const orderRepository = () => AppDataSource.getRepository(Order);
const orderItemRepository = () => AppDataSource.getRepository(OrderItem);

export interface CreateOrderData {
  userId: string;
  userName: string;
  userMobile: string;
  deliveryAddress: string;
  pinCode: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  items: {
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
    unit?: string;
    selectedVariants?: string;
  }[];
}

export const OrderService = {
  async create(data: CreateOrderData): Promise<Order> {
    const repo = orderRepository();

    const isCOD = data.paymentMethod === 'COD';

    const order = repo.create({
      userId: data.userId,
      userName: data.userName,
      userMobile: data.userMobile,
      deliveryAddress: data.deliveryAddress,
      pinCode: data.pinCode,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: isCOD ? 'verified' : 'pending', // COD orders are auto-verified
      orderStatus: isCOD ? 'confirmed' : 'placed', // COD orders are auto-confirmed
    });

    const savedOrder = await repo.save(order);

    // Generate UPI transaction note (only for UPI payments)
    if (!isCOD) {
      savedOrder.upiTransactionNote = `KC${savedOrder.id}`;
      await repo.save(savedOrder);
    }

    // Create order items
    const itemRepo = orderItemRepository();
    for (const item of data.items) {
      const orderItem = itemRepo.create({
        orderId: savedOrder.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit,
        selectedVariants: item.selectedVariants,
      });
      await itemRepo.save(orderItem);
    }

    return this.findById(savedOrder.id) as Promise<Order>;
  },

  async findById(id: number): Promise<Order | null> {
    return orderRepository().findOne({
      where: { id },
      relations: ['items'],
    });
  },

  async findByUserId(userId: string): Promise<Order[]> {
    return orderRepository().find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  },

  async getSavedAddresses(userId: string): Promise<Array<{
    userName: string;
    userMobile: string;
    deliveryAddress: string;
    pinCode: string;
  }>> {
    const orders = await orderRepository().find({
      where: { userId },
      order: { createdAt: 'DESC' },
      select: ['userName', 'userMobile', 'deliveryAddress', 'pinCode'],
    });

    // Get unique addresses based on address + pinCode combination
    const uniqueAddresses = new Map();
    for (const order of orders) {
      const key = `${order.deliveryAddress}-${order.pinCode}`;
      if (!uniqueAddresses.has(key)) {
        uniqueAddresses.set(key, {
          userName: order.userName,
          userMobile: order.userMobile,
          deliveryAddress: order.deliveryAddress,
          pinCode: order.pinCode,
        });
      }
    }

    return Array.from(uniqueAddresses.values());
  },

  async findAll(options?: { paymentStatus?: PaymentStatus; orderStatus?: OrderStatus }): Promise<Order[]> {
    const query = orderRepository()
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .orderBy('order.createdAt', 'DESC');

    if (options?.paymentStatus) {
      query.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: options.paymentStatus });
    }

    if (options?.orderStatus) {
      query.andWhere('order.orderStatus = :orderStatus', { orderStatus: options.orderStatus });
    }

    return query.getMany();
  },

  async updatePaymentStatus(id: number, status: PaymentStatus): Promise<Order | null> {
    const repo = orderRepository();
    const order = await repo.findOne({ where: { id } });

    if (!order) return null;

    order.paymentStatus = status;
    if (status === 'verified') {
      order.verifiedAt = new Date();
      order.orderStatus = 'confirmed';
    }

    return repo.save(order);
  },

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | null> {
    const repo = orderRepository();
    const order = await repo.findOne({ where: { id } });

    if (!order) return null;

    order.orderStatus = status;
    return repo.save(order);
  },

  async markPaymentSubmitted(id: number): Promise<Order | null> {
    return this.updatePaymentStatus(id, 'submitted');
  },

  async verifyPayment(id: number): Promise<Order | null> {
    return this.updatePaymentStatus(id, 'verified');
  },

  async getStats() {
    const repo = orderRepository();

    const totalOrders = await repo.count();
    const pendingPayments = await repo.count({ where: { paymentStatus: 'pending' } });
    const submittedPayments = await repo.count({ where: { paymentStatus: 'submitted' } });
    const verifiedPayments = await repo.count({ where: { paymentStatus: 'verified' } });

    const revenueResult = await repo
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.paymentStatus = :status', { status: 'verified' })
      .getRawOne();

    return {
      totalOrders,
      pendingPayments,
      submittedPayments,
      verifiedPayments,
      totalRevenue: parseFloat(revenueResult?.total || '0'),
    };
  },
};
