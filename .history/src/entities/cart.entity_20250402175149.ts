import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { CartItem } from './cart-item.entity';


export enum CartStatus {
    OPEN = 'OPEN',
    ORDERED = 'ORDERED'
}

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatuses.OPEN
  })
  status: CartStatuses;

  @OneToMany(() => CartItem, cartItem => cartItem.cart)
  items: CartItem[];
}
