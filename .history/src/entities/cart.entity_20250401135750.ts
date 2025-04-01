import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string; // Not a foreign key reference

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'enum', enum: ['OPEN', 'ORDERED'] })
    status: 'OPEN' | 'ORDERED';

    @ManyToOne(() => User, (user) => user.carts, { nullable: false })
    user: User; // Link to the User entity

    @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
    cartItems: CartItem[]; // Link to the CartItems associated with this cart
}
