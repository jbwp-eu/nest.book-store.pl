import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Product } from './product.entity';

@Entity('product_reviews')
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'int', default: 0 })
  rate: number;

  @Column()
  userName: string;

  // Relacja wiele-do-jednego (ManyToOne) z produktem:
  // Każda recenzja (ProductReview) jest powiązana dokładnie z jednym produktem (Product).
  // Właściwość (product.ProductReviews) umożliwia dostęp do wszystkich recenzji powiązanych z danym produktem.
  // onDelete: 'CASCADE' oznacza, że jeżeli produkt zostanie usunięty z bazy, to wszystkie powiązane z nim recenzje również zostaną automatycznie usunięte.
  @ManyToOne(() => Product, (product) => product.ProductReviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  Product: Product;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  User: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
