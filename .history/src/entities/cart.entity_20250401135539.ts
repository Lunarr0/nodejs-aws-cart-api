import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
    @PrimaryGeneratedColumn('uuid')
    id: string; // Unique identifier for the cart

    @ManyToOne(() => User, (user) => user.carts, { nullable: false }) // Link to the user who owns the cart
    user: User; // Property to establish the relationship to User

    @CreateDateColumn()
    created_at: Date; // Date when the cart was created

    @UpdateDateColumn()
    updated_at: Date; // Date when the cart was last updated

    @Column({ type: 'enum', enum: ['OPEN', 'ORDERED'] })
    status: 'OPEN' | 'ORDERED'; // Cart status

    @OneToMany(() => CartItem, (cartItem) => cartItem.cart) // Link to the cart items associated with this cart
    cartItems: CartItem[];
}
