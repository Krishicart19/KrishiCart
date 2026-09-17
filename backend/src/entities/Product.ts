import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './Category';

@Entity('products')
export class Product {
  @PrimaryColumn({ length: 50 })
  id: string;

  @Column({ name: 'category_id', length: 50 })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100, nullable: true })
  unit: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ length: 10, nullable: true })
  emoji: string;

  @Column({ length: 20, nullable: true })
  color: string;

  @Column('text', { nullable: true })
  description: string;
}
