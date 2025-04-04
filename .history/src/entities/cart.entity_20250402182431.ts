import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { CartItem } from './cart-item.entity';
import { CartStatuses } from '../cart/models';

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
    enum: CartStatuses,
    default: CartStatuses.OPEN
  })
  status: CartStatuses;

  @ManyToOne(() => User, (user) => user.carts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => CartItem, cartItem => cartItem.cart)
  items: CartItem[];

  // Helper methods
  isOpen(): boolean {
    return this.status === CartStatuses.OPEN;
  }

  isEmpty(): boolean {
    return !this.items || this.items.length === 0;
  }

  getTotal(): number {
    if (this.isEmpty()) return 0;
    return this.items.reduce((sum, item) => 
      sum + (item.count * item.product.price), 0
    );
  }
}
