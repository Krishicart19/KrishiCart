import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Product } from './Product';

@Entity('categories')
export class Category {
  @PrimaryColumn({ length: 50 })
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 10, nullable: true })
  icon: string;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
