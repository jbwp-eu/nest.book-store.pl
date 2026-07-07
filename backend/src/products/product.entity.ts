import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductReview } from './product-review.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  // Pole images jest kolumną o typie jsonb (tablica stringów), aby można było przechowywać wiele adresów obrazków w jednym produkcie.
  @Column({ type: 'jsonb' })
  images: string[];

  @Column({ type: 'jsonb', default: [] })
  banners: string[];

  @Column({ default: false })
  isFeatured: boolean;

  @Column('decimal', { precision: 5, scale: 2, default: 1 })
  price: number;

  @Column({ default: 'books' })
  category: string;

  @Column({ default: 1 })
  countInStock: number;

  @Column('decimal', { precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ default: 0 })
  numReviews: number;

  @OneToMany(() => ProductReview, (review) => review.Product)
  ProductReviews: ProductReview[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
