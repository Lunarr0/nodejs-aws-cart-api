import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';
import { User } from './user.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string; // Unique identifier for the order

    @ManyToOne(() => User, (user) => user.orders, { nullable: false }) // Link to the user who placed the order
    user: User; // Property to establish the relationship to User

    @ManyToOne(() => Cart, { nullable: true }) // Link to the cart associated with the order
    cart: Cart;

    @Column({ type: 'json', nullable: true })
    payment: object; // Payment information

    @Column({ type: 'json', nullable: true })
    delivery: object; // Delivery information

    @Column({ type: 'text', nullable: true })
    comments: string; // Additional comments

    @Column({ type: 'text', default: 'ORDERED' })
    status: string; // Order status

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number; // Total amount for the order
}
