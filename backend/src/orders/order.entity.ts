import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { OrderItem } from './order-item.entity';

export interface ShippingAddress {
  address: string;
  city: string;
  code: string;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  shippingAddress: ShippingAddress;

  @Column()
  paymentMethod: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  itemsPrice: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  shippingPrice: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  taxPrice: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ default: false })
  isDelivered: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  paymentResult: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  stripePaymentIntentId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  User: User;

  @OneToMany(() => OrderItem, (item) => item.order)
  OrderItems: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
