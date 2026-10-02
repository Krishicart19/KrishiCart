import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id', length: 50 })
  productId: string;

  @Column({ name: 'product_name', length: 200 })
  productName: string;

  @Column({ name: 'product_image', length: 500, nullable: true })
  productImage: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ length: 100, nullable: true })
  unit: string;

  @Column({ name: 'selected_variants', type: 'text', nullable: true })
  selectedVariants: string;
}
