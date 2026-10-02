import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from './OrderItem';

export type PaymentMethod = 'UPI' | 'COD';
export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'failed';
export type OrderStatus = 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', length: 50 })
  userId: string;

  @Column({ name: 'user_name', length: 200 })
  userName: string;

  @Column({ name: 'user_mobile', length: 15 })
  userMobile: string;

  @Column({ name: 'delivery_address', type: 'text' })
  deliveryAddress: string;

  @Column({ name: 'pin_code', length: 10 })
  pinCode: string;

  @Column('decimal', { name: 'total_amount', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'payment_method', length: 20, default: 'UPI' })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_status', length: 20, default: 'pending' })
  paymentStatus: PaymentStatus;

  @Column({ name: 'order_status', length: 20, default: 'placed' })
  orderStatus: OrderStatus;

  @Column({ name: 'upi_transaction_note', length: 50, nullable: true })
  upiTransactionNote: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
